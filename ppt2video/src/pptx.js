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
  const props = getPropertyAll.bind(this)(bookProperties[key]);
  if (props.length > 0) {
    return props[0];
  }
  return '';
}

function getPropertyAll(key) {
  const coreProps = this.coreXml['cp:coreProperties'];
  const props = coreProps[key];
  if (typeof props === 'undefined') {
    return [];
  }
  return props.map(prop => typeof prop === 'object'?prop._:prop);
}

//
// parse text using xml2js
//
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

async function getTextXml2js(zip, type, filename) {
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

//
// parse text using dom parser
//
let domparser;
let xpathevaluator;
let xpathresult;

export function initPptx(JSDOM, xpath) {
  const jsdom = new JSDOM();
  domparser = new jsdom.window.DOMParser();
  xpathevaluator = xpath;
  xpathresult = xpath.XPathResult;
}

if (typeof window !== 'undefined') {
  domparser = new DOMParser();
  xpathevaluator = new XPathEvaluator();
  xpathresult = XPathResult;
}

function getTextXpath(dom, type){
  const resolver = xpathevaluator.createNSResolver(dom);
  const lines = xpathevaluator.evaluate(
    `/${type}/p:cSld/p:spTree//p:sp/p:txBody/a:p`,
    dom,
    resolver,
    xpathresult.ANY_TYPE,
    null
  );
  const ret = [];
  let node = lines.iterateNext();
  while (node) {
    const line = [];
    for (const chunk of node.children) {
      switch (chunk.nodeName) {
        case 'a:r':
          const e = chunk.getElementsByTagName("a:t");
          line.push(e[0].textContent);
//          console.log(e[0].textContent);
          break;
        case 'a:br':
          line.push("\r\n");
//          console.log('found break');
          break;
      }
    }
    if (node.parentNode.parentNode.parentNode.nodeName !== "mc:Fallback") {
      ret.push(line.join('').split('\r\n'));
    }
    node = lines.iterateNext();
  }
  return ret.flat();
}

async function getTextDOM(zip, type, filename) {
  const file = zip.files[filename];
  if (file) {
    const str = await file.async("string");
    const dom = domparser.parseFromString(str, "text/xml");
    return getTextXpath(dom, type);
  }
  return [];
}

async function pptx2slide() {
  const ret = [];
  for (let i = 1; i <= this.numSlides; i++) {
    const content = await getTextDOM(this.zip, 'p:sld', `ppt/slides/slide${i}.xml`);
    const note = await getTextDOM(this.zip, 'p:notes', `ppt/notesSlides/notesSlide${i}.xml`);
    ret.push({content, note});
  }
  return ret;
}
