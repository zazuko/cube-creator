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
const quantifiers = require('chai-quantifiers')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.use(quantifiers)

require('./packages/testing/lib/chaiShapeMatcher')

chai.use(sinonChai)
