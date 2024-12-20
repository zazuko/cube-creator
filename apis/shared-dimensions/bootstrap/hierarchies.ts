import { md } from '@cube-creator/core/namespace'
import { rdf } from '@tpluscode/rdf-ns-builders'
import type { BootstrappedResourceFactory } from './index'

export const hierarchies = (ptr: BootstrappedResourceFactory) =>
  ptr('_hierarchies').addOut(rdf.type, md.Hierarchies)

export const externalHierarchy = (ptr: BootstrappedResourceFactory) =>
  ptr('_hierarchy/proxy').addOut(rdf.type, md.HierarchyProxy)
