#!/usr/bin/env node

import {config} from '../src/config.js';
import {ppt2video} from '../src/video.js';
import {getPptx as getPptxWithTika} from '../src/tika.js';
import {getPptxData} from '../src/pptx.js';
import fs from 'fs';

if (config._.length !== 1) {
  console.log('Usage: node ppt2video.js filename');
  process.exit(-1);
}

async function getPptxWithPptx(filename) {
  const data = fs.readFileSync(filename);
  return getPptxData(data);
}

ppt2video(config._[0], config.usetika?getPptxWithTika:getPptxWithPptx);
