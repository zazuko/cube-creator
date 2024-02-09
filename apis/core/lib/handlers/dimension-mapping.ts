import type { Term } from '@rdfjs/types'
import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import env from '@cube-creator/shared-dimensions-api/lib/env'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { Dictionary } from '@rdfine/prov'
import { cc, md } from '@cube-creator/core/namespace'
import { rdf } from '@tpluscode/rdf-ns-builders/strict'
import error from 'http-errors'
import { isNamedNode } from 'is-graph-pointer'
import { toRdf } from 'rdf-literal'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { dimensionChangedWarning } from '@cube-creator/model/DimensionMetadata'
import parsePreferHeader from 'parse-prefer-header'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension-mapping/update'
import { getUnmappedValues, importMappingsFromSharedDimension } from '../domain/queries/dimension-mappings'
import { findByDimensionMapping } from '../domain/queries/dimension-metadata'

function rewrite<T extends Term>(term: T, from: string, to: string): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(new RegExp(`^${from}dimension/`), `${to}dimension/`)) as any
  }

  return term
}

function toCanonical<T extends Term>(term: T): T {
  return rewrite(term, env.MANAGED_DIMENSIONS_API_BASE, env.MANAGED_DIMENSIONS_BASE)
}

function fromCanonical<T extends Term>(term: T): T {
  return rewrite(term, env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE)
}

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const store = req.resourceStore()
    const mappings = await req.resource()
    const dataset = $rdf.dataset([...mappings.dataset]).map(quad => {
      return $rdf.quad(
        toCanonical(quad.subject),
        quad.predicate,
        toCanonical(quad.object),
        quad.graph,
      )
    })

    const { dimensionMapping, hasChanges } = await update({
      resource: req.hydra.resource.term,
      mappings: clownface({ dataset }).node(mappings.term),
      store: req.resourceStore(),
    })

    if (hasChanges) {
      const metadataId = await findByDimensionMapping(dimensionMapping.term)
      const dimensionMetadata = await store.getResource<DimensionMetadataCollection>(metadataId)

      dimensionMetadata.addError?.(dimensionChangedWarning)
    }

    await store.save()

    return res.dataset(dimensionMapping.dataset)
  }))

export const prepareEntries: Enrichment = async (req, pointer) => {
  const preferences = parsePreferHeader(req.headers.prefer)

  if (preferences.return !== 'canonical') {
    for (const quad of [...pointer.dataset]) {
      const remapped = $rdf.quad(
        fromCanonical(quad.subject),
        quad.predicate,
        fromCanonical(quad.object),
        quad.graph,
      )

      if (!remapped.equals(quad)) {
        pointer.dataset.delete(quad).add(remapped)
      }
    }
  }

  if (!preferences.onlyMapped) {
    const dictionary = fromPointer(pointer)
    const unmappedValues = await getUnmappedValues(dictionary.id)

    dictionary.addMissingEntries(unmappedValues)
  }
}

export const importMappingsRequest = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res, next) => {
    const store = req.resourceStore()
    const dimensionMapping = await store.getResource<Dictionary>(req.hydra.resource.term)
    const args = await req.resource()
    const dimension = args.out(cc.sharedDimension)
    const predicate = args.out(rdf.predicate)
    const onlyCurrentTerms = args.out(md.onlyValidTerms)

    if (!isNamedNode(dimension) || !isNamedNode(predicate)) {
      return next(new error.BadRequest())
    }

    let validThrough: Date | undefined
    if (onlyCurrentTerms.term?.equals(toRdf(true))) {
      validThrough = new Date()
    }

    await importMappingsFromSharedDimension({
      dimensionMapping: dimensionMapping.id,
      dimension: toCanonical(dimension.term),
      predicate: predicate.term,
      validThrough,
    })

    const metadataId = await findByDimensionMapping(dimensionMapping.id)
    const dimensionMetadata = await store.getResource<DimensionMetadataCollection>(metadataId)
    dimensionMetadata.addError?.(dimensionChangedWarning)
    await store.save()

    res.end()
  }),
)
