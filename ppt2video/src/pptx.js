import JSZip from 'jszip';
import xml2js from 'xml2js';

import {bookProperties} from './convert.js';

const xml2js_option = {
  async: false,
  explicitArray: true,
  mergeAttrs: true,
};

async function zip2xml(zip, filename) {
  const parser = new xml2js.Parser();
  const file = zip.files[filename];
  if (file) {
    const str = await file.async("string");
    return parser.parseStringPromise(str, xml2js_option);
  }
  return null;
}

export async function getPptxData(data) {
  const zip = new JSZip();
  await zip.loadAsync(data);

  const appXml = await zip2xml(zip, 'docProps/app.xml');
  const numSlides = parseInt(appXml.Properties.Slides);

  const coreXml = await zip2xml(zip, 'docProps/core.xml');

  return {zip, appXml, coreXml, numSlides, getProperty, getPropertyAll, pptx2slide};
}

function getProperty(key) {
  const props = getPropertyAll.bind(this)(key);
  if (props.length > 0) {
    return props[0];
  }
  return '';
}

function getPropertyAll(key) {
  const coreProps = this.coreXml['cp:coreProperties'];
  const props = coreProps[bookProperties[key]];
  if (typeof props === 'undefined') {
    return [];
  }
  return props.map(prop => typeof prop === 'object'?prop._:prop);
}

function extractLine(chunks) {
  const ret = [];
  for (const chunk of chunks) {
    ret.push(chunk['a:t']);
  }
  return ret.join('').split('\r\n');
}

function block2lines(block) {
  const ret = [];
  const txBody = block['p:txBody'];
  if (!txBody) {
    return [];
  }
  const lines = txBody[0]['a:p'];
  for (const line of lines) {
    const chunks = line['a:r'];
    if (chunks) {
      ret.push(extractLine(chunks));
    }
  }
  return ret.flat();
}

async function getText(zip, type, filename) {
  const ret = [];
  const xml = await zip2xml(zip, filename);
  if (xml === null) {
    return [];
  }
  const blocks = xml[type]['p:cSld'][0]['p:spTree'][0]['p:sp'];
  for (const block of blocks) {
    ret.push(block2lines(block));
  }
  return ret.flat();
}

async function pptx2slide() {
  const ret = [];
  for (let i = 1; i <= this.numSlides; i++) {
    const content = await getText(this.zip, 'p:sld', `ppt/slides/slide${i}.xml`);
    const note = await getText(this.zip, 'p:notes', `ppt/notesSlides/notesSlide${i}.xml`);
    ret.push({content, note});
  }
  return ret;
}
