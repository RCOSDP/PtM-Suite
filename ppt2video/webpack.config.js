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

const lib_config = {
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
    static: [
      "public",
      "node_modules/@ffmpeg/ffmpeg/dist",
      "node_modules/@ffmpeg/core/dist"
    ],
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
