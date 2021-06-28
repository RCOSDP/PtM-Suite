const execa = require('execa');
const fs = require('fs');
const path = require('path');
const sm = require('speechmarkdown-js');
const AWS = require('aws-sdk');
const mm = require('music-metadata');
const axios = require('axios');

const {config} = require('./config.js');
const {log4js, logger} = require('./log.js');
const parse = require('./parse.js');
const convert = require('./convert.js');

const {libDir, tikaJar, outputDir, tempDir} = config;

async function getTika(filename) {
  const filepath = path.parse(filename);
  const cmd = `java -jar ${libDir}/${tikaJar} -x ${filename}`;

  let xml;
  if (filepath.ext === '.xml') {
    xml = fs.readFileSync(filename, 'utf8');
  } else {
    logger.info(cmd);
    const result = await execa.command(cmd);
    xml = result.stdout;
  }
  return xml;
}

function listSlideImages(path) {
  const slides = {};
  const re = /(?<page>\d+).(png|PNG)/;
  const dir = fs.opendirSync(path);
  let dirent;
  while (dirent = dir.readSync()) {
    const match = dirent.name.match(re);
    if (match != null) {
      slides[match.groups.page] = match.input;
    }
  }
  dir.closeSync();
  return slides;
}

function prepare(filepath, sections, vsuffix, asuffix) {
  const imageDir = path.join(filepath.dir, filepath.name);
  const imageFiles = listSlideImages(imageDir);
  let tnum = 1;
  let snum = 1;

  sections.forEach(section => {
    section.topics.forEach(topic => {
      topic.url = `${filepath.name}_${tnum}.${vsuffix}`;
      topic.outputFilename = path.join(outputDir, topic.url);
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

function updateParam(prev, slide, req) {
  // delay
  if (typeof slide.delay === 'undefined') {
    slide.delay = prev.delay;
  }
  // pad
  if (typeof slide.pad === 'undefined') {
    slide.pad = prev.pad;
  }
  // fade
  if (typeof slide.fade === 'undefined') {
    slide.fade = prev.fade;
  }
  // voice
  if (typeof slide.voice !== 'undefined') {
    req.VoiceId = slide.voice.trim();
  }
  // sampleRate
  if (typeof slide.sampleRate !== 'undefined') {
    const trimmed = slide.sampleRate.trim();
    if (polly_valid_samplerates.includes(trimmed)) {
      req.SampleRate = trimmed;
    }
  }
}

function breakTime(sec) {
  if (typeof sec === 'undefined' || sec <= 0) {
    return '';
  }
  let ms = sec * 1000;
  if (ms > 10000) {
    ms = 10000;
  }
  return `<break time="${ms.toFixed()}ms"/>`;
}

function slideText(slide) {
  const lines = slide.blocks.filter(b => b.type === 'text').map(b => b.content).flat(1);
  const text = lines.join('\n').replace(/<\/?speak>/g,'');
  const delay = breakTime(slide.delay);
  const pad = breakTime(slide.pad);
  return [delay, text, pad].join('');
}

const polly_valid_samplerates = ['8000', '16000', '22050', '24000'];

const polly_defaults = {
  OutputFormat: 'mp3',
  SampleRate: config.sampleRate,
  TextType: 'ssml',
  VoiceId: config.voice,
};

async function createAudioFiles(slides, speech) {
  const polly = new AWS.Polly();

  const req = {
    ...polly_defaults
  };
  if (!polly_valid_samplerates.includes(req.SampleRate)) {
    req.SampleRate = '22050';
  }

  let prev = {
    delay: config.delay,
    pad: config.pad,
    fade: config.fade,
  };

  for(slide of slides) {
    // update request
    updateParam(prev, slide, req);
    req.Text = speech.toSSML(slideText(slide));

    // call amazon polly
    let stream;
    if (config.pollyProxy) {
      const res = await axios.post(config.pollyProxy, req, {responseType: 'arraybuffer'});
      stream = res.data;
    } else {
      const data = await polly.synthesizeSpeech(req).promise();
      stream = data.AudioStream;
    }
    slide.duration = (await mm.parseBuffer(stream)).format.duration;
    fs.writeFileSync(slide.audioFilename, stream);

    prev = slide;
  }
}

function ffmegLocation() {
  if (config.vcodec === 'libopenh264') {
    let ffmpeg = libDir + '/' + config.ffmpegCmd;
    if (fs.existsSync(ffmpeg)) {
      logger.info('use ' + ffmpeg);
    } else {
      logger.warn('can\'t find ' + ffmpeg);
      ffmpeg = config.ffmpegCmd;
    }
    const libopenh264 = libDir + '/' + config.libopenh264;
    if (fs.existsSync(libopenh264)) {
      process.env.LD_LIBRARY_PATH = libDir;
      logger.info('set LD_LIBRARY_PATH=', process.env.LD_LIBRARY_PATH);
    }
    return ffmpeg;
  }
  return config.ffmpegCmd;
}

const vfCommon = ['fps=25','format=yuv420p'];
const vcodec = `-c:v ${config.vcodec} ${config.voption}`;
const acodec = '-c:a copy';
const ffmpeg = ffmegLocation();

function getVfOption(duration, option = {}) {
  const vf = [...vfCommon];
  if (typeof option.fade !== 'undefined') {
    vf.push(`fade=t=in:st=0:d=${option.fade}`);
    vf.push(`fade=t=out:st=${duration - option.fade}:d=${option.fade}`);
  }
  if (vf.length === 0) {
    return '';
  }
  return '-vf ' + vf.join(',');
}

async function createVideo(slide, filename, option = {}) {
  const vfOption = getVfOption(slide.duration, option);
  const cmd = `${ffmpeg} -y -loop 1 -t ${slide.duration} -i ${slide.imageFilename} -i ${slide.audioFilename} ${vcodec} ${vfOption} ${acodec} ${filename}`;
  logger.info(cmd);
  return execa.command(cmd);
}

async function concatenateVideo(topic, option = {}) {
  const vfOption = getVfOption(topic.duration, option);
  const cmd = `${ffmpeg} -y -f concat -i ${topic.listFilename} ${vcodec} ${vfOption} ${acodec} ${topic.outputFilename}`;
  logger.info(cmd);
  return execa.command(cmd);
}

function videoOption(slide) {
  const option = {};
  if (typeof slide.fade !== 'undefined' && slide.fade > 0.001) {
    option.fade = slide.fade;
  }
  return option;
}

async function createVideoFiles(sections) {
  for (section of sections) {
    for (topic of section.topics) {
      const option = videoOption(topic.slides[0]);
      if (topic.slides.length > 1) {
        let duration = 0.0;
        for (slide of topic.slides) {
          duration = duration + slide.duration;
          const result = await createVideo(slide, slide.videoFilename);
        }
        topic.duration = duration;
        const result = await concatenateVideo(topic, option);
      } else {
        const result = await createVideo(topic.slides[0], topic.outputFilename, option);
      }
    }
  }
}

function removeTempFiles(sections) {
  function removeFile(path) {
    try {
      logger.trace('removeFile: check ' + path);
      if (fs.existsSync(path)) {
        logger.trace('removeFile: remove ' + path);
        fs.unlinkSync(path);
      }
    } catch(e) {
      logger.trace('removeFile: exception ' + path);
    }
  }

  sections.forEach(section => {
    section.topics.forEach(topic => {
      if (typeof topic.listFilename !== 'undefined') {
        removeFile(topic.listFilename);
      }
      topic.slides.forEach(slide => {
        removeFile(slide.audioFilename);
        removeFile(slide.videoFilename);
      });
    });
  });
}

function exitProcess(code) {
  log4js.shutdown((e) => {
    process.exit(code);
  });
}

function fatalError(e, message, sections = null) {
  if (e !== null){
    logger.error(e);
  }
  logger.fatal(message);
  if (sections !== null) {
    removeTempFiles(sections);
  }
  exitProcess(-1);
}

async function ppt2video(filename) {
  const filepath = path.parse(filename);
  const speech = new sm.SpeechMarkdown({platform: 'amazon-alexa'});
  let xml, data;

  if (!fs.existsSync(filename)) {
    fatalError(null, 'can\'t find ' + filename);
  }
  logger.info('processing ' + filename);

  // getting tika xml output
  logger.trace('call getTika');
  try {
    xml = await getTika(filename);
  } catch(e) {
    fatalError(e, 'can\'t get tika xml output.');
    return;
  }
  logger.trace(xml);

  // parse
  logger.trace('call parse');
  try {
    data = await parse.parse(xml);
  } catch(e) {
    fatalError(e, 'parse error');
    return;
  }
  const {tika, slides, sections} = data;
  logger.trace(JSON.stringify(sections,null,2));

  // prepare output filename
  try {
    prepare(filepath, sections, 'mp4', 'mp3');
  } catch(e) {
    fatalError(e, 'failed to prepare', sections);
    return;
  }

  // convert to import-json
  logger.trace('call convert');
  try {
    const ij = convert.convert(tika, slides, sections);
    fs.writeFileSync(path.join(outputDir, filepath.name + '.json'), JSON.stringify(ij,null,2));
  } catch(e) {
    fatalError(e, 'failed to create import json file', sections);
    return;
  }

  if (config.novideo) {
    logger.info('success to craete import json file');
    removeTempFiles(sections);
    return;
  }

  // create audio files
  logger.trace('call createAudioFiles');
  try {
    await createAudioFiles(slides, speech);
  } catch(e) {
    fatalError(e, 'failed to create audio files', sections);
    return;
  }

  // create video files
  logger.trace('call createVideoFiles');
  try {
    await createVideoFiles(sections);
  } catch(e) {
    fatalError(e, 'failed to create video files', sections);
    return;
  }

  // cleanup temp files
  removeTempFiles(sections);

  exitProcess(0);
}

module.exports = {
  ppt2video
}
