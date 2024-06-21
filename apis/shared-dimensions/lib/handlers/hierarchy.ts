import type { Quad } from '@rdfjs/types'
import { dcterms, sd } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import $rdf from '@zazuko/env-node'
import env from '@cube-creator/core/env/node'
import { meta } from '@cube-creator/core/namespace'
import { ShouldRewrite } from '../middleware/canonicalRewrite.js'

export const get = asyncMiddleware(async (req, res) => {
  const hierarchy = await req.hydra.resource.clownface()

  if (!hierarchy.out(dcterms.source).terms.length) {
    hierarchy.addOut(dcterms.source, source => {
      source
        .addOut(sd.endpoint, $rdf.namedNode(env.PUBLIC_QUERY_ENDPOINT))
    })
  }

  const noRewriteRoots: ShouldRewrite = (quad: Quad) => {
    if (quad.predicate.equals(meta.hierarchyRoot)) {
      return {
        object: false,
      }
    }

    return true
  }

  res.locals.noRewrite = noRewriteRoots

  return res.dataset(hierarchy.dataset)
})
