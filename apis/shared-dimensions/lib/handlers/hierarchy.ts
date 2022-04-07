import { dcterms, sd } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import $rdf from 'rdf-ext'
import env from '@cube-creator/core/env'

export const get = asyncMiddleware(async (req, res) => {
  const hierarchy = await req.hydra.resource.clownface()

  if (!hierarchy.out(dcterms.source).terms.length) {
    hierarchy.addOut(dcterms.source, source => {
      source
        .addOut(sd.endpoint, $rdf.namedNode(env.PUBLIC_QUERY_ENDPOINT))
    })
  }

  return res.dataset(hierarchy.dataset)
})
