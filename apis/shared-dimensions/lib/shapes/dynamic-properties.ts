import { Request } from 'express'
import { dash, hydra, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { md } from '@cube-creator/core/namespace'
import parsePreferHeader from 'parse-prefer-header'
import { NamedNode, Quad } from 'rdf-js'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { SparqlTemplateResult } from '@tpluscode/rdf-string'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { GraphPointer } from 'clownface'
import { toRdf } from 'rdf-literal'
import env from '../env'
import { parsingClient } from '../sparql'
import { rewriteTerm } from '../rewrite'

interface DynamicPropertiesForTerm {
  shape: GraphPointer
  target: NamedNode
  client: ParsingClient
}

interface DynamicPropertiesForTermSet {
  shape: GraphPointer
  targetClass: NamedNode
  client: ParsingClient
}

type LoadDynamicProperties = DynamicPropertiesForTerm | DynamicPropertiesForTermSet

async function dynamicPropertiesQuery({ shape, client, ...targets }: LoadDynamicProperties) {
  let additionalPropertyPatterns: SparqlTemplateResult
  if ('target' in targets) {
    additionalPropertyPatterns = sparql`
      ${targets.target} ${schema.inDefinedTermSet} ?sharedDimension .
      ?sharedDimension a ${md.SharedDimension} ;
                       ${schema.additionalProperty} ?property .
    `
  } else {
    additionalPropertyPatterns = sparql`
      ${targets.targetClass} a ${md.SharedDimension} ;
                             ${schema.additionalProperty} ?property .
    `
  }

  return CONSTRUCT`
    ${shape.term} ${sh.property} [
      ${sh.name} ?name ;
      ${sh.maxCount} 1 ;
      ${sh.minCount} ?minCount ;
      ${sh.path} ?predicate ;
      ${hydra.collection} ?collection ;
      ${dash.editor} ?editor ;
      ${sh.datatype} ?dt ;
    ]
  `
    .FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
    .WHERE`
      ${additionalPropertyPatterns}

      ?property ${rdf.predicate} ?predicate ;
                ${rdfs.label} ?name ;
                ${hydra.required} ?required ;
      .

      BIND( IF(?required, 1, 0) as ?minCount )

      optional {
        ?property ${sh.class} ?termSet .

        BIND ( ${dash.AutoCompleteEditor} as ?editor )
        BIND (IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?collection)
      }
      optional {
        ?property ${sh.datatype} ?dt
      }
    `
    .execute(client.query)
}

export async function * loadDynamicTermProperties(req: Request, shape: GraphPointer) {
  const { target, targetClass } = parsePreferHeader(req.header('Prefer'))
  let dynamicProperties: Quad[] = []
  if (typeof target === 'string') {
    dynamicProperties = await dynamicPropertiesQuery({
      shape,
      client: parsingClient,
      target: rewriteTerm($rdf.namedNode(target)),
    })
  } else if (typeof targetClass === 'string') {
    dynamicProperties = await dynamicPropertiesQuery({
      shape,
      client: parsingClient,
      targetClass: rewriteTerm($rdf.namedNode(targetClass)),
    })
  }

  let order = 100
  for (const quad of dynamicProperties) {
    if (quad.predicate.equals(sh.path)) {
      yield $rdf.quad(quad.subject, sh.order, toRdf(order++))
    }
    yield quad
  }
}
