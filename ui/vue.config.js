// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

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
  'cc-form',
  'rdf-editor',
  'tagged-literal'
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

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
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
            isCustomElement: tag => customElements.includes(tag),
          }
        }
      })
  },
}
