#!/usr/bin/env node

import {config} from '../src/config.js';
import {ppt2video} from '../src/video.js';
import {getPptx as getPptxWithTika} from '../src/tika.js';
import {initPptx, getPptxData} from '../src/pptx.js';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import xpath  from 'xpath';

if (config._.length !== 1) {
  console.log('Usage: node ppt2video.js filename');
  process.exit(-1);
}

async function getPptxWithPptx(filename) {
  const data = fs.readFileSync(filename);
  return getPptxData(data);
}

if (!config.usetika) {
  initPptx(JSDOM, xpath);
}

ppt2video(config._[0], config.usetika?getPptxWithTika:getPptxWithPptx);
