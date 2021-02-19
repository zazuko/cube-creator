import namespace from '@rdfjs/namespace'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import env from '../lib/env'
import { log } from '../lib/log'
import { terms, termSets } from './termSetCollections'
import { entrypoint } from './entrypoint'
import { store } from '../lib/store'
import { NamedNode } from 'rdf-js'

export interface BootstrappedResourceFactory {
  (term: string): GraphPointer<NamedNode>
}

const ns = namespace(env.MANAGED_DIMENSIONS_BASE)
const pointerFactory = (term: string) => clownface({ dataset: $rdf.dataset(), term: ns(term) })

const resources = [
  terms(pointerFactory),
  termSets(pointerFactory),
  entrypoint(pointerFactory, ns),
]

export default async function (): Promise<void> {
  log('Bootstrapping API resources')

  const database = store()

  await Promise.all(resources.map(ptr => database.save(ptr)))
}
