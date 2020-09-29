const publicPath = process.env.PUBLIC_PATH || '/'

module.exports = {
  publicPath,
  devServer: {
    disableHostCheck: true
  }
}
