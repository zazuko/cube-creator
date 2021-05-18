import { cc } from '@cube-creator/core/namespace'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { NamedNode, Quad, Term } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { Context } from 'barnard59-core/lib/Pipeline'
import StreamClient from 'sparql-http-client'
import $rdf from 'rdf-ext'
import { Hydra } from 'alcaeus/node'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import * as ns from '@cube-creator/core/namespace'
import clownface from 'clownface'
import { create } from '@cube-creator/model/Dataset'
import * as Cube from '@cube-creator/model/Cube'
import through2 from 'through2'
import { readable } from 'duplex-to'
import merge from 'merge2'

interface CubeMetadataQuery {
  endpoint: NamedNode
  graph: NamedNode | undefined
  cube: NamedNode
  datasetResource: string
}
const ccValue = cc().value

function * extractExistingMetadata(dataset: DatasetExt, graph: Term, id: Term): Generator<Quad> {
  const quads = dataset.match(id, null, null, graph)
    .filter(({ predicate }) => !predicate.value.startsWith(ccValue))
    .filter(({ predicate }) => !predicate.equals(schema.dateCreated))

  for (const quad of quads) {
    yield quad
    if (quad.object.termType === 'BlankNode') {
      for (const childQuad of extractExistingMetadata(dataset, graph, quad.object)) {
        yield childQuad
      }
    }
  }
}

export default async function query(this: Context, { cube, graph, endpoint, ...rest }: CubeMetadataQuery) {
  const client = new StreamClient({
    endpointUrl: endpoint.value,
  })

  const datasetResource = $rdf.namedNode(rest.datasetResource)
  const { representation, response } = await Hydra.loadResource(datasetResource)
  const cubeResource = representation?.get<Cube.Cube>(cube.value)
  if (!cubeResource) {
    throw new Error(`Failed to load cube dataset. Response was: '${response?.xhr.statusText}'`)
  }

  let cubeMetaQuery = CONSTRUCT`${datasetResource} ?p ?o`
    .WHERE`
      ${cube} ?p ?o .

      filter(
        !strstarts(str(?p), str(${ns.cube()}))
      )
    `
  if (graph) {
    cubeMetaQuery = cubeMetaQuery.FROM(graph)
  }

  const pointer = clownface({ dataset: $rdf.dataset() }).namedNode(datasetResource)
  create(pointer, {
    hasPart: [Cube.create(pointer.namedNode(cube), {
      creator: cubeResource.creator,
    })],
  })
  pointer.deleteOut(schema.dateCreated)
  const existingMeta = extractExistingMetadata($rdf.dataset([...cubeResource.pointer.dataset]), datasetResource, datasetResource)
  pointer.dataset.addAll([...existingMeta])

  const newMetadata = (await cubeMetaQuery.execute(client.query))
    .pipe(through2.obj(function (quad: Quad, enc, callback) {
      const existingValues = [...pointer.dataset.match(quad.subject, quad.predicate)]

      const { object } = quad
      if (object.termType !== 'Literal' || existingValues.every((term: any) => term.object.language !== object.language)) {
        this.push(quad)
      }

      callback()
    }))

  return readable(merge(
    newMetadata,
    pointer.dataset.toStream(),
  ))
}
