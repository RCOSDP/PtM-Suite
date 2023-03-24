import {getPptxData} from '../src/pptx.js';
import {parse} from './parse.js';
import {convert} from './convert.js';

export {getPptxData}

//
// File System Access API
//

let dirHandle;

export function setRoot(root) {
  dirHandle = root;
}

export async function readFile(filename) {
  const fh = await dirHandle.getFileHandle(filename);
  const file = await fh.getFile();
  return file.arrayBuffer();
}

export async function writeFile(filename, data) {
  const fh = await dirHandle.getFileHandle(filename,{create:true});
  const ws = await fh.createWritable();
  await ws.write(data);
  await ws.close();
}

export async function openDir(dirname) {
  return dirHandle.getDirectoryHandle(dirname);
}

//
// ppt2video API
//

export async function getPptx(filename) {
  const buf = await readFile(filename);
  const pptx = await getPptxData(buf);
  return {...pptx, init, createImportJson};
}

async function init() {
  const {slides, sections} = await parse(this);
  this.slides = slides;
  this.sections = sections;
}

function createImportJson() {
  return convert(this, this.slides, this.sections);
}

//
// preparation
//

export async function listSlideImages(path) {
  const slides = {};
  const re = /(?<page>\d+).(png|PNG|jpg|JPG)/;
  const dir = await openDir(path);
  for await (const dirent of dir.entries()) {
    const match = dirent[0].match(re);
    if (match != null) {
      slides[match.groups.page] = match.input;
    }
  }
  return slides;
}

function prepare(filepath, sections, vsuffix, asuffix) {
  const imageDir = path.join(filepath.dir, filepath.name);
  const imageFiles = listSlideImages(imageDir);
  let tnum = 1;
  let snum = 1;

  sections.forEach(section => {
    section.topics.forEach(topic => {
      topic.file = `${filepath.name}_${tnum}.${vsuffix}`;
      topic.outputFilename = path.join(outputDir, topic.file);
      topic.slides.forEach(slide => {
        slide.audioFilename = path.join(tempDir, `${filepath.name}_${tnum}_${snum}.${asuffix}`);
        slide.videoFilename = path.join(tempDir, `${filepath.name}_${tnum}_${snum}.${vsuffix}`);
        const imageFilename = imageFiles[snum];
        if (typeof imageFilename !== 'undefined') {
          slide.imageFilename = path.join(imageDir, imageFilename);
        } else {
          throw "can't find slide image file for slide number " + snum;
        }
        snum = snum + 1;
      });
      if (topic.slides.length > 1) {
        topic.listFilename = path.join(tempDir, `${filepath.name}_${tnum}.list`);
        const list = topic.slides.map(slide => 'file ' + path.relative(tempDir, slide.videoFilename));
        fs.writeFileSync(topic.listFilename, list.join('\n'));
      }
      tnum = tnum + 1;
    });
  });
}