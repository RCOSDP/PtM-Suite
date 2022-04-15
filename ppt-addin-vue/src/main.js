import axios from 'axios'
import { SpeechMarkdown } from 'speechmarkdown-js'
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/ja'
import 'element-ui/lib/theme-chalk/index.css'
import {pollyUrl, dialogStartUrl} from './config.js'

Vue.use(Vuex);
Vue.use(ElementUI, {locale});
Vue.config.productionTip = false;

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
    console.log('error occured in engineLocal')
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
    console.log('error occured in enginePolly: markdown')
    throw {message: error.type};
  }

  try {
    const data = {
      OutputFormat: "mp3",
      SampleRate: samplerate,
      Text: text,
      TextType: 'ssml',
      VoiceId: voice,
    };
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
      }
      error.message = new TextDecoder().decode(new Uint8Array(error.response.data));
    }
    console.log('error occured in enginePolly: call polly')
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
    console.log('error occured in enginePolly: play');
    throw error;
  }
}

let dialog = null;

function processMessage(arg) {
  console.log('processMessage called');
  token = arg.message;
  store.commit('setAuthorized', true);
  saveToken(token);
  if (dialog) {
    dialog.close();
  }
}

function dialogCallback(asyncResult) {
  console.log('dialogCallback called');
  console.log(asyncResult);
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
  try {
    await axios.post(pollyUrl, {}, config);
  } catch (error) {
    token = null;
  }
  console.log("restoreToken token is " + token);
  store.commit('setAuthorized', token !== null);
}

const store = new Vuex.Store({
  state: {
    show_message: false,
    message: "",
    authorized: false,
  },
  mutations: {
    setMessage(state, message) {
      state.show_message = message.length > 0;
      state.message = message;
    },
    setAuthorized(state, authorized) {
      state.authorized = authorized;
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
        console.log('error occured in onSynthesis');
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
  new Vue({
    render: h => h(App),
    store,
    created: async function() {
      await restoreToken();
    }
  }).$mount('#app');
};
