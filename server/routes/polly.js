var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var polly = new AWS.Polly();

router.post('/', async function(req, res, next) {
  try {
    let data = await polly.synthesizeSpeech(req.body).promise();
    res.setHeader('content-type', data.ContentType);
    res.send(data.AudioStream);
  } catch (error) {
    next();
  }
});

module.exports = router;
