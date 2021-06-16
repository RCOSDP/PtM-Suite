import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import axios from 'axios'
import {SpeechMarkdown} from 'speechmarkdown-js'

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

const store = new Vuex.Store({
  actions: {
    async onSynthesis(_, vc) {
      console.log(vc.voice, vc.samplerate, vc.engine);
      try {
        const text = await getSelectedText();
        let ut = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(ut);
      } catch(error) {
        console.log('error occured in onSynthesis')
        speechSynthesis.cancel();
      }
    },

    async onPolly(_, {TextType}) {
      try {
        let text = await getSelectedText();
        if (TextType == "markdown") {
          text = speech.toSSML(text, {platform: 'amazon-alexa'});
          TextType = "ssml";
        }
        console.log(text);
        const data = {
          OutputFormat: "mp3",
          SampleRate: "8000",
          Text: text,
          TextType,
          VoiceId: "Takumi"
        };
        const config = {
          responseType: 'arraybuffer'
        };
        const res = await axios.post('/polly', data, config);
        const blob = new Blob([res.data], { type: res.headers['content-type'] })
        const objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        audio.onload = function() {
          URL.revokeObjectURL(objectUrl);
        };
        audio.play();
      } catch(error) {
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
