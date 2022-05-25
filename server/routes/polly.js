const express = require("express");
const cors = require("cors");
const router = express.Router();

const bearerToken = require('express-bearer-token');
router.use(bearerToken());
const {loginRouter, check} = require('./login');
router.use(check);

const aws = require("aws-sdk");

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

var polly = new aws.Polly();

// allow CORS with all pre-flight request and POST /polly request
router.options("*", cors());

router.post("/", cors(), async function (req, res, next) {
  try {
    const data = await polly.synthesizeSpeech(req.body).promise();
    res.setHeader("content-type", data.ContentType);
    req.locals.len = data.RequestCharacters;
    res.send(data.AudioStream);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
