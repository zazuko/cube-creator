import { NamedNode } from 'rdf-js'
import namespace from '@rdfjs/namespace'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import env from '../lib/env'
import { log } from '../lib/log'
import { store } from '../lib/store'
import { terms, termSets, exportSet } from './termSetCollections'
import { entrypoint } from './entrypoint'
import shapes from './shapes'

export interface BootstrappedResourceFactory {
  (term: string): GraphPointer<NamedNode>
}

const ns = namespace(`${env.MANAGED_DIMENSIONS_BASE}dimension/`)
const pointerFactory = (term: string) => clownface({ dataset: $rdf.dataset(), term: ns(term) })

const resources = [
  terms(pointerFactory),
  termSets(pointerFactory),
  exportSet(pointerFactory),
  entrypoint(pointerFactory, ns),
  ...shapes,
]

export default async function (): Promise<void> {
  log('Bootstrapping API resources')

  const database = store()

  await Promise.all(resources.map(ptr => database.save(ptr)))
}
