import axios from 'axios'
import { SpeechMarkdown } from 'speechmarkdown-js'
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/ja'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(Vuex);
Vue.use(ElementUI, {locale});
Vue.config.productionTip = false

/* global Office, OfficeExtension */

const audio = new Audio();
const speech = new SpeechMarkdown();

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
      responseType: 'arraybuffer'
    };
    // select and request to local or remote polly endpoint
    const remoteServer = process.env.POLLY_SERVER || "https://polly-server-one.vercel.app";
    const endpoint = "/polly";
    const pollyUrl =
      document.location.hostname == "localhost"
        ? endpoint
        : `${remoteServer}${endpoint}`;
    res = await axios.post(pollyUrl, data, config);
  } catch (error) {
    if (error.response) {
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
  console.log(arg);
  engineLocal("メッセージを受信しました");
  store.commit('setMessage', arg.message);
}

function dialogCallback(asyncResult) {
  console.log('dialogCallback called');
  console.log(asyncResult);
  dialog = asyncResult.value;
  dialog.addEventHandler(Office.EventType.DialogMessageReceived, processMessage);
}

const store = new Vuex.Store({
  state: {
    show_message: false,
    message: "",
  },
  mutations: {
    setMessage(state, message) {
      state.show_message = message.length > 0;
      state.message = message;
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
      Office.context.ui.displayDialogAsync(document.location.origin + '/dialog/start',option,dialogCallback);
    }
  }
});

window.Office.initialize = () => {
  new Vue({
    render: h => h(App),
    store
  }).$mount('#app');
};
