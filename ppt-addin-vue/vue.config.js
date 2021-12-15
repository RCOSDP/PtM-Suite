var fs = require("fs");
var path = require("path");

// switch devServer config for local or vercel server
if (process.env.VERCEL) {
  module.exports = {
    devServer: {},
  };
} else {
  module.exports = {
    devServer: {
      port: 3000,
      https: true,
      key: fs.readFileSync(path.resolve(`keys/localhost.key`)),
      cert: fs.readFileSync(path.resolve(`keys/localhost.crt`)),
      ca: fs.readFileSync(path.resolve(`keys/ca.crt`)),
      proxy: {
        "/polly": {
          target: "http://localhost:3003",
        },
        "/login": {
          target: "http://localhost:3003",
        },
        "/dialog": {
          target: "http://localhost:3006",
        },
      },
    },
  };
}
