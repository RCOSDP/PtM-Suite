import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import axios from 'axios'

Vue.use(Vuex);
Vue.config.productionTip = false

/* global Office, OfficeExtension */

const audio = new Audio();

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
    async onSynthesis() {
      try {
        const text = await getSelectedText();
        let ut = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(ut);
      } catch(error) {
        console.log('error occured in onSynthesis')
      }
    },

    async onPolly() {
      try {
        const text = await getSelectedText();
        const data = {
          OutputFormat: "mp3",
          SampleRate: "8000",
          Text: text,
          TextType: "text",
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
