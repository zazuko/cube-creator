// eslint-disable-next-line @typescript-eslint/no-var-requires
process.env.VUE_APP_VERSION = require('./package.json').version

const publicPath = process.env.PUBLIC_PATH || '/'

module.exports = {
  publicPath,
  devServer: {
    disableHostCheck: true,
    progress: false,
  },
}
