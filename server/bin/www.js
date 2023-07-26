#!/usr/bin/env node

/**
 * Module dependencies.
 */

import config from '../config.js';
import * as access from '../access.js';
import app from '../app.js';
import debugPackage from 'debug';
const debug = debugPackage('server:server');
import http from 'http';
import fs from 'fs';
import https from 'https';

/* initialize access */
if (config.authorization) {
  access.init();
}

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(config.port);
if (process.env.VERCEL) {
  // on vercel use 443 (standard https) port
  port = 443;
}
app.set("port", port);

var prot = config.prot;
if (process.env.VERCEL) {
  // on vercel, https will be handled by front end proxy, not node app
  prot = "http";
}
var server;

/**
 * Create HTTP server.
 */

if (prot == 'http') {
  server = http.createServer(app);
}

/**
 * Create HTTPS server.
 */

if (prot == 'https') {
  var options = {
    ca:   fs.readFileSync('keys/ca.crt'),
    key:  fs.readFileSync('keys/localhost.key'),
    cert: fs.readFileSync('keys/localhost.crt')
  };
  server = https.createServer(options,app);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
