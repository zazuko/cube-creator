import type { Context } from 'barnard59-core/lib/Pipeline'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { Hydra } from 'alcaeus/node'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { NamedNode } from 'rdf-js'

interface DimensionQuery {
  endpoint: NamedNode
  graph: NamedNode | undefined
  cube: NamedNode
  metadataResource: string
}

/**
 * Populates cc:DimensionMetadataResource with dimensions found in the imported cube
 */
export default async function query(this: Context, { endpoint, cube, graph, metadataResource }: DimensionQuery) {
  const client = new ParsingClient({
    endpointUrl: endpoint.value,
  })

  const { response, representation } = await Hydra.loadResource(metadataResource)
  if (!representation?.root) {
    throw new Error(`Failed to load existing dimension metadata. Response was: '${response?.xhr.statusText}'`)
  }
  const existingCollection = representation.root.pointer.any()

  const metadataCollection = clownface({ dataset: $rdf.dataset() })
    .namedNode(metadataResource)
    .addOut(rdf.type, [ns.cc.DimensionMetadataCollection, hydra.Resource])

  let query = SELECT.DISTINCT`?dimension`
    .WHERE`
      ${cube} ${ns.cube.observationConstraint} ?shape .
      ?shape ${sh.property} ?property .
      ?property ${sh.path} ?dimension .

      filter(
        !(?dimension in ( ${rdf.type}, ${ns.cube.observedBy} ))
      )
    `

  let dimensionMetadata = CONSTRUCT`?dimension ?p ?o`
    .WHERE`
      ${cube} a ${ns.cube.Cube} ; ${ns.cube.observationConstraint} ?shape .

      ?shape ${sh.property} ?property .
      ?property ${sh.path} ?dimension .
      ?property ?p ?o .

      filter (
        !strstarts(str(?p), str(${sh()}))
      )
    `

  if (graph) {
    query = query.FROM(graph)
    dimensionMetadata = dimensionMetadata.FROM(graph)
  }

  const importedDimensionMetadata = $rdf.dataset([...await dimensionMetadata.execute(client.query)])

  const dimensions = await query.execute(client.query)
  for (let i = 1; i <= dimensions.length; i++) {
    const { dimension } = dimensions[i - 1]

    this.log.debug(`Adding dimension ${dimension.value}`)

    const dimensionMetadata = metadataCollection.namedNode(`${metadataCollection.value}/${i}`)
    metadataCollection.addOut(schema.hasPart, dimensionMetadata, dm => {
      dm.addOut(schema.about, dimension)
      const existingMetadata = existingCollection.has(schema.about, dimension)
      if (existingMetadata.term) {
        existingCollection.dataset.match(existingMetadata.term)
          .forEach(({ predicate, object }) => dm.addOut(predicate, object))
      }

      importedDimensionMetadata.match(dimension)
        .forEach(({ predicate, object }) => {
          const existingValues = existingMetadata.out(predicate).terms
          if (existingValues.length === 0) {
            dm.addOut(predicate, object)
            return
          }

          if (object.termType === 'Literal' && existingValues.every((term: any) => term.language !== object.language)) {
            dm.addOut(predicate, object)
          }
        })
    })
  }

  return metadataCollection.dataset.toStream()
}
