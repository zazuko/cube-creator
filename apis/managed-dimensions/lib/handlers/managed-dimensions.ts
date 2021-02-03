import { hydra, schema } from '@tpluscode/rdf-ns-builders'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { asyncMiddleware } from 'middleware-async'
import httpError from 'http-errors'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { md } from '@cube-creator/core/namespace'

export const get = asyncMiddleware(async (req, res) => {
  const query = await CONSTRUCT`
    ${req.hydra.resource.term} ${hydra.member} ?termSet ; a ${md.ManagedDimensions}.
    ?termSet ?p ?o .
  `
    .WHERE`
      GRAPH ?g {
        ?termSet a ${schema.DefinedTermSet}, ${md.ManagedDimension} .
        ?termSet ?p ?o .
      }
    `
    .execute(req.labyrinth.sparql.query)

  return res.quadStream(query)
})

export const getTerms = asyncMiddleware(async (req, res, next) => {
  const termSet = clownface({ dataset: await req.dataset() })
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)

  if (!termSet.term) {
    return next(new httpError.NotFound())
  }

  const collection = await $rdf.dataset().import(await CONSTRUCT`
      ${req.hydra.term} ${hydra.member} ?term ; a ${md.ManagedDimensionTerms} .
      ?term ?p ?o .
    `
    .WHERE`
      GRAPH ?g {
        ${termSet.term} a ${md.ManagedDimension} .
        ?term ${schema.inDefinedTermSet} ${termSet.term} ; ?p ?o .
      }
    `
    .execute(req.labyrinth.sparql.query))

  if (collection.size === 0) {
    return next(new httpError.NotFound())
  }

  return res.dataset(collection)
})