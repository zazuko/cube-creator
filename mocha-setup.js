/* eslint-disable @typescript-eslint/no-var-requires */
require('@babel/register')({
  configFile: './babel.config.json',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
})

require('dotenv').config({
  path: require('path').resolve(__dirname, '.local.env')
})

require('chai-snapshot-matcher')
const chai = require('chai')
const sinonChai = require('sinon-chai')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

require('./packages/testing/lib/chaiShapeMatcher')

chai.use(sinonChai)
