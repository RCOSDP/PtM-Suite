import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import config from './config.js';
import { router as pollyRouter } from './routes/polly.js';
import { router as loginRouter } from './routes/login.js';
import { router as wasmRouter } from './routes/wasm.js';

const app = express();

function pollyErrorHandler (err, req, res, next) {
  try {
    res.setHeader('content-type', "text/plain");
    res.status(err.statusCode).send(err.code);
  } catch(err) {
    next(err);
  }
}

morgan.token('info', (req, res) => {
  if (!req.locals) return "- -";
  let {id, user_id, len, message} = req.locals;
  if (message) return "- " + message;
  if (!id) id = "-";
  if (user_id) return `${id} ${user_id}`;
  if (!len) len = 0;
  return `${id} ${len}`;
});

app.use(morgan(':remote-addr :req[x-forwarded-for] :method :url :status :info'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/dialog/start', function (req, res) {
  res.redirect(config.dialogStartUrl);
});

app.use('/polly', pollyRouter);
app.use('/login', loginRouter);

if (config.wasm) {
  app.use('/app', wasmRouter);
}

app.use(express.static(path.join(__dirname, 'dist')));

app.use(pollyErrorHandler);

export default app;
