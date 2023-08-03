import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';

import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet("1234567890abcdef", 10);

import config from '../config.js';

const secret = process.env.POLLY_SECRET || "secret";
const cPassword = process.env.POLLY_PASSWORD || "chilo";

const issuer = "polly proxy";
const option = {
  expiresIn: "7d",
};

router.post('/', function(req, res, next) {
  const {user_id, password} = req.body;
  if (password === cPassword) {
    const id = nanoid();
    const token = jwt.sign({
      iss: issuer,
      sub: id,
    }, secret, option);
    res.cookie('session_cookie', token, {
      secure: false,
      httpOnly: false,
    });
    req.locals = {id, user_id};
    res.send('OK');
  } else {
    res.status(401).send('unauthorized');
  }
});

function check(req, res, next) {
  if (!config.authorization) {
    req.locals = {id: '-', len: 0};
    if (req.body.Text) {
      next();
    } else {
      res.send('noauthorize');
    }
    return;
  }

  // check token
  try {
    if (req.token) {
      const decoded = jwt.verify(req.token, secret, {
        algorithms: ['HS256'],
        issuer,
      });
      req.locals = {id: decoded.sub, len: 0};
    }
    if (req.locals) {
      if (req.body.Text) {
        next();
      } else {
        res.send('authorized');
      }
      return;
    }
  } catch (err) {
    req.locals = {message: err.message};
  }
  res.status(401).send('unauthorized');
}

export {
  router,
  check,
};
