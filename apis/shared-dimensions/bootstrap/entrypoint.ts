import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { md } from '@cube-creator/core/namespace'
import { NamespaceBuilder } from '@rdfjs/namespace'
import type { BootstrappedResourceFactory } from './index'

export const entrypoint = (ptr: BootstrappedResourceFactory, ns: NamespaceBuilder) =>
  ptr('').addOut(rdf.type, [hydra.Resource, md.Entrypoint])
    .addOut(md.sharedDimensions, ns('_term-sets?pageSize=20'))
    .addOut(md.hierarchies, ns('_hierarchies'))
