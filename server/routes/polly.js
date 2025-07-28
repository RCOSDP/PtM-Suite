import express from "express";
import cors from "cors";
const router = express.Router();

import { bearer, check, auth } from './login.js';
router.use(bearer, check, auth);

import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import config from '../config.js';
import * as access from '../access.js';

// vercel don't allow to set AWS_REGION env etc.
// so we use AWS_REGION_POLLY instead and update aws sdk config
if (
  process.env.AWS_REGION_POLLY &&
  process.env.AWS_ACCESS_KEY_ID_POLLY &&
  process.env.AWS_SECRET_ACCESS_KEY_POLLY
) {
  aws.config.update({
    region: process.env.AWS_REGION_POLLY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_POLLY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_POLLY,
  });
}

var polly = new PollyClient();

async function SynthesizeSpeech(input) {
  const command = new SynthesizeSpeechCommand(input);
  const res = await polly.send(command);
  const chunks = []
  for await (let chunk of res.AudioStream) {
    chunks.push(chunk)
  }
  res.AudioStream = Buffer.concat(chunks);
  return res;
}

// allow CORS with all pre-flight request and POST /polly request
router.options("*", cors());

router.post("/", cors(), async function (req, res, next) {
  try {
    if (config.authorization) access.validate();
    const data = await SynthesizeSpeech(req.body);
    res.setHeader("content-type", data.ContentType);
    const len = data.RequestCharacters;
    if (config.authorization) access.processed(len);
    req.locals.len = len;
    req.locals.mp3size = data.AudioStream.length;
    res.send(data.AudioStream);
  } catch (error) {
    error.statusCode = error.$metadata.httpStatusCode;
    error.code = error.name;
    next(error);
  }
});

export { router };
