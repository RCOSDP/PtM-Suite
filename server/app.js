import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { fileURLToPath } from "url";
import moment from 'moment';
import { createStream } from 'rotating-file-stream';

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

const logStream = createStream('log.txt',{
  interval: '1d',
  path: config.httplogdir,
  immutable: true,
  teeToStdout: config.teeToStdout,
});

morgan.token('info', (req, res) => {
  if (!req.locals) return "- -";
  let {id, user_id, len, message, log, mp3size} = req.locals;

  // POST /login error
  if (message) return "- error " + message;

  // POST /login
  if (!id) id = "-";
  if (user_id) return `${id} ${user_id}`;

  // POST /log
  if (log) return `${id} ` + log.join(' ');

  // POST /app/polly
  if (!len) len = 0;
  if (!mp3size) mp3size = 0;
  return `${id} ${len} ${mp3size}`;
});

morgan.token('iso8601local', (req, res) => {
  return moment().toISOString(true);
})

app.use(morgan(':iso8601local :remote-addr :req[x-forwarded-for] :method :url :status :info', {
  stream: logStream,
}));

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
  app.get('/app/start', function (req, res) {
    res.redirect(config.appStartUrl);
  });
}

app.use(express.static(path.join(__dirname, 'dist')));

app.use(pollyErrorHandler);

export default app;
