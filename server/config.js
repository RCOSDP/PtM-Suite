const config = {
  port: process.env.PORT || '3000',
  prot: process.env.PROT || 'https',
  dialogStartUrl: process.env.POLLY_DIALOG_START_URL || 'https://localhost:3006/dialog/start',
  authorization: (process.env.POLLY_AUTHORIZATION  === "true") || false,
  usageLimit: parseInt(process.env.POLLY_USAGE_LIMIT) || 1000000,
  checkInterval: parseInt(process.env.POLLY_CHECK_INTERVAL) || 10,
  updateInterval: parseInt(process.env.POLLY_UPDATE_INTERVAL) || 600,
  logdir: process.env.POLLY_LOGDIR || "log",
  wasm: (process.env.POLLY_WASM === "true") || false,
  appStartUrl: process.env.POLLY_APP_START_URL || 'https://localhost:3006/dialog/start',
  httplogdir: process.env.POLLY_HTTPLOGDIR || "httplog",
  teeToStdout: (process.env.POLLY_TEETOSTDOUT === "true") || false,
};

export default config;
