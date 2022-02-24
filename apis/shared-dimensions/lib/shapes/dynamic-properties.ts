import { DatasetCore, NamedNode, Quad } from 'rdf-js'
import { dash, hydra, rdf, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { iso6391, md } from '@cube-creator/core/namespace'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { toRdf } from 'rdf-literal'
import env from '../env'
import { parsingClient } from '../sparql'
import { rewriteTerm } from '../rewrite'

export interface DynamicPropertiesQuery {
  (targetClass: NamedNode, shape: NamedNode): Promise<Quad[]>
}

const dynamicPropertiesFromStore: DynamicPropertiesQuery = async function (targetClass, shape) {
  return CONSTRUCT`
    ${shape} ${sh.property} ?shProperty .
    ?shProperty ${sh.name} ?name ;
      ${sh.maxCount} ?maxCount ;
      ${sh.minCount} ?minCount ;
      ${sh.path} ?predicate ;
      ${hydra.collection} ?collection ;
      ${dash.editor} ?editor ;
      ${sh.datatype} ?dt ;
      ${sh.nodeKind} ?nodeKind ;
      ${sh.languageIn} ?lang ;
      ${sh.uniqueLang} ?uniqueLang ;
      ${sh.group} <urn:group:dynamic-props> ;
    .
    <urn:group:dynamic-props> ${rdfs.label} "Dynamic properties" ;
  `
    .FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
    .WHERE`
      ${targetClass} a ${md.SharedDimension} ;
                     ${schema.additionalProperty} ?property .

      ?property ${rdf.predicate} ?predicate ;
                ${rdfs.label} ?name ;
                ${hydra.required} ?required ;
      .

      BIND(IRI(CONCAT("urn:property:", str(?property))) as ?shProperty)
      BIND( IF(?required, 1, 0) as ?minCount )

      optional {
        ?property ${sh.class} ?termSet .

        BIND ( ${dash.AutoCompleteEditor} as ?editor )
        BIND (IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?collection)
      }
      optional {
        ?property ${sh.datatype} ?dt .
        FILTER (?dt != ${xsd.anyURI})
      }
      optional {
        ?property ${sh.datatype} ${xsd.anyURI} .
        BIND (${sh.IRI} as ?nodeKind)
      }
      optional {
        ?property ${sh.languageIn} ?langUri .
        BIND (true as ?uniqueLang)
        BIND (${rdf.langString} as ?dt)
        BIND (REPLACE(str(?langUri), "^${iso6391().value}", "") as ?lang)
      }
      optional {
        ?property ${schema.multipleValues} ?multipleValues .
      }
      BIND (IF(!BOUND(?multipleValues) || ?multipleValues = false, 1, ?UNDEF) as ?maxCount)
    `
    .execute(parsingClient.query)
}

function buildShaclLists(pointer: AnyPointer) {
  const props = pointer.has(sh.languageIn)

  for (const prop of props.toArray()) {
    const languages = prop.out(sh.languageIn)
    if (languages.isList()) {
      continue
    }

    prop
      .deleteOut(sh.languageIn)
      .addList(sh.languageIn, languages.values)
      .deleteOut(sh.maxCount)
      .addOut(sh.maxCount, languages.values.length)
  }
}

export async function loadDynamicTermProperties(targetClass: string | unknown, shape: GraphPointer<NamedNode>, dynamicPropertiesQuery = dynamicPropertiesFromStore): Promise<DatasetCore> {
  const dataset = $rdf.dataset()
  if (typeof targetClass === 'string') {
    dataset.addAll(await dynamicPropertiesQuery(rewriteTerm($rdf.namedNode(targetClass)), shape.term))
  }

  const pointer = clownface({ dataset })
  buildShaclLists(pointer)

  let order = 100
  const propsOrdered = pointer.has(sh.path).toArray()
    .sort((left, right) => {
      const leftName = left.out(rdfs.label, { language: ['en', '*'] }).value || ''
      const rightName = right.out(rdfs.label, { language: ['en', '*'] }).value || ''
      return leftName.localeCompare(rightName)
    })

  for (const prop of propsOrdered) {
    dataset.add($rdf.quad(prop.term, sh.order, toRdf(order++)))
  }

  return dataset
}
