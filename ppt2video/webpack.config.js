const cmd_config = {
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
  },

  ignoreWarnings: [
    {
      module: /log4js|aws-crt/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

const lib_config = {
  entry: "./src/browser.js",

  output: {
    filename: "browser.js",
    library: "ppt2video",
  },

  target: "web",
  mode: "production",

  devServer: {
    static: "./",
    port: 8000,
    hot: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    },
    client: {
      overlay: false,
    }
  }
};

export default [lib_config, cmd_config]
