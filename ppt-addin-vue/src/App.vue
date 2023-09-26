<template>
  <div id="app">
    <div class="content">
      <div class="content-main">
        <div class="hedder">
          <img src="./assets/hedder.png" />
        </div>
        <el-row class="padding">
          <span class="heading">話者</span><br>
          <div class="center">
            <el-select v-model="voice" style="width: 95%;padding: 8px;">
              <el-option
                v-for="voice in optionVoice"
                :key="voice.name"
                :label="voice.name"
                :value="voice.name" >
              </el-option>
            </el-select><br>
          </div>
        </el-row>
        <div class="padding">
          <div class="center">
            <el-button class="btn" type="primary" size="large" v-bind:disabled="!authorized" @click="onSynthesis">音声の確認<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.754 15a2.249 2.249 0 0 1 2.249 2.249v.918a2.75 2.75 0 0 1-.513 1.6C14.945 21.93 12.42 23 9 23c-3.421 0-5.944-1.072-7.486-3.236a2.75 2.75 0 0 1-.51-1.596v-.92A2.249 2.249 0 0 1 3.251 15h11.502Zm4.3-13.596a.75.75 0 0 1 1.023.279A12.693 12.693 0 0 1 21.75 8c0 2.254-.586 4.424-1.684 6.336a.75.75 0 1 1-1.3-.746A11.195 11.195 0 0 0 20.25 8c0-1.983-.513-3.89-1.475-5.573a.75.75 0 0 1 .279-1.023ZM9 3.004a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm6.588.396a.75.75 0 0 1 1.023.28A8.712 8.712 0 0 1 17.75 8c0 1.538-.398 3.02-1.144 4.328a.75.75 0 1 1-1.303-.743A7.214 7.214 0 0 0 16.25 8a7.213 7.213 0 0 0-.943-3.578.75.75 0 0 1 .281-1.022Z" fill="#FFFFFF"/></svg></el-button>
          </div>
        </div>
        <div class="padding" v-if="show_login">
          <div class="center">
            <el-button class="btn" type="primary" size="large" v-bind:disabled="authorized" @click="startLogin">ログイン</el-button>
          </div>
        </div>
        <el-alert
          v-if="show_message"
          :closable="false">{{message}}
        </el-alert>
        <hr>
        <div class="padding">
          <span class="heading">よく使うタグ</span><br>
          <br>
          <div class="center">
            <dl>
              <dt>
                <span class="description">例 : [break:"0.5s"]</span>
              </dt>
              <dt>
                <span class="description">例 : (TIES)[ruby:"たいず"]</span>
              </dt>
              <dt>
                <span class="description">例 : (音声)[kana:"オ'ンセイ"]</span>
              </dt>
              <dt>
                <span class="description">詳細は<a href="https://docs.cccties.org/chilospeech/narration/text#narshonsukuriputo" target="_blank" rel="noopener noreferrer">こちら</a></span>
              </dt>
            </dl>
          </div>
        </div>
        <div class="padding footer">
          リンク <br>
          <ul>
            <li><a href="https://docs.cccties.org/chilospeech/" target="_blank" rel="noopener noreferrer">マニュアル</a></li>
            <li><a href="https://docs.aws.amazon.com/ja_jp/polly/latest/dg/supportedtags.html" target="_blank" rel="noopener noreferrer">サポートされている SSML タグ</a></li>
            <li><a href="https://www.speechmarkdown.org/basics/what/" target="_blank" rel="noopener noreferrer">What Is Speech Markdown?</a></li>
          </ul>
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
        { name: 'Joanna'},
        { name: 'Matthew'},
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
    },
    startLogin(){
      this.$store.dispatch('startLogin');
    }
  },
  computed: mapState([
    'show_message',
    'message',
    'authorized',
    'show_login',
  ])
}
</script>

<style>
  .content-main {
    font-family: 'Meiryo UI', Meiryo, メイリオ, 'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro', 'Yu Gothic Medium', '游ゴシック Medium', YuGothic, '游ゴシック体', sans-serif;
    color: #333333;
    background: #fff;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
  }

  .hedder img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }

  .padding {
    padding: 4px 10px;
  }

  .center {
    text-align: center;
  }

  .heading {
    font-size: large;
    color: #000000;
  }

  .description {
    font-size: small;
    padding-left: 15px;
    float: left;
  }

  .btn {
    font-family: 'Meiryo UI', Meiryo, メイリオ, 'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro', 'Yu Gothic Medium', '游ゴシック Medium', YuGothic, '游ゴシック体', sans-serif;
    color: #FFFFFF;
    border-radius: unset;
    width: 95%;
    padding: 0.6em;
    position: relative;
  }

  .btn svg {
    position: absolute;
    top: 10%;
    right: 0;
  }

  dl {
    margin-top: 0;
    margin-bottom: 0;
  }

  dt {
    padding: 10px 0;
  }

  .footer {
    font-size: medium;
    background: lightgray;
    width: 100%;
    position: fixed;
    bottom: 0;
  }

  .footer ul {
    list-style: none;
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 10px;
  }

  .footer ul>li {
    padding: 0 0 0 1em;
    position: relative;
  }

  .footer ul>li>a {
    color: #3994CC;
  }

  .footer ul>li::before {
    content: "";
    width: 0;
    height: 0;
    border: 0.3em solid transparent;
    border-left: 0.4em solid #000000;
    transform: translateY(-50%);
    position: absolute;
    top: 50%;
    left: 0;
  }
</style>
