import axios from 'axios'
import { SpeechMarkdown } from 'speechmarkdown-js'
import { createApp } from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import ElementUI from 'element-plus'
import locale from 'element-plus/lib/locale/lang/ja'
import 'element-plus/theme-chalk/index.css'
import {pollyUrl, dialogStartUrl} from './config.js'

/* global Office, OfficeExtension */

const audio = new Audio();
const speech = new SpeechMarkdown();
let token = null;

async function getSelectedText() {
  return new OfficeExtension.Promise(function (resolve, reject) {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      result => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(result.error.message);
        }
        resolve(result.value);
      }
    );
  });
}

function engineLocal(text) {
  try {
    speechSynthesis.cancel();
    text = text.replace(/<\/?speak>/g,'');
    text = speech.toText(text);
    let ut = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(ut);
  } catch (error) {
    console.log('error occurred in engineLocal')
    speechSynthesis.cancel();
    throw error;
  }
}

async function enginePolly(text, {voice, samplerate}) {
  let res;
  try {
    text = text.replace(/<\/?speak>/g,'').replace(/\v/g,'');
    text = speech.toSSML(text, {platform: 'amazon-alexa'});
  } catch (error) {
    console.log('error occurred in enginePolly: markdown')
    throw {message: `マークダウンに誤りがあります(${error.type})。`};
  }

  try {
    const data = {
      OutputFormat: "mp3",
      SampleRate: samplerate,
      Text: text,
      TextType: 'ssml',
      VoiceId: voice,
    };
    // Takumi default engine
    if (data.VoiceId == 'Takumi' || data.VoiceId == 'Joanna' || data.VoiceId == 'Matthew' ) {
      data.Engine = 'neural';
    }
    const config = {
      responseType: 'arraybuffer',
      headers: {},
    };
    if (token !== null) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    res = await axios.post(pollyUrl, data, config);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        store.commit('setAuthorized', false);
        error.message = "ログインしてください。";
      } else if (error.response.status === 400) {
        const error_code = new TextDecoder().decode(new Uint8Array(error.response.data));
        switch (error_code) {
          case 'InvalidSsmlException':
            error.message = "SSMLの書式が不正です。";
            break;
          case 'TextLengthExceededException':
            error.message = "文字列が長すぎます。";
            break;
          default:
            error.message = `システムエラーが発生しました(${error_code})`;
            break;
        }
      } else if (error.response.status === 503) {
        error.message = `サービスが停止中です。`;
      } else {
        error.message = `不明なエラーが発生しました(HTTP Status: ${error.response.status})。`;
      }
    }
    console.log('error occurred in enginePolly: call polly')
    throw error;
  }

  try {
    const blob = new Blob([res.data], { type: res.headers['content-type'] })
    const objectUrl = URL.createObjectURL(blob);
    audio.src = objectUrl;
    audio.onload = function () {
      URL.revokeObjectURL(objectUrl);
    };
    audio.play();
  } catch (error) {
    console.log('error occurred in enginePolly: play');
    throw error;
  }
}

let dialog = null;

function processMessage(arg) {
  console.log('processMessage called');
  if (arg.message === 'close' && dialog) {
    dialog.close();
  } else {
    token = arg.message;
    store.commit('setAuthorized', 'authorized');
    saveToken(token);
  }
}

function dialogCallback(asyncResult) {
  console.log('dialogCallback called');
//  console.log(asyncResult);
  dialog = asyncResult.value;
  dialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
}

const itemName = "pollyProxy";

function saveToken(token) {
  localStorage.setItem(itemName, token);
}

async function restoreToken() {
  console.log("restoreToken called");
  token = localStorage.getItem(itemName);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
  };
  let auth_state = "unauthorized";
  try {
    const res = await axios.post(pollyUrl, {}, config);
    auth_state = res.data;
  } catch (error) {
    token = null;
  }
//  console.log("restoreToken token is " + token);
  store.commit('setAuthorized', auth_state);
}

const store = new Vuex.Store({
  state: {
    show_message: false,
    message: "",
    authorized: false,
    show_login: true,
  },
  mutations: {
    setMessage(state, message) {
      state.show_message = message.length > 0;
      state.message = message;
    },
    setAuthorized(state, auth_state) {
      switch (auth_state) {
        case 'authorized':
          state.authorized = true;
          state.show_login = true;
          break;
        case 'unauthorized':
          state.authorized = false;
          state.show_login = true;
          break;
        case 'noauthorize':
          state.authorized = true;
          state.show_login = false;
          break;
      }
    }
  },
  actions: {
    async onSynthesis(_, {voice, samplerate, engine}) {
      this.commit('setMessage', "");
      try {
        let text = await getSelectedText();
        if (text.length === 0) {
          throw {message: "文字列を選択してください。"};
        }
        switch(engine) {
          case 'local':
            engineLocal(text);
            break;
          case 'polly':
            await enginePolly(text, {voice, samplerate});
            break;
        }
      } catch (error) {
        console.log('error occurred in onSynthesis');
        this.commit('setMessage', error.message);
      }
    },
    async startLogin() {
      console.log('startLogin called');
      const option = {width: 50, height: 50};
      Office.context.ui.displayDialogAsync(dialogStartUrl, option,dialogCallback);
    }
  }
});

window.Office.initialize = () => {
  createApp({
    ...App,
    created: async function() {
      await restoreToken();
    }
  }).use(store).use(ElementUI, {locale}).mount('#app');
};
