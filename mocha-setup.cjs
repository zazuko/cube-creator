/* eslint-disable @typescript-eslint/no-var-requires */
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

import('./packages/testing/lib/chaiShapeMatcher.js')

chai.use(sinonChai)
