import { boolean } from 'boolean';

const process = {env: {}};

const stringOptions = {
  voice:       process.env.PPT2VIDEO_VOICE       || 'Takumi',
  engine:      process.env.PPT2VIDEO_ENGINE      || 'neural',
  loglevel:    process.env.PPT2VIDEO_LOGLEVEL    || 'info',
  sampleRate:  process.env.PPT2VIDEO_SAMPLERATE  || '22050',
  pollyProxy:  "/polly",
  ffmpegDir:   "/ffmpeg",
  submitLog:   "/log",
};

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

export const config = {
  ...stringOptions,
  ...numberOptions,
  ...boolOptions
};
