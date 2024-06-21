/* eslint-disable no-redeclare */
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { RdfineFactory, ResourceIdentifier } from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { Environment } from '@rdfjs/environment/Environment'
import NsBuildersFactory from '@tpluscode/rdf-ns-builders'

type MandatoryFields<T, TRequired extends Extract<keyof T, string>> = Pick<Required<Initializer<T>>, TRequired>

type InitializerFunction<T, TRequired extends Extract<keyof T, string> = never> =
    (env: Environment<RdfineFactory | NsBuildersFactory>, pointer: GraphPointer<ResourceIdentifier>, init: MandatoryFields<T, TRequired> & Initializer<T>) => T

type Defaults<T> = Initializer<T> | (() => Initializer<T>)

export function initializer<T>(mixin: Mixin, defaults?: Defaults<T>): (env: Environment<RdfineFactory>, pointer: GraphPointer<ResourceIdentifier>, init?: Initializer<T>) => T
export function initializer<T, TRequired extends Extract<keyof T, string>>(mixin: Mixin, defaults?: Defaults<T>): InitializerFunction<T, TRequired>
export function initializer<T, TRequired extends Extract<keyof T, string>>(mixin: Mixin, defaults?: Defaults<T>): InitializerFunction<T, TRequired> {
  return (env: Environment<RdfineFactory | NsBuildersFactory>, pointer, init): T => {
    if (pointer.term.termType !== 'NamedNode' && pointer.term.termType !== 'BlankNode') {
      throw new Error('A resource must have a NamedNode identifier')
    }

    const defaultInit = typeof defaults === 'function' ? defaults() : defaults
    const combinedInit = { ...(defaultInit || {}), ...(init || {}) }

    if (mixin.appliesTo) {
      pointer.addOut(env.ns.rdf.type, mixin.appliesTo)
    }

    const resource = env.rdfine().factory.createEntity<T>(pointer, [mixin], {
      initializer: combinedInit,
    })
    return resource
  }
}
