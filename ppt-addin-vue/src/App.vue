<template>
  <div id="app">
    <div class="content">
      <div class="content-main">
        <div class="padding">
          <p>選択した文字列を音声合成します。</p>
          <button @click="onSynthesis">音声合成</button>
        </div>
        <div class="padding" v-show="show_message">
          エラー: {{message}}
        </div>
        <div class="padding">
          音声名: 
          <select v-model="voice">
            <option v-for="voice in optionVoice"
              v-bind:value="voice.name"
              v-bind:key="voice.name" >
              {{voice.name}}
            </option>
          </select><br>
          サンプルレート:
          <select v-model="samplerate">
            <option v-for="sr in optionSamplerate"
              v-bind:value="sr.name"
              v-bind:key="sr.name" >
              {{sr.name}}
            </option>
          </select><br>
          <input type="checkbox" v-model="engine" true-value="local" false-value="polly" >
          このマシンで音声合成する。
        </div>
        <hr>
        <div class="padding">
          参考リンク:<br>
          <a href="https://www.speechmarkdown.org/" target="_blank" rel="noopener noreferrer">
          Speech Markdown ホームページ</a>
          <a href="https://www.speechmarkdown.org/basics/what/" target="_blank" rel="noopener noreferrer">
          Speech Markdown ドキュメント</a>
          <a href="https://docs.aws.amazon.com/polly/latest/dg/polly-dg.pdf" target="_blank" rel="noopener noreferrer">
          Amazon Polly Developer Guide</a>
          <a href="https://aws.amazon.com/jp/blogs/news/amazon-polly-japanese-text-optimization/" target="_blank" rel="noopener noreferrer">
          Amazon Polly を使用した日本語テキスト読み上げの最適化</a>
        </div>
        <hr>
        <div class="padding">
          以下の形式のマークダウン記法をサポートしています。
          <dl>
            <dt>(日本橋)[ruby:"にっぽんばし"] ⇒</dt>
            <dd>&lt;phoneme type="ruby" ph="にっぽんばし"&gt;日本橋&lt;/phoneme&gt;</dd>
            <dt>(彼氏)[kana:"カレシ"] ⇒</dt>
            <dd>&lt;phoneme alphabet="x-amazon-pron-kana" ph="カレシ"&gt;彼氏&lt;/phoneme&gt;</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex';

export default {
  name: 'App',
  data() {
    return {
      voice: 'Takumi',
      optionVoice: [
        { name: 'Mizuki'},
        { name: 'Takumi'},
      ],
      samplerate: '22050',
      optionSamplerate: [
        { name: '8000'},
        { name: '16000'},
        { name: '22050'},
        { name: '24000'},
      ],
      engine: 'polly',
    }
  },
  methods: {
    onSynthesis(){
      const {voice, samplerate, engine} = this;
      this.$store.dispatch('onSynthesis', {voice, samplerate, engine});
    }
  },
  computed: mapState([
    'show_message',
    'message',
  ])
}
</script>

<style>
  .content-main {
    background: #fff;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
  }

  .padding {
    padding: 15px;
  }
</style>
