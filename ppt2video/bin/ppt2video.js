#!/usr/bin/env node

import {config} from '../src/config.js';
import {ppt2video} from '../src/video.js';
import * as pp from '../src/tika.js';

if (config._.length !== 1) {
  console.log('Usage: node ppt2video.js filename');
  process.exit(-1);
}
  
ppt2video(config._[0], pp);
