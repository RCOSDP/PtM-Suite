#!/usr/bin/env node

const {config} = require('../src/config.js');
const video = require('../src/video.js');

if (config._.length !== 1) {
  console.log('Usage: node ppt2video.js filename');
  process.exit(-1);
}
  
video.ppt2video(config._[0]);
