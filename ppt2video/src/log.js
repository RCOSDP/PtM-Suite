const path = require('path');
const log4js =require('log4js');
const {config} = require('./config.js');

const {_, loglevel} = config;
let {logfile} = config;

// if (logfile === null) {
//   logfile = path.parse(_[0]).name + '.log';
// }

log4js.configure({
  appenders : {
    file: {type: 'file', filename: logfile},
    console: {type: 'console'},
    out: {type: 'logLevelFilter', appender: 'console', level: 'info'},
  },
  categories: {
    default: {appenders: ['file','out'], level: loglevel}
  }
});

const logger = log4js.getLogger('ppt2video');

module.exports = {
  log4js,
  logger
};
