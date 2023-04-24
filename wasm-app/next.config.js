/** @type {import('next').NextConfig} */

const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const commonConfig = {
  reactStrictMode: true,
  basePath: "/app",
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    return config
  },
}

const devConfig = {
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return {
      fallback: [
        {
          basePath: false,
          source: '/:path*',
          destination: 'http://localhost:3003/:path*',
        }
      ]
    };
  },
}

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...commonConfig,
      ...devConfig,
    };
  }

  return {
    ...commonConfig,
    output: 'export',
    distDir: 'dist',
  }
};
