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

async function anonymize(user_id) {
  const s = user_id.split('@');
  if (s[0].length > 0) {
    const h = await crypto.subtle.digest('sha-256', new TextEncoder().encode(s[0]));
    s[0] = btoa(String.fromCharCode.apply(null, new Uint8Array(h)));
  }
  return s.join('@');
}

router.post('/', async function(req, res, next) {
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
    const au = await anonymize(user_id);
    req.locals = {id, user_id: au};
    res.send('OK');
  } else {
    res.status(401).send('unauthorized');
  }
});

function check(req, res, next) {
  if (!config.authorization) {
    req.locals = {id: '-', len: 0};
    next();
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
      next();
      return;
    }
    req.locals = {message: 'token not found'};
  } catch (err) {
    req.locals = {message: err.message};
  }
  res.status(401).send('unauthorized');
}

function auth(req, res, next) {
  const result = config.authorization?'authorized':'noauthorize';
  if (req.body.Text) {
    next();
    return;
  } else {
    res.send(result);
  }
}

import bearerToken from 'express-bearer-token';
const bearer = bearerToken({
  cookie: {
    key: 'session_cookie'
  }
});

export {
  router,
  check,
  auth,
  bearer,
};
