import {getPptxData} from '../src/pptx.js';
import {parse} from './parse.js';
import {convert} from './convert.js';

export {getPptxData}

export async function prepare(pptx) {
  const p2v = await parse(pptx);
  p2v.pptx = pptx;
  return p2v;
}

export function createImportJson(p2v) {
  const {pptx, slides, sections} = p2v;
  return convert(pptx, slides, sections);
}
