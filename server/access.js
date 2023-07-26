import config from './config.js';
import fs from 'fs';
import path from 'path';

let year, month, date;
const usage = [];
const limit = config.usageLimit;
let total;
let last_update;

function init() {
  init_usage();
  setInterval(check, config.checkInterval * 1000);
}

function check() {
//  console.log('check called');
  const now = getNow();
  const cal = getCalendar(now);

  // check for next month
  if (cal.year !== year || cal.month !== month) {
    writelog();
    last_update = now;
    update_month(cal);
    return;
  }

  // advance date
  date = cal.date;

  // check for update
  if (now.getTime() - last_update.getTime() > config.updateInterval * 1000) {
    writelog();
    last_update = now;
  }
}

function update_month(cal) {
  year = cal.year;
  month = cal.month;
  date = cal.date;

  clear_usage();
  readlog();
}

// usage log

function init_usage() {
  last_update = getNow();
  const cal = getCalendar(last_update);
  update_month(cal);
}

function clear_usage() {
  for (let i = 0;i < 31;i++) {
    usage[i] = 0;
  }
  total = 0;
}

function readlog() {
//  console.log('readlog called');
  const filename = path.join(config.logdir, log_filename());
  if (!fs.existsSync(filename)) {
    return;
  }
  try {
    const str = fs.readFileSync(filename);
    const data = JSON.parse(str);
    total = data.total;
    for (let i = 0;i < 31;i++) {
      usage[i] = data.usage[i];
    }
  } catch(err) {
    console.log('readlog: error');
  }
}

const temp_filename = "tempfile";

function writelog() {
//  console.log('writelog called ' + total);
//  console.log(usage);
  const data = {
    total,
    usage,
  };
  try {
    const temp = path.join(config.logdir, temp_filename);
    fs.writeFileSync(temp, JSON.stringify(data));
    fs.renameSync(temp, path.join(config.logdir, log_filename()));
  } catch(err) {
    console.log('writelog: error');
  }
}

function log_filename() {
  let m = String(month + 1);
  if (m.length === 1) {
    m = '0' + m;
  }
  return String(year) + m + '.log';
}

// access control

function validate() {
  if (limit > total) return;
  throw {
    statusCode: 503,
    code: "Service Unavailable",
  };
}

function processed(n) {
  usage[date - 1] += n;
  total += n;
}

// utility functions

function getCalendar(now) {
  return {
    year:  now.getUTCFullYear(),
    month: now.getUTCMonth(),
    date:  now.getUTCDate()
  }
}

function getNow() {
  if (config.fakeOffset) {
    const d = new Date(Date.now() + config.fakeOffset);
    console.log(d);
    return d;
  }
  return new Date();
}

export {
  init,
  validate,
  processed,
};
