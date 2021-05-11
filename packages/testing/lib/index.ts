import StreamClient from 'sparql-http-client/StreamClient'
import ParsingClient from 'sparql-http-client/ParsingClient'

const endpoints = (db: 'cube-creator' | 'shared-dimensions') => ({
  updateUrl: `http://db.cube-creator.lndo.site/${db}/update`,
  endpointUrl: `http://db.cube-creator.lndo.site/${db}/query`,
  storeUrl: `http://db.cube-creator.lndo.site/${db}/data`,
})

export const ccClients = {
  parsingClient: new ParsingClient(endpoints('cube-creator')),
  streamClient: new StreamClient(endpoints('cube-creator')),
}

export const mdClients = {
  parsingClient: new ParsingClient(endpoints('shared-dimensions')),
  streamClient: new StreamClient(endpoints('shared-dimensions')),
}
