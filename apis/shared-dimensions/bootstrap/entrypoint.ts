import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { md } from '@cube-creator/core/namespace'
import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { BootstrappedResourceFactory } from './index.js'

export const entrypoint = (ptr: BootstrappedResourceFactory, ns: NamespaceBuilder) =>
  ptr('').addOut(rdf.type, [hydra.Resource, md.Entrypoint])
    .addOut(md.sharedDimensions, ns('_term-sets?pageSize=1000'))
    .addOut(md.hierarchies, ns('_hierarchies'))
