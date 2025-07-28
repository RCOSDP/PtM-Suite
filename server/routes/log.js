import express from "express";
import cors from "cors";
const router = express.Router();

import { bearer, check } from './login.js';
router.use(bearer, check);

// allow CORS with all pre-flight request and POST /log request
router.options("*", cors());

router.post("/", cors(), async function (req, res, next) {
  try {
    const {
      type,
      filename = '-',
      size = 0,
      numslides = 0,
      numtopics = 0,
      duration = 0,
      message = '-',
    } = req.body;
    const log = [type];
    req.locals.log = log;
    switch(type) {
    case 'open-directory':
      break;
    case 'open-pptx':
      log[1] = filename;
      log[2] = size;
      log[3] = numslides;
      break;
    case 'output-video':
      log[1] = filename;
      log[2] = numtopics;
      break;
    case 'save-video':
      log[1] = filename;
      log[2] = size;
      log[3] = duration;
      break;
    case 'error':
      log[1] = message;
      break;
    default:
      log[0] = 'error';
      log[1] = 'type unknown';
      res.status(400).send(log[1]);
      return;
    }
    res.send('OK');
  } catch (error) {
    next(error);
  }
});

export { router };
