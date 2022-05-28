const config = require('./config');
const fs = require('fs');

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
  console.log('check called');
  const now = getNow();
  if (now.getTime() - last_update.getTime() > config.updateInterval * 1000) {
    update(now);
  }
}

function update(now) {
  console.log('update called');
  writelog();
  last_update = now;
  const cal = getCalendar(now);
  if (cal.year !== year || cal.month !== month) {
    update_month(cal);
  } else {
    date = cal.date;
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
  console.log('readlog called');
}

function writelog() {
  console.log('writelog called ' + total);
  console.log(usage);
}

// access control

function valid() {
  return limit > total;
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
  return new Date();
}

module.exports = {
  init,
  valid,
  processed,
};
