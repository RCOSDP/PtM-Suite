import minimist from 'minimist';
import { boolean } from 'boolean';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stringOptions = {
  tempDir:     process.env.PPT2VIDEO_TEMP_DIR    || './',
  outputDir:   process.env.PPT2VIDEO_OUTPUT_DIR  || './',
  libDir:      process.env.PPT2VIDEO_LIB_DIR     || __dirname + '/../lib',
  tikaJar:     process.env.PPT2VIDEO_TIKA_JAR    || 'tika-app-1.26.jar',
  ffmpegCmd:   process.env.PPT2VIDEO_FFMPEG_CMD  || 'ffmpeg',
  libopenh264: process.env.PPT2VIDEO_LIBOPENH264 || 'libopenh264.so.6',
  voice:       process.env.PPT2VIDEO_VOICE       || 'Takumi',
  engine:      process.env.PPT2VIDEO_ENGINE      || 'neural',
  vcodec:      process.env.PPT2VIDEO_VCODEC      || 'libopenh264',
  voption:     process.env.PPT2VIDEO_VOPTION,
  acodec:      process.env.PPT2VIDEO_ACODEC      || 'aac',
  aoption:     process.env.PPT2VIDEO_AOPTION     || '',
  logfile:     process.env.PPT2VIDEO_LOGFILE     || 'ppt2video.log',
  loglevel:    process.env.PPT2VIDEO_LOGLEVEL    || 'info',
  sampleRate:  process.env.PPT2VIDEO_SAMPLERATE  || '22050',
  pollyProxy:  process.env.PPT2VIDEO_POLLY_PROXY,
};

const voption_default = {
  libopenh264: '-maxrate 250k -allow_skip_frames 1',
  libx264: '',
}

function numberOption(env, value) {
  if (typeof env !== 'undefined') {
    value = parseFloat(env);
  }
  return value;
}

const numberOptions = {
  delay: numberOption(process.env.PPT2VIDEO_DELAY, 1.0),
  pad:   numberOption(process.env.PPT2VIDEO_PAD, 1.0),
  fade:  numberOption(process.env.PPT2VIDEO_FADE, 0),
};

function boolOption(env, value) {
  if (typeof env !== 'undefined') {
    value = boolean(env);
  }
  return value;
}

const boolOptions = {
  novideo: false,
  sectionPerTopic: boolOption(process.env.PPT2VIDEO_SECTION_PER_TOPIC, true),
  usetika: false,
};

export const config = minimist(process.argv.slice(2), {
  string: Object.keys(stringOptions),
  boolean: Object.keys(boolOptions),
  alias: {
    t: 'tempDir',
    o: 'outputDir',
    v: 'vcodec',
    n: 'novideo',
  },
  default: {
    ...stringOptions,
    ...numberOptions,
    ...boolOptions
  }
});

const validVcode = ['libopenh264', 'libx264'];
if (!validVcode.includes(config.vcodec)) {
  console.log('invalid vcodec: ' + config.vcodec);
  process.exit(-1);
} else {
  if (typeof config.voption === 'undefined') {
    config.voption = voption_default[config.vcodec];
  }
}

const validLoglevel = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
if (!validLoglevel.includes(config.loglevel)) {
  console.log('invalid loglevel: ' + config.loglevel);
  process.exit(-1);
}
