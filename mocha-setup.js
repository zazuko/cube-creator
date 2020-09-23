/* eslint-disable @typescript-eslint/no-var-requires */
require('@babel/register')({
  configFile: './babel.config.json',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
})

require('dotenv').config({
  path: require('path').resolve(__dirname, '.local.env')
})
