module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/app/'
    : '/',
  devServer: {
    disableHostCheck: true
  }
}
