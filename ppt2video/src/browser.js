import {Buffer} from 'buffer';
import mm from 'music-metadata-browser';

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
  const ibarray = [];
  const darray = [];
  for (const slide of topic.slides) {
    ibarray.push(await imageFile2ImageBitmap(slide.imageFilename, "vuca"));
    darray.push(slide.duration);
  }
  const {encoder, chunks} = init_encoder(ibarray[0], 25);
  await encode(encoder, ibarray, 25, darray);
  return chunks;
}

export async function imageFile2ImageBitmap(filename, dirname) {
  const data = await readFile(filename, dirname);
  const blob = new Blob([data], {type: "image/png"})
  return await createImageBitmap(blob);
}

function init_encoder(ib, fps) {
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
    framerate: fps,
  });

  return {encoder, chunks};
}

async function encode(encoder, ibarray, fps, darray) {
  console.log('start encode', darray);
  let total = 0;
  const farray = darray.map(v => {
    total += v;
    return total * fps;
  });
  console.log(farray);
  let cur = 0;
  let index = 0;
  const frames = farray.slice(-1)[0];
  async function next() {
    console.log('next called',frames,cur);
    const limit = cur + fps > frames ? frames : cur + fps;
    for (; cur < limit; cur++) {
      if (cur > farray[index]) {
        index += 1;
      }
      const keyFrame = (cur % fps === 0);
      const vf = new VideoFrame(ibarray[index], {
        timestamp: cur * 1000000 / fps,
        duration:  1000000 / fps
      });
      encoder.encode(vf, {keyFrame});
      vf.close();
    }
    if (cur >= frames) {
      flush();
    }
  }
  encoder.addEventListener("dequeue",(ev) => {
    if (encoder.encodeQueueSize === 0 && cur < frames){
      console.log("dequeue listener calls next()");
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

//
// mux
//

//
// sound
//

if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

async function getSoundDuration(data) {
  const buf = Buffer.from(data);
  const mmp = await mm.parseBuffer(buf);
  return mmp.format.duration;
}

export async function readSoundFileTopic(topic) {
  for (const slide of topic.slides) {
    const data = await readFile(slide.audioFilename);
    slide.soundData = data;
    slide.duration = await getSoundDuration(data);
  }
}
