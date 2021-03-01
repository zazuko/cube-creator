import { md } from '@cube-creator/core/namespace'
import { rdf } from '@tpluscode/rdf-ns-builders'
import type { BootstrappedResourceFactory } from './index'

export const termSets = (ptr: BootstrappedResourceFactory) =>
  ptr('term-sets').addOut(rdf.type, md.ManagedDimensions)

export const terms = (ptr: BootstrappedResourceFactory) =>
  ptr('terms').addOut(rdf.type, md.ManagedDimensionTerms)
