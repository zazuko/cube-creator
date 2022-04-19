import { Term } from 'rdf-js'
import { dcterms, sd } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import $rdf from 'rdf-ext'
import coreEnv from '@cube-creator/core/env'
import env from '../../lib/env'

const hierarchyBase = env.MANAGED_DIMENSIONS_BASE + 'dimension/hierarchy'

function rewriteSharedDimensionTerms(term: Term) {
  if (term.termType !== 'NamedNode') {
    return false
  }

  return !term.value.startsWith(env.MANAGED_DIMENSIONS_BASE) ||
    term.value.startsWith(hierarchyBase)
}

export const get = asyncMiddleware(async (req, res) => {
  res.shouldRewrite = rewriteSharedDimensionTerms

  const hierarchy = await req.hydra.resource.clownface()

  if (!hierarchy.out(dcterms.source).terms.length) {
    hierarchy.addOut(dcterms.source, source => {
      source
        .addOut(sd.endpoint, $rdf.namedNode(coreEnv.PUBLIC_QUERY_ENDPOINT))
    })
  }

  return res.dataset(hierarchy.dataset)
})
