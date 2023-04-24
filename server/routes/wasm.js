//
// router for WASM version
//

const express = require("express");
const pollyRouter = require('./polly');
const router = express.Router();

router.use(function (req, res, next) {
  if (req.token) {
    delete req.token;
  }
  req.locals = {id: '-', len: 0};
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

router.use('/polly', pollyRouter);

module.exports = router;
