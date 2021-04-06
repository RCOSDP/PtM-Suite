<template>
  <div id="app">
    <div class="content">
      <div class="content-main">
        <div class="padding">
          <p>選択した文字列を音声合成します。</p>
          <button @click="onSynthesis">音声合成</button>
        </div>
        <div class="padding">
          <p>選択した文字列をAWS Pollyで音声合成します。</p>
          <button @click="onPolly">AWS Polly</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapActions} from 'vuex'

export default {
  name: 'App',
  methods: {
    ...mapActions([
      'onSynthesis',
      'onPolly'
    ])
  }
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
