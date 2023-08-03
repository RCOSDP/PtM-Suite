import {execaCommand} from 'execa';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';

import {config} from './config.js';
import {logger} from './log.js';
import {bookProperties} from './convert.js';

const {libDir, tikaJar} = config;

export async function getPptx(filename) {
  const filepath = path.parse(filename);
  const cmd = `java -jar ${libDir}/${tikaJar} -x ${filename}`;

  let xml;
  if (filepath.ext === '.xml') {
    xml = fs.readFileSync(filename, 'utf8');
  } else {
    logger.info(cmd);
    const result = await execaCommand(cmd);
    xml = result.stdout;
  }
  return {xml, getProperty, getPropertyAll, pptx2slide};
}

function getProperty(name) {
  const prop = this.tika.html.head.meta.find(e => e.name === bookProperties[name]);
  return typeof prop !== 'undefined'?prop.content:'';
}

function getPropertyAll(name) {
  return this.tika.html.head.meta.filter(e => e.name === name).map(e => e.content);
}

function p2strings(p){
  if (typeof p === 'undefined'){
    return [];
  }

  if (typeof p === 'string'){
    return [p];
  }

  // empty object -> empty string
  const ret = p.map(s => typeof s === 'string'?s.split('\n'):'').flat()

  // check total number of characters
  if (ret.reduce((ac,s) => ac + s.length,0) === 0){
    return [];
  }
  return ret;
}

function tika2slide(tika) {
  const ret = []
  const {div} = tika.html.body;
  let content, note;
  for (const e of div){
    switch(e.class){
      case 'slide-content':
        content = p2strings(e.p);
        break;
      case 'slide-notes':
        note = p2strings(e.p);
        ret.push({content, note});
        break;
    }
  }
  return ret;
}

async function pptx2slide() {
  const option = {
    async: false,
    explicitArray: false,
    mergeAttrs: true,
  };
  const tika = await xml2js.parseStringPromise(this.xml, option);
  this.tika = tika;
  return tika2slide(tika);
}
