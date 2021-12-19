const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const secret = process.env.POLLY_SECRET || "secret";
const cPassword = process.env.POLLY_PASSWORD || "chilo";
const option = {
  expiresIn: "7d",
}

router.post('/', function(req, res, next) {
  const {user_id, password} = req.body;
  if (password === cPassword) {
    const token = jwt.sign({
      iss: "polly proxy",
      sub: user_id,
    }, secret, option);
    res.cookie('session_cookie', token, {
      secure: false,
      httpOnly: false,
    });
    res.send('OK');
  } else {
    res.status(401).send('unauthorized');
  }
});

function check(req, res, next) {
  console.log('check called');
  const auth = req.headers.authorization;
  console.log(auth);
}

module.exports = {
  loginRouter: router,
  check,
};
