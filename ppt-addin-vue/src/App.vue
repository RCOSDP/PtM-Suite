<template>
  <div id="app">
    <div class="content">
      <div class="content-main">
        <el-row class="padding">
          <el-button type="primary" size="large" @click="onSynthesis">音声合成</el-button>
        </el-row>
        <el-alert
          v-if="show_message"
          :closable="false">{{message}}
        </el-alert>
        <el-row class="padding">
          音声名: 
          <el-select v-model="voice" style="width: 40%;padding: 6px;">
            <el-option
              v-for="voice in optionVoice"
              :key="voice.name"
              :label="voice.name"
              :value="voice.name" >
            </el-option>
          </el-select><br>
        </el-row>
        <el-row class="padding">
          サンプルレート:
          <el-select v-model="samplerate" style="width: 40%;padding: 6px;">
            <el-option v-for="sr in optionSamplerate"
              :key="sr.name"
              :label="sr.name"
              :value="sr.name" >
            </el-option>
          </el-select><br>
        </el-row>
        <el-row class="padding">
          <el-switch v-model="engine" active-value="local" inactive-value="polly">
          </el-switch>
          このマシンで音声合成する。
        </el-row>
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
    padding: 4px 10px;
  }
</style>
