/* eslint-disable no-redeclare */
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import RdfResourceImpl from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { Initializer } from '@tpluscode/rdfine/RdfResource'

type MandatoryFields<T, TRequired extends Extract<keyof T, string>> = Pick<Required<Initializer<T>>, TRequired>

type InitializerFunction<T, TRequired extends Extract<keyof T, string> = never> =
    (pointer: GraphPointer<NamedNode>, init: MandatoryFields<T, TRequired> & Initializer<T>) => T

export function initializer<T>(mixin: Mixin, defaults?: Initializer<T>): (pointer: GraphPointer<NamedNode>) => T
export function initializer<T, TRequired extends Extract<keyof T, string>>(mixin: Mixin, defaults?: Initializer<T>): InitializerFunction<T, TRequired>
export function initializer<T, TRequired extends Extract<keyof T, string>>(mixin: Mixin, defaults?: Initializer<T>): InitializerFunction<T, TRequired> {
  return (pointer, init): T => {
    const combinedInit = { ...(defaults || {}), ...(init || {}) }

    const resource = new (mixin(RdfResourceImpl))(pointer, combinedInit)
    if (mixin.appliesTo) {
      resource.types.add(mixin.appliesTo)
    }
    return RdfResourceImpl.factory.createEntity(resource.pointer)
  }
}
