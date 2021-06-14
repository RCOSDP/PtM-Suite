const minimist = require('minimist');

const stringOptions = {
  tempDir: './',
  outputDir: './',
  libDir: __dirname + '/../lib',
  tikaJar: 'tika-app-1.26.jar',
  voice: 'Takumi',
  vcodec: 'libopenh264',
  logfile: 'ppt2video.log',
  loglevel: 'info',
};

const numberOptions = {
  sampleRate: 22010,
  delay: 1.0,
  pad: 1.0,
  fade: 0.5,
};

const boolOptions = {
  novideo: false,
};

const config = minimist(process.argv.slice(2), {
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

const validVcode = ['libopenh264', 'x264'];
if (!validVcode.includes(config.vcodec)) {
  console.log('invalid vcodec: ' + config.vcodec);
  process.exit(-1);
}

const validLoglevel = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
if (!validLoglevel.includes(config.loglevel)) {
  console.log('invalid loglevel: ' + config.loglevel);
  process.exit(-1);
}

module.exports = {
  config
}
