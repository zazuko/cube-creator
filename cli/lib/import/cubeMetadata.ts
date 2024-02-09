import type { DatasetCore, NamedNode, Quad, Term } from '@rdfjs/types'
import { cc } from '@cube-creator/core/namespace'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import type { Context } from 'barnard59-core/lib/Pipeline'
import StreamClient from 'sparql-http-client'
import $rdf from 'rdf-ext'
import { sparql, CONSTRUCT } from '@tpluscode/sparql-builder'
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

const mirroredProperties: [NamedNode, NamedNode][] = [
  [schema.name, dcterms.title],
  [schema.description, dcterms.description],
]

function createQuery(cube: NamedNode, datasetResource: NamedNode, graph: NamedNode | undefined) {
  const bindMirrored = mirroredProperties.reduce((patterns, [a, b]) =>
    sparql`${patterns}

    optional { filter(?p = ${a})
      bind(${b} as ?p1)
    }
    optional { filter(?p = ${b})
      bind(${a} as ?p1)
    }`, sparql``)

  const cubeMetaQuery = CONSTRUCT`${datasetResource} ?p ?o ; ?p1 ?o .`
    .WHERE`
      ${cube} ?p ?o .

      filter(
        !strstarts(str(?p), str(${ns.cube()}))
      )

      filter ( !isBlank(?o) )

      ${bindMirrored}
    `
  if (graph) {
    return cubeMetaQuery.FROM(graph)
  }

  return cubeMetaQuery
}

function preserveExistingValues(dataset: DatasetCore) {
  return through2.obj(function (quad: Quad, enc, callback) {
    const existingValues = [...dataset.match(quad.subject, quad.predicate)]

    const { object } = quad
    if (object.termType === 'Literal' && existingValues.every((term: any) => term.object.language !== object.language)) {
      this.push(quad)
    }

    callback()
  })
}

function prepareNewCubeResource(cubeResource: Cube.Cube, datasetResource: NamedNode) {
  const pointer = clownface({ dataset: $rdf.dataset() }).namedNode(datasetResource)
  create(pointer, {
    hasPart: [Cube.create(pointer.node(cubeResource.id), {
      creator: cubeResource.creator,
    })],
  })
  pointer.deleteOut(schema.dateCreated)
  const existingMeta = extractExistingMetadata($rdf.dataset([...cubeResource.pointer.dataset]), datasetResource, datasetResource)
  pointer.dataset.addAll([...existingMeta])

  return pointer.dataset
}

export default async function query(this: Context, { cube, graph, endpoint, ...rest }: CubeMetadataQuery) {
  const client = new StreamClient({
    endpointUrl: endpoint.value,
  })

  const datasetResource = $rdf.namedNode(rest.datasetResource)
  const Hydra = this.variables.get('apiClient')
  const { representation, response } = await Hydra.loadResource(datasetResource)
  const cubeResource = representation?.get<Cube.Cube>(cube.value)
  if (!cubeResource) {
    throw new Error(`Failed to load cube dataset. Response was: '${response?.xhr.statusText}'`)
  }

  const cubeMetaQuery = createQuery(cube, datasetResource, graph)

  const metaCollection = prepareNewCubeResource(cubeResource, datasetResource)

  const newMetadata = (await cubeMetaQuery.execute(client.query))

  return readable(merge(
    newMetadata.pipe(preserveExistingValues(metaCollection)),
    metaCollection.toStream(),
  ))
}
