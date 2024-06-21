import type { DatasetCore, NamedNode, Term } from '@rdfjs/types'
import type { Context } from 'barnard59-core'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import type { AnyContext, AnyPointer, GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'

interface DimensionQuery {
  endpoint: NamedNode
  graph: NamedNode | undefined
  cube: NamedNode
  metadataResource: string
}

function createCubeQuery(cube: NamedNode, graph?: NamedNode) {
  const query = SELECT.DISTINCT`?dimension`
    .WHERE`
      ${cube} ${ns.cube.observationConstraint} ?shape .
      ?shape ${sh.property} ?property .
      ?property ${sh.path} ?dimension .

      filter(
        !(?dimension in ( ${rdf.type}, ${ns.cube.observedBy} ))
      )
    `
  if (graph) {
    return query.FROM(graph)
  }

  return query
}

function createMetadataQuery(cube: NamedNode, graph?: NamedNode) {
  const dimensionMetadata = CONSTRUCT`?dimension ?p ?o`
    .WHERE`
      ${cube} a ${ns.cube.Cube} ; ${ns.cube.observationConstraint} ?shape .

      ?shape ${sh.property} ?property .
      ?property ${sh.path} ?dimension .
      ?property ?p ?o .

      filter (
        !strstarts(str(?p), str(${sh()}))
      )

      filter ( !isBlank(?o) )
    `

  if (graph) {
    return dimensionMetadata.FROM(graph)
  }

  return dimensionMetadata
}

interface AddMetadata {
  id: any
  metadataCollection: GraphPointer
  dimension: Term
  existingCollection: AnyPointer<AnyContext, DatasetCore>
  importedDimensionMetadata: DatasetExt
}

function addMetadata({ id, metadataCollection, dimension, existingCollection, importedDimensionMetadata }: AddMetadata) {
  const dimensionMetadata = metadataCollection.namedNode(`${metadataCollection.value}/${id}`)

  metadataCollection.addOut(schema.hasPart, dimensionMetadata, dm => {
    dm.addOut(schema.about, dimension)
    const existingMetadata = existingCollection.has(schema.about, dimension)
    if (existingMetadata.term) {
      [...existingCollection.dataset.match(existingMetadata.term, null, null, metadataCollection.term)]
        .forEach(({ predicate, object }) => {
          dm.addOut(predicate, object, ptr => {
            if (object.termType === 'BlankNode') {
              [...existingCollection.dataset.match(object, null, null, metadataCollection.term)]
                .forEach(({ predicate, object }) => ptr.addOut(predicate, object))
            }
          })
        })
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

/**
 * Populates cc:DimensionMetadataResource with dimensions found in the imported cube
 */
export default async function query(this: Context, { endpoint, cube, graph, metadataResource }: DimensionQuery) {
  const client = new ParsingClient({
    endpointUrl: endpoint.value,
  })
  const streamClient = new StreamClient({
    endpointUrl: endpoint.value,
  })

  const { response, representation } = await this.env.hydra.loadResource(metadataResource)
  if (!representation?.root) {
    throw new Error(`Failed to load existing dimension metadata. Response was: '${response?.xhr.statusText}'`)
  }
  const existingCollection = representation.root.pointer.any()

  const metadataCollection = $rdf.clownface()
    .namedNode(metadataResource)
    .addOut(rdf.type, [ns.cc.DimensionMetadataCollection, hydra.Resource])

  const cubeQuery = createCubeQuery(cube, graph)
  const metadataQuery = createMetadataQuery(cube, graph)

  const importedDimensionMetadata = await $rdf.dataset().import(await metadataQuery.execute(streamClient))

  const dimensions = await cubeQuery.execute(client)
  for (let i = 1; i <= dimensions.length; i++) {
    const { dimension } = dimensions[i - 1]

    this.logger.debug(`Adding dimension ${dimension.value}`)

    addMetadata({
      id: i,
      existingCollection,
      importedDimensionMetadata,
      dimension,
      metadataCollection,
    })
  }

  return metadataCollection.dataset.toStream()
}
