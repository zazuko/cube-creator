import { Hydra } from 'alcaeus/node'
import { hydra, prov } from '@tpluscode/rdf-ns-builders'

Hydra.cacheStrategy.shouldLoad = (previous) => {
  return !previous.representation.root?.types.has(prov.Dictionary) ||
  !previous.representation.root?.types.has(hydra.ApiDocumentation)
}
