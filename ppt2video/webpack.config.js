const cmd_config = {
  entry: "./bin/ppt2video.js",

  output: {
    filename: "ppt2video.js"
  },

  name: "node",
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

const script_config = {
  entry: "./src/browser.js",

  output: {
    filename: "browser.js",
    library: "ppt2video",
  },

  name: "web",
  target: "web",
  mode: "production",

  resolve: {
    alias: {
      "#target": "./browser"
    }
  },

  devServer: {
    port: 8000,
    hot: true,
    devMiddleware: {
      publicPath: '/app',
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    },
    client: {
      overlay: false,
    },
    proxy: [
      {
        context: ["/app/polly", "/app", "/ffmpeg"],
        target: "http://localhost:3003",
      }
    ]
  }
};

const lib_config = {
  entry: "./src/browser.js",

  experiments: {
    outputModule: true,
  },

  output: {
    filename: "lib.mjs",
    library: {
      type: 'module',
    },
  },

  name: "lib",
  target: "web",
  mode: "development",

  resolve: {
    alias: {
      "#target": "./browser"
    }
  },

  devtool: false,
};

export default [cmd_config, script_config, lib_config]
