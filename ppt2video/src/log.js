import path from 'path';
import log4js from 'log4js';
import {config} from './config.js';

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

export const logger = log4js.getLogger('ppt2video');

export {log4js}
