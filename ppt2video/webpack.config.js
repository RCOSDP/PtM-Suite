import webpack from 'webpack';

const cmd_config = {
  entry: "./bin/ppt2video.js",

  output: {
    filename: "ppt2video.js",
    asyncChunks: false,
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
      module: /log4js/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],

  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /canvas/,
      contextRegExp: /jsdom$/,
    }),
  ],

  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
};

const script_config = {
  entry: "./src/browser.js",

  output: {
    filename: "browser.js",
    library: "ppt2video",
    asyncChunks: false,
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
    asyncChunks: false,
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
