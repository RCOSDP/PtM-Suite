import sm from 'speechmarkdown-js';
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

    if (typeof slide.engine === 'undefined') {
      if (req.VoiceId === 'Mizuki') {
        slide.engine = 'standard';
      } else {
        slide.engine = 'neural';
      }
    }
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
  Engine: config.engine,
};

export function updateParams(slides) {
  const speech = new sm.SpeechMarkdown({platform: 'amazon-alexa'});

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
    updateParam(prev, slide, req);
    slide.req = {
      ...req,
      Text: speech.toSSML(slideText(slide))
    };
    prev = slide;
  }
}
