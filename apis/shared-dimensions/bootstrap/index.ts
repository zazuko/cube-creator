import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import env from '../lib/env.js'
import { log } from '../lib/log.js'
import { store } from '../lib/store.js'
import { terms, termSets, exportSet } from './termSetCollections.js'
import { entrypoint } from './entrypoint.js'
import shapes from './shapes.js'
import { hierarchies } from './hierarchies.js'

export interface BootstrappedResourceFactory {
  (term: string): GraphPointer<NamedNode>
}

const ns = $rdf.namespace(`${env.MANAGED_DIMENSIONS_BASE}dimension/`)
const pointerFactory = (term: string) => $rdf.clownface({ dataset: $rdf.dataset(), term: ns(term) })

const resources = [
  terms(pointerFactory),
  termSets(pointerFactory),
  hierarchies(pointerFactory),
  exportSet(pointerFactory),
  entrypoint(pointerFactory, ns),
  ...shapes,
]

export default async function (): Promise<void> {
  log('Bootstrapping API resources')

  const database = store()

  await Promise.all(resources.map(ptr => database.save(ptr)))
}
