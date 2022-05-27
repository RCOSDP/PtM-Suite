const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const pollyRouter = require('./routes/polly');
const {loginRouter, check} = require('./routes/login');

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
app.use(express.static(path.join(__dirname, 'dist')));

const dialogStartUrl = process.env.POLLY_DIALOG_START_URL || 'https://localhost:3006/dialog/start';
app.get('/dialog/start', function (req, res) {
  res.redirect(dialogStartUrl);
});

app.use('/polly', pollyRouter);
app.use('/login', loginRouter);
app.use(pollyErrorHandler);

module.exports = app;
