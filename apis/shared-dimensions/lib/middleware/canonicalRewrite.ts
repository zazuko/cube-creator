import express from 'express'
import asyncMiddleware from 'middleware-async'
import through2 from 'through2'
import { Quad, Stream, Term } from 'rdf-js'
import { Readable } from 'stream'
import { oa } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import env from '../env'

export function rewriteTerm<T extends Term>(term: T): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE)) as any
  }

  return term
}

/**
 * Rewrites quad to change canonical URIs with API namespace with the exception of oa:canonical property
 */
function rewriteQuad({ subject, predicate, object, graph }: Quad): Quad {
  return $rdf.quad(
    rewriteTerm(subject),
    rewriteTerm(predicate),
    predicate.equals(oa.canonical) ? object : rewriteTerm(object),
    rewriteTerm(graph),
  )
}

export const patchResponseStream: express.RequestHandler = asyncMiddleware(async (req, res, next) => {
  const { quadStream } = res

  res.quadStream = (stream: Stream & Readable) => {
    const rewriteTerms = through2.obj(function (chunk: Quad, enc, callback) {
      this.push(rewriteQuad(chunk))

      callback()
    })

    return quadStream(stream.pipe(rewriteTerms))
  }

  next()
})
