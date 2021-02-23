import $rdf from 'rdf-ext'
import { TransformJob } from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { DatasetCore, Quad, Term } from 'rdf-js'
import map from 'barnard59-base/lib/map'
import { Dictionary } from '@rdfine/prov'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'
import { MultiPointer } from 'clownface'
import * as Models from '@cube-creator/model'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { HydraResponse } from 'alcaeus'

Hydra.resources.factory.addMixin(...Object.values(Models))

const pendingRequests = new Map<string, Promise<any>>()
function load<T extends RdfResourceCore>(uri: string): Promise<HydraResponse<DatasetCore, T>> {
  let promise = pendingRequests.get(uri)
  if (!promise) {
    promise = Hydra.loadResource<T>(uri)
      .then(response => {
        pendingRequests.delete(uri)
        return response
      })
    pendingRequests.set(uri, promise)
  }

  return promise
}

async function loadMetadata(jobUri: string) {
  const jobResource = await load<TransformJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  if (!job.dimensionMetadata.load) {
    throw new Error(`Dimension Metadata ${job.dimensionMetadata.id.value} can not be loaded`)
  }

  const dimensionMetadataResource = await job.dimensionMetadata?.load()
  if (!dimensionMetadataResource.representation) {
    throw new Error(`Dimension Metadata ${job.dimensionMetadata.id.value} failed to load (${dimensionMetadataResource.response?.xhr.status})`)
  }

  return dimensionMetadataResource.representation.root
}

async function loadDimensionMapping(mappingUri: string) {
  const mappingResource = await load<Dictionary>(mappingUri)
  if (!mappingResource.representation) {
    throw new Error(`Mapping ${mappingUri} not loaded`)
  }

  return mappingResource.representation.root?.pointer
}

export async function mapDimensions(this: Pick<Context, 'variables'>) {
  const mappingCache = new TermMap<Term, MultiPointer | null>()
  const jobUri = this.variables.get('jobUri')
  const dimensionMetadataCollection = await loadMetadata(jobUri)

  function getDimensionMapping(predicate: Term) {
    let mappingTerm = mappingCache.get(predicate)
    if (typeof mappingTerm === 'undefined') {
      mappingTerm = dimensionMetadataCollection?.pointer
        .out(schema.hasPart)
        .has(schema.about, predicate)
        .out(cc.dimensionMapping) || null
      mappingCache.set(predicate, mappingTerm)
    }

    return mappingTerm
  }

  return map(async (quad: Quad) => {
    const { subject, predicate, object, graph } = quad
    const mappingTerm = getDimensionMapping(predicate)
    if (mappingTerm?.value) {
      const dict = await loadDimensionMapping(mappingTerm.value)
      const mappedValue = dict?.out(prov.hadDictionaryMember)
        .has(prov.pairKey, object)
        .out(prov.pairEntity)
      if (mappedValue?.term?.termType === 'NamedNode') {
        return $rdf.quad(subject, predicate, mappedValue.term, graph)
      }
    }

    return quad
  })
}
