import { md } from '@cube-creator/core/namespace'
import { rdf } from '@tpluscode/rdf-ns-builders'
import type { BootstrappedResourceFactory } from './index.js'

export const termSets = (ptr: BootstrappedResourceFactory) =>
  ptr('_term-sets').addOut(rdf.type, md.SharedDimensions)

export const terms = (ptr: BootstrappedResourceFactory) =>
  ptr('_terms').addOut(rdf.type, md.SharedDimensionTerms)

export const exportSet = (ptr: BootstrappedResourceFactory) =>
  ptr('_export').addOut(rdf.type, md.SharedDimensionExport)
