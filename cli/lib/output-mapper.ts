import type { BaseQuad, DatasetCore, Quad, Term } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { ImportJob, TransformJob } from '@cube-creator/model'
import { HydraClient } from 'alcaeus/alcaeus'
import type { Context } from 'barnard59-core'
import { Dictionary } from '@rdfine/prov'
import { prov, schema, qudt, rdf } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import type { MultiPointer } from 'clownface'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { HydraResponse } from 'alcaeus'
import { DefaultCsvwLiteral } from '@cube-creator/core/mapping'
import through2 from 'through2'
import type { Environment } from 'barnard59-env'
import map, { MapCallback } from 'barnard59-base/map.js'

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

export async function loadDimensionMapping(mappingUri: string, env: Environment) {
  const mappingResource = await load<Dictionary>(mappingUri, env.hydra, {
    Prefer: 'return=canonical, only-mapped',
  })
  if (!mappingResource.representation) {
    throw new Error(`Mapping ${mappingUri} not loaded`)
  }

  return mappingResource.representation.root?.pointer
}

export async function mapDimensions(this: Context) {
  const mappingCache = $rdf.termMap<Term, MultiPointer | null>()
  const jobUri = this.variables.get('jobUri')
  const dimensionMetadataCollection = await loadMetadata(jobUri, this.env.hydra)

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

  const valueCache = $rdf.termMap<Term, Map<string, Term | undefined>>()
  const getMappedValue = async (mappingTerm: string, object: Term) => {
    const dict = await loadDimensionMapping(mappingTerm, this.env)
    if (!dict) {
      return undefined
    }

    const { value } = object
    let valueMap = valueCache.get(dict.term)
    if (!valueMap) {
      valueMap = new Map()
      valueCache.set(dict.term, valueMap)
    }

    let mappedValue = valueMap.get(value)
    if (!mappedValue) {
      mappedValue = dict.out(prov.hadDictionaryMember)
        .has(prov.pairKey, value)
        .out(prov.pairEntity)
        .term
      valueMap.set(value, mappedValue)
    }

    return mappedValue
  }

  // We store original value quads in memory and inject them into the stream
  // after all the observation-specific steps
  const originalValueQuads = $rdf.dataset()
  this.variables.set('originalValueQuads', originalValueQuads)

  const cb: MapCallback<Quad, BaseQuad> = async (quad): Promise<BaseQuad> => {
    const { subject, predicate, object, graph } = quad
    const mappingTerm = getDimensionMapping(predicate)
    if (mappingTerm?.value) {
      if (object.equals(undef)) {
        return $rdf.quad(subject, predicate, cube.Undefined, graph)
      }

      const mappedValue = await getMappedValue(mappingTerm.value, object)
      if (mappedValue?.termType === 'NamedNode') {
        const predicateOriginal = $rdf.namedNode(predicate.value + '#_original')

        originalValueQuads.add($rdf.quad(predicateOriginal, rdf.type, cc.OriginalValuePredicate, graph))
        originalValueQuads.add($rdf.quad(predicateOriginal, schema.about, predicate, graph))
        originalValueQuads.add($rdf.quad(subject, predicateOriginal, object, graph))

        return $rdf.quad(subject, predicate, mappedValue, graph)
      }
    }

    return quad
  }

  return map.call(this, cb as any)
}

export function injectOriginalValueQuads(this: Pick<Context, 'variables'>) {
  const originalValueQuads = this.variables.get('originalValueQuads')

  return through2.obj(function (quad, _encoding, callback) {
    this.push(quad)
    callback()
  }, function (done) {
    for (const quad of originalValueQuads) {
      this.push(quad)
    }

    done()
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

export function substituteUndefinedReferences(this: Context) {
  const { csvwResource } = this.variables.get('transformed')

  const patterns = $rdf.termMap(csvwResource.tableSchema?.column
    .filter(column => column.propertyUrl)
    .map(column => {
      const pattern = column.pointer.out(qudt.pattern).value

      return [
        $rdf.namedNode(column.propertyUrl!),
        pattern ? new RegExp(pattern) : null,
      ]
    }))

  return through2.obj(function (quad: Quad, _, next) {
    const valuePattern = patterns.get(quad.predicate)
    if (valuePattern && !valuePattern.test(quad.object.value)) {
      this.push($rdf.quad(
        quad.subject,
        quad.predicate,
        cube.Undefined,
        quad.graph,
      ))
      return next()
    }

    this.push(quad)
    return next()
  })
}
