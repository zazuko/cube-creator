import { Quad, Stream, Term } from 'rdf-js'
import { Readable } from 'stream'
import express from 'express'
import asyncMiddleware from 'middleware-async'
import through2 from 'through2'
import { oa } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import env from '../env'

export function rewriteTerm<T extends Term>(term: T): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE)) as any
  }

  return term
}

declare module 'express-serve-static-core' {
  interface Response {
    shouldRewrite(term: Term, quad: Quad): boolean
  }
}

/**
 * Rewrites quad to change canonical URIs with API namespace.
 * By default, skips object oa:canonical property
 * The condition can be changed by setting `res.shouldRewrite`
 */
export const patchResponseStream: express.RequestHandler = asyncMiddleware(async (req, res, next) => {
  const { quadStream } = res

  res.shouldRewrite = (term, { predicate }) => !predicate.equals(oa.canonical)

  function conditionalRewrite<T extends Term>(term: T, quad: Quad): T {
    return res.shouldRewrite(term, quad) ? rewriteTerm(term) : term
  }

  function rewriteQuad(quad: Quad): Quad {
    const { subject, predicate, object, graph } = quad

    return $rdf.quad(
      conditionalRewrite(subject, quad),
      conditionalRewrite(predicate, quad),
      conditionalRewrite(object, quad),
      conditionalRewrite(graph, quad),
    )
  }

  res.quadStream = (stream: Stream & Readable) => {
    const rewriteTerms = through2.obj(function (chunk: Quad, enc, callback) {
      this.push(rewriteQuad(chunk))

      callback()
    })

    return quadStream(stream.pipe(rewriteTerms))
  }

  next()
})
