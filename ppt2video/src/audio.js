import fs from 'fs';

import sm from 'speechmarkdown-js';
import mm from 'music-metadata-browser';
import axios from 'axios';

import {PollyClient, SynthesizeSpeechCommand} from '@aws-sdk/client-polly';

import {config} from '#target/config.js';

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
  // Takumi default engine
  if (req.VoiceId == 'Takumi') {
    req.Engine = 'neural';
  } else {
    delete req.Engine;
  }
  // engine
  if (typeof slide.engine !== 'undefined') {
    req.Engine = slide.engine.trim();
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

export async function createAudioFiles(slides) {
  const speech = new sm.SpeechMarkdown({platform: 'amazon-alexa'});
  const polly = new PollyClient();

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

  for(const slide of slides) {
    // update request
    updateParam(prev, slide, req);
    req.Text = speech.toSSML(slideText(slide));

    // call amazon polly
    let stream;
    if (config.pollyProxy) {
      const res = await axios.post(config.pollyProxy, req, {responseType: 'arraybuffer'});
      stream = res.data;
    } else {
      const command = new SynthesizeSpeechCommand(req);
      const res = await polly.send(command);
      const chunks = []
      for await (let chunk of res.AudioStream) {
        chunks.push(chunk)
      }
      stream = Buffer.concat(chunks);
    }
    slide.duration = (await mm.parseBuffer(stream)).format.duration;
    fs.writeFileSync(slide.audioFilename, stream);

    prev = slide;
  }
}
