// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const { resolve } = require('path')

// eslint-disable-next-line @typescript-eslint/no-var-requires
process.env.VUE_APP_VERSION = require('./package.json').version

const publicPath = process.env.PUBLIC_PATH || '/'

const websocketConfig = {}
if (process.env.NO_WEBSOCKET === 'true') {
  websocketConfig.webSocketServer = false
  websocketConfig.hot = false
  websocketConfig.liveReload = false
}

const customElements = [
  'rdf-editor',
  'tagged-literal',
  'markdown-render',
  'form-object',
  'form-property'
]

module.exports = {
  publicPath,
  devServer: {
    allowedHosts: 'all',
    ...websocketConfig,
    client: {
      progress: false,
    },
  },
  configureWebpack: config => {
    // Webpack 5 doesn't provide polyfills so we need to do it manually
    config.resolve.fallback = {
      crypto: false,
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
    }

    const shoelaceAssets = process.env.NODE_ENV === 'production'
      ? 'dist/shoelace/assets'
      : 'dist/app/shoelace/assets'

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: resolve(__dirname, '../node_modules/@shoelace-style/shoelace/dist/assets'),
            to: resolve(__dirname, shoelaceAssets)
          }
        ]
      })
    )
  },
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            isCustomElement: tag => customElements.includes(tag) || tag.startsWith('cc-'),
          }
        }
      })
  },
}
