module.exports = {
  entry: "./bin/ppt2video.js",

  output: {
    filename: "ppt2video.js"
  },

  target: "node",
  mode: "production",

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "shebang-loader",
      }
    ]
  }
};
