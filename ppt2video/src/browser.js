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

export async function readFile(filename, dirname) {
  let dir;
  if (dirname) {
    dir = await dirHandle.getDirectoryHandle(dirname);
  } else {
    dir = dirHandle;
  }
  const fh = await dir.getFileHandle(filename);
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
  await prepare("vuca", sections, "mp4", "mp3");
  this.slides = slides;
  this.sections = sections;
}

function createImportJson() {
  return convert(this, this.slides, this.sections);
}

//
// preparation
//

async function listSlideImages(path) {
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

async function prepare(filename, sections, vsuffix, asuffix) {
  const imageFiles = await listSlideImages(filename);
  let tnum = 1;
  let snum = 1;

  sections.forEach(section => {
    section.topics.forEach(topic => {
      topic.outputFilename = `${filename}_${tnum}.${vsuffix}`;
      topic.slides.forEach(slide => {
        slide.audioFilename = `${filename}_${tnum}_${snum}.${asuffix}`;
        const imageFilename = imageFiles[snum];
        if (typeof imageFilename !== 'undefined') {
          slide.imageFilename = imageFilename;
        } else {
          throw "can't find slide image file for slide number " + snum;
        }
        snum = snum + 1;
      });
      if (topic.slides.length > 1) {
        topic.listFilename = `${filename}_${tnum}.list`;
        topic.list = topic.slides.map(slide => 'file ' + slide.audioFilename);
      }
      tnum = tnum + 1;
    });
  });
}

//
// encode
//

export async function encodeTopic(topic) {
  const {audioFilename, imageFilename} = topic.slides[0];
  const ib = await imageFile2ImageBitmap(imageFilename, "vuca");
  const {encoder, chunks} = init_encoder(ib);
  await encode(encoder, ib, 25, 25 * 4.5);
  return chunks;
}

export async function imageFile2ImageBitmap(filename, dirname) {
  const data = await readFile(filename, dirname);
  const blob = new Blob([data], {type: "image/png"})
  return await createImageBitmap(blob);
}

function init_encoder(ib) {
  const chunks = [];

  const encoder = new VideoEncoder({
    output: function(chunk, meta) {
      const buf = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buf);
      chunks.push(buf);
    },
    error: function(e) {
      console.log(e);
    }
  });

  encoder.configure({
    codec: 'avc1.42001f',
    avc: {
      format: 'annexb',
    },
    width: ib.width,
    height: ib.height,
    bitrate: 250000,
    framerate: 25,
  });

  return {encoder, chunks};
}

async function encode(encoder, ib, fps, frames) {
  console.log('start encode', frames);
  let cur = 0;
  async function next() {
    console.log('next called',frames,cur);
    const limit = cur + fps > frames ? frames : cur + fps;
    for (; cur < limit; cur++) {
      const keyFrame = (cur % fps === 0);
      const vf = new VideoFrame(ib, {
        timestamp: cur * 1000000 / fps,
        duration:  1000000 / fps
      });
      console.log(vf.timestamp);
      encoder.encode(vf, {keyFrame});
      vf.close();
    }
    if (cur >= frames) {
      flush();
    }
  }
  encoder.addEventListener("dequeue",(ev) => {
    console.log(encoder.encodeQueueSize, ev.type, ev.timeStamp, ev.eventPhase, ev.target.encodeQueueSize);
    if (encoder.encodeQueueSize === 0 && cur < frames){
       next();
    }
  });
  let saved_resolve;
  async function flush() {
    console.log('flush called');
    await encoder.flush();
    saved_resolve();
  }
  setTimeout(next, 0);
  console.log('end encode');
  return new Promise(async (resolve) => {
    saved_resolve = resolve;
  });
}
