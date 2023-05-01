//
// router for WASM version
//

import express from "express";
import { router as pollyRouter } from './polly.js';
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

export { router };
