// select and request to local or remote polly endpoint
const remoteServer = "https://polly-server-one.vercel.app";
const endpoint = "/polly";
export const pollyUrl =
  document.location.hostname == "localhost"
    ? endpoint
    : `${remoteServer}${endpoint}`;

export const dialogStartUrl = document.location.origin + '/dialog/start';
