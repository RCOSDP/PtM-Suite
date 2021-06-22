import axios from 'axios'
import { SpeechMarkdown } from 'speechmarkdown-js'
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'

Vue.use(Vuex);
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

async function engineLocal(text) {
  try {
    text = text.replace(/<\/?speak>/g,'');
    text = speech.toText(text);
    let ut = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(ut);
  } catch (error) {
    console.log('error occured in engineLocal')
    speechSynthesis.cancel();
  }
}

async function enginePolly(text, {voice, samplerate}) {
  try {
    text = text.replace(/<\/?speak>/g,'');
    text = speech.toSSML(text, {platform: 'amazon-alexa'});
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
    const remoteServer = process.env.POLLY_SERVER
      ? process.env.POLLY_SERVER
      : "https://polly-server-one.vercel.app";
    const endpoint = "/polly";
    const pollyUrl =
      document.location.host == "localhost"
        ? endpoint
        : `${remoteServer}${endpoint}`;
    const res = await axios.post(pollyUrl, data, config);
    const blob = new Blob([res.data], { type: res.headers['content-type'] })
    const objectUrl = URL.createObjectURL(blob);
    audio.src = objectUrl;
    audio.onload = function () {
      URL.revokeObjectURL(objectUrl);
    };
    audio.play();
  } catch (error) {
    console.log('error occured in enginePolly')
  }
}

const store = new Vuex.Store({
  actions: {
    async onSynthesis(_, {voice, samplerate, engine}) {
      try {
        let text = await getSelectedText();
        switch(engine) {
          case 'local':
            engineLocal(text);
            break;
          case 'polly':
            enginePolly(text, {voice, samplerate});
            break;
        }
      } catch (error) {
        console.log('error occured in onSynthesis')
      }
    }
  }
});

window.Office.initialize = () => {
  new Vue({
    render: h => h(App),
    store
  }).$mount('#app');
};
