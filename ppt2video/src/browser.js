import {Buffer} from 'buffer';
import {parseBuffer} from 'music-metadata';
import axios from 'axios';
import * as path from 'path-browserify';

import {config} from '#target/config.js';
import {getPptxData} from './pptx.js';
import {parse} from './parse.js';
import {convert} from './convert.js';
import {updateParams} from './audio.js';
import JSZip from 'jszip';

export {getPptxData}

export function setConfig(key, value) {
  config[key] = value;
}

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

const exports = {
  init,
  createImportJson,
  writeImportJson,
  process,
  zipControl,
  encodeTopic,
  muxTopic,
  readAudioFileTopic,
  writeVideoTopic,
  createAudioTopic,
};

export async function getPptx(filename) {
  try {
    const buf = await readFile(filename);
    const pptxSize = buf.byteLength;
    const pptx = await getPptxData(buf);
    const filepath = path.parse(filename);
    return {...pptx, pptxSize, filepath, ...exports};
  } catch(e) {
    throw new Error("PPTXファイルのオープンに失敗しました。\n" + e.message);
  }
}

async function init() {
  const {slides, sections} = await parse(this);
  await prepare(this.filepath.name, sections, "mp4", "mp3");
  this.slides = slides;
  this.sections = sections;
  this.importJson = convert(this, slides, sections);
  try {
    const ffmpeg = await createFFmpeg();
    this.ffmpeg = ffmpeg;
  } catch(e){
    throw new Error("ffmpeg.wasmの初期化に失敗しました。\n" + e.message);
  }
  updateParams(slides);
}

function createImportJson(topicCheckList) {
  const ret = {...this.importJson};
  ret.sections = topicCheckList ? this.importJson.sections.filter((_,i) => topicCheckList[i]) : this.importJson.sections;
  return ret;
}

let zip = null;

async function writeImportJson(data) {
  if (zip) {
    zip.file(this.filepath.name + ".json", JSON.stringify(data,null,2));
  } else {
    await writeFile(this.filepath.name + ".json", JSON.stringify(data,null,2));
  }
}

async function writeVideoTopic(topic, data) {
  if (zip) {
    zip.file(topic.file, data, {binary: true});
  } else {
    await writeFile(topic.file, data);
  }
}

async function zipControl(cmd) {
  switch(cmd) {
    case 'start':
      zip = new JSZip();
      break;
    case 'flush':
      if (zip) {
        const data = await zip.generateAsync({type: "uint8array"});
        await writeFile(this.filepath.name + ".zip", data);
        zip = null;
      }
      break;
    case 'cancel':
      zip = null;
      break;
  }
}

async function process(options = {}) {
  const {sections} = this;
  const {readAudioFile, videoOnly, importJsonOnly, targetTopic, topicCheckList, fps, bitrate, authorized} = options;

  if (authorized) {
    return await checkPolly();
  }

  if (!videoOnly) {
    try {
      const ij = this.createImportJson(topicCheckList);
      await this.writeImportJson(ij);
    } catch(e){
      throw new Error('can not create import json file.\n' + e.message);
    }
  }

  if (importJsonOnly) {
    return;
  }

  for (const section of sections) {
    for (const topic of section.topics) {
      if (targetTopic && topic !== targetTopic) {
        continue;
      }
      if (readAudioFile) {
        await this.readAudioFileTopic(topic);
      } else {
        await this.createAudioTopic(topic);
      }
      const chunks = await this.encodeTopic(topic, fps, bitrate);
      let data;
      try {
        data = await this.muxTopic(topic, chunks, fps);
        topic.fileSize = data.byteLength;
      } catch(e){
        throw new Error('can not mux topic.\n' + e.message);
      }
      try {
        await this.writeVideoTopic(topic, data);
      } catch(e){
        throw new Error('can not write video.\n' + e.message);
      }
      // update timeRequired in json
      const sum = topic.slides.reduce((acc,slide) => acc + slide.duration,0);
      topic.duration = sum;
      topic.importJson.timeRequired = sum > 1 ? Math.floor(sum) : 1;
    }
  }
}

//
// preparation
//

async function listSlideImages(path) {
  const slides = {};
  const re = /(?<page>\d+).(png|PNG|jpg|JPG)/;
  let dir;
  try {
    dir = await openDir(path);
  } catch(e){
    throw new Error('can not open slide image directory.\n' + e.message);
  }
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
      topic.number = tnum;
      topic.inputFilename = `input_${tnum}.h264`;
      topic.outputFilename = `output_${tnum}.${vsuffix}`;
      topic.file = `${filename}_${tnum}.${vsuffix}`;
      topic.slides.forEach(slide => {
        slide.number = snum;
        slide.audioFilename = `audio_${tnum}_${snum}.${asuffix}`;
        slide.extAudioFilename = `${filename}_${tnum}_${snum}.${asuffix}`;
        const imageFilename = imageFiles[snum];
        if (typeof imageFilename !== 'undefined') {
          slide.imageFilename = imageFilename;
        } else {
          throw new Error('can not find slide image file for slide number ' + snum);
        }
        snum = snum + 1;
      });
      if (topic.slides.length > 1) {
        topic.listFilename = `list_${tnum}.list`;
        topic.listData = topic.slides.reduce((all,slide) => all + 'file ' + slide.audioFilename + '\n', '');
      }
      tnum = tnum + 1;
    });
  });
}

//
// encode
//

async function encodeTopic(topic, fps = 25, bitrate = 250000) {
  const ibarray = [];
  const darray = [];
  for (const slide of topic.slides) {
    ibarray.push(await imageFile2ImageBitmap(slide.imageFilename, this.filepath.name));
    darray.push(slide.duration);
  }
  try {
    const {encoder, chunks} = init_encoder(ibarray[0], fps, bitrate);
    await encode(encoder, ibarray, fps, darray);
    return chunks;
  } catch(e){
    throw new Error('can not encode.\n' + e.message);
  }
}

async function imageFile2ImageBitmap(filename, dirname) {
  try {
    const data = await readFile(filename, dirname);
    const blob = new Blob([data], {type: "image/png"})
    return await createImageBitmap(blob);
  } catch(e){
    throw new Error('can not read image file ' + filename + '\n' + e.message);
  }
}

function init_encoder(ib, fps, bitrate) {
  console.log("init_encoder: ", fps, bitrate);
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
    bitrate,
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
  let gop = -1;
  let keyFrame = true;
  const frames = farray.slice(-1)[0];
  async function next() {
    console.log('next called',frames,cur);
    const limit = cur + fps > frames ? frames : cur + fps;
    for (; cur < limit; cur++) {
      if (cur > farray[index]) {
        index += 1;
      }
      if (Math.floor(cur / fps) > gop) {
        keyFrame = true;
        gop++;
      } else {
        keyFrame = false;
      }
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

async function createFFmpeg() {
  const ffmpeg = new FFmpegWASM.FFmpeg();
  await ffmpeg.load({
    coreURL: config.ffmpegDir + '/ffmpeg-core.js',
    wasmURL: config.ffmpegDir + '/ffmpeg-core.wasm',
  })
  return ffmpeg;
}

async function ffrun(ffmpeg, cmdline) {
  const cmdarray = cmdline.split(/ +/);
  console.log("ffmpeg run ", cmdarray);
  return ffmpeg.exec(cmdarray);
}

async function ffwrite(ffmpeg, filename, data) {
  if (!(data instanceof Uint8Array)) {
    data = new Uint8Array(data);
  }
  await ffmpeg.writeFile(filename, data);
}

async function ffread(ffmpeg, filename) {
  const data = await ffmpeg.readFile(filename);
  return data.buffer;
}

async function ffunlink(ffmpeg, filename) {
  await ffmpeg.deleteFile(filename);
}

function concat(chunks) {
  const total = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const ret = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    const len = chunk.byteLength;
    ret.set(new Uint8Array(chunk), offset);
    offset += len;
  }
  return ret;
}

async function muxTopic(topic, chunks, fps = 25) {
  const {ffmpeg} = this;
  const coption = "-c:v copy -c:a aac";

  await ffwrite(ffmpeg, topic.inputFilename, concat(chunks));

  if (topic.slides.length === 1) {
    const slide = topic.slides[0];
    await ffwrite(ffmpeg, slide.audioFilename, slide.soundData);
    await ffrun(ffmpeg, `-r ${fps} -i ${topic.inputFilename} -i ${slide.audioFilename} ${coption} ${topic.outputFilename}`);
    await ffunlink(ffmpeg, slide.audioFilename);
  } else {
    const blob = new Blob([topic.listData]);
    const ab = await blob.arrayBuffer();
    await ffwrite(ffmpeg, topic.listFilename, ab);
    for (const slide of topic.slides) {
      await ffwrite(ffmpeg, slide.audioFilename, slide.soundData);
    }
    await ffrun(ffmpeg, `-r ${fps} -i ${topic.inputFilename} -f concat -i ${topic.listFilename} ${coption} ${topic.outputFilename}`);
    for (const slide of topic.slides) {
      await ffunlink(ffmpeg, slide.audioFilename);
    }
    await ffunlink(ffmpeg, topic.listFilename);
  }

  await ffunlink(ffmpeg, topic.inputFilename);

  const data = await ffread(ffmpeg, topic.outputFilename);
  await ffunlink(ffmpeg, topic.outputFilename);
  return data;
}

//
// sound
//

if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

const ltik = new URLSearchParams(window.location.search).get("ltik");
if (ltik) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${ltik}`;
}

async function getSoundDuration(data) {
  const buf = Buffer.from(data);
  const mmp = await parseBuffer(buf);
  return mmp.format.duration;
}

async function readAudioFileTopic(topic) {
  try {
    for (const slide of topic.slides) {
      const data = await readFile(slide.extAudioFilename);
      slide.soundData = data;
      slide.duration = await getSoundDuration(data);
    }
  } catch(e){
    throw new Error('can not read audio file.\n' + e.message);
  }
}

async function createAudioTopic(topic) {
  for(const slide of topic.slides) {
    let res;
    try {
      res = await axios.post(config.pollyProxy, slide.req, {responseType: 'arraybuffer'});
    } catch(e){
      const response = String.fromCharCode.apply(null, new Uint8Array(e.response.data));
      throw new Error(`polly error in slide ${slide.number} with request string:\n${slide.req.Text}\n\n${e.message}\n${response}`);
    }
    const {data} = res;
    slide.soundData = data;
    try {
      slide.duration = await getSoundDuration(data);
    } catch(e){
      throw new Error('can not determine audio duration.\n' + e.message);
    }
  }
}

export async function checkPolly() {
  let res;
  try {
    res = await axios.post(config.pollyProxy, {});
  } catch(e){
    return e.message;
  }
  return res.data;
}

export async function submitLog(data) {
  let res;
  try {
    res = await axios.post(config.submitLog, data);
  } catch(e){
    return e.message;
  }
  return res.data;
}
