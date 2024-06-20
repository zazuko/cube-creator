import { Readable } from 'stream'
import type { Quad, Stream, Term } from '@rdfjs/types'
import express from 'express'
import asyncMiddleware from 'middleware-async'
import through2 from 'through2'
import { oa } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env-node'
import env from '../env.js'

function rewriteTerm<T extends Term>(term: T): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE)) as any
  }

  return term
}

export interface ShouldRewrite {
  // eslint-disable-next-line no-unused-vars
  (quad: Quad): true | { [p in keyof Quad]?: false }
}

const defaultShouldRewrite: ShouldRewrite = ({ predicate }) => {
  if (predicate.equals(oa.canonical)) {
    return {
      object: false,
    }
  }

  return true
}

/**
 * Rewrites quad to change canonical URIs with API namespace with the exception of oa:canonical property
 */
function rewriteQuad(quad: Quad, shouldRewriteCheck: ShouldRewrite = defaultShouldRewrite): Quad {
  const shouldRewrite = shouldRewriteCheck(quad)

  const rewriteSubject = shouldRewrite === true || shouldRewrite.subject !== false
  const rewritePredicate = shouldRewrite === true || shouldRewrite.predicate !== false
  const rewriteObject = shouldRewrite === true || shouldRewrite.object !== false
  const rewriteGraph = shouldRewrite === true || shouldRewrite.graph !== false

  return $rdf.quad(
    rewriteSubject ? rewriteTerm(quad.subject) : quad.subject,
    rewritePredicate ? rewriteTerm(quad.predicate) : quad.predicate,
    rewriteObject ? rewriteTerm(quad.object) : quad.object,
    rewriteGraph ? rewriteTerm(quad.graph) : quad.graph,
  )
}

export const patchResponseStream: express.RequestHandler = asyncMiddleware(async (req, res, next) => {
  const { quadStream } = res

  res.quadStream = (stream: Stream & Readable) => {
    if (res.locals.noRewrite === true) {
      // when set to true, res.locals.noRewrite prevents the rewrite of
      // canonical terms to cube-creator URIs
      return quadStream(stream)
    }

    const rewriteTerms = through2.obj(function (chunk: Quad, enc, callback) {
      if (typeof res.locals.noRewrite === 'function') {
        this.push(rewriteQuad(chunk, res.locals.noRewrite))
      } else {
        this.push(rewriteQuad(chunk))
      }

      callback()
    })

    return quadStream(stream.pipe(rewriteTerms))
  }

  next()
})
