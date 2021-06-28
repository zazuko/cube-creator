import $rdf from 'rdf-ext'
import { ImportJob, TransformJob } from '@cube-creator/model'
import { HydraClient } from 'alcaeus/alcaeus'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { DatasetCore, Quad, Term } from 'rdf-js'
import map from 'barnard59-base/lib/map'
import { Dictionary } from '@rdfine/prov'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'
import { MultiPointer } from 'clownface'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { HydraResponse } from 'alcaeus'
import { DefaultCsvwLiteral } from '@cube-creator/core/mapping'

const undef = $rdf.literal('', cube.Undefined)

const pendingRequests = new Map<string, Promise<any>>()
function load<T extends RdfResourceCore>(uri: string, Hydra: HydraClient, headers?: HeadersInit): Promise<HydraResponse<DatasetCore, T>> {
  let promise = pendingRequests.get(uri)
  if (!promise) {
    promise = Hydra.loadResource<T>(uri, headers)
      .then(response => {
        pendingRequests.delete(uri)
        return response
      })
    pendingRequests.set(uri, promise)
  }

  return promise
}

async function loadMetadata(jobUri: string, Hydra: HydraClient) {
  const jobResource = await load<TransformJob | ImportJob>(jobUri, Hydra)
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

export async function loadDimensionMapping(mappingUri: string, Hydra: HydraClient) {
  const mappingResource = await load<Dictionary>(mappingUri, Hydra, {
    Prefer: 'return=canonical',
  })
  if (!mappingResource.representation) {
    throw new Error(`Mapping ${mappingUri} not loaded`)
  }

  return mappingResource.representation.root?.pointer
}

export async function mapDimensions(this: Pick<Context, 'variables'>) {
  const mappingCache = new TermMap<Term, MultiPointer | null>()
  const jobUri = this.variables.get('jobUri')
  const dimensionMetadataCollection = await loadMetadata(jobUri, this.variables.get('apiClient'))

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

  const valueCache = new TermMap<Term, TermMap<Term, Term | undefined>>()
  const getMappedValue = async (mappingTerm: string, object: Term) => {
    const dict = await loadDimensionMapping(mappingTerm, this.variables.get('apiClient'))
    if (!dict) {
      return undefined
    }

    let valueMap = valueCache.get(dict.term)
    if (!valueMap) {
      valueMap = new TermMap()
      valueCache.set(dict.term, valueMap)
    }

    let value = valueMap.get(object)
    if (!value) {
      value = dict.out(prov.hadDictionaryMember)
        .has(prov.pairKey, object)
        .out(prov.pairEntity)
        .term
      valueMap.set(object, value)
    }

    return value
  }

  return map(async (quad: Quad) => {
    const { subject, predicate, object, graph } = quad
    const mappingTerm = getDimensionMapping(predicate)
    if (mappingTerm?.value) {
      if (object.equals(undef)) {
        return $rdf.quad(subject, predicate, cube.Undefined, graph)
      }

      const mappedValue = await getMappedValue(mappingTerm.value, object)
      if (mappedValue?.termType === 'NamedNode') {
        return $rdf.quad(subject, predicate, mappedValue, graph)
      }
    }

    return quad
  })
}

export function substituteUndefined(quad: Quad): Quad {
  if (quad.object.value === DefaultCsvwLiteral) {
    return $rdf.quad(
      quad.subject,
      quad.predicate,
      undef,
      quad.graph,
    )
  }

  return quad
}
