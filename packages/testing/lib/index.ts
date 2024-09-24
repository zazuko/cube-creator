import StreamClient from 'sparql-http-client/StreamClient'
import ParsingClient from 'sparql-http-client/ParsingClient'

const endpoints = (db: 'cube-creator' | 'shared-dimensions') => ({
  updateUrl: `https://db.cube-creator.lndo.site/${db}/update`,
  endpointUrl: `https://db.cube-creator.lndo.site/${db}/query`,
  storeUrl: `https://db.cube-creator.lndo.site/${db}/data`,
})

export const ccClients = {
  parsingClient: new ParsingClient(endpoints('cube-creator')),
  streamClient: new StreamClient(endpoints('cube-creator')),
}

export const mdClients = {
  parsingClient: new ParsingClient(endpoints('shared-dimensions')),
  streamClient: new StreamClient(endpoints('shared-dimensions')),
}
