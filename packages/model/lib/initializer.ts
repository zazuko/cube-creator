/* eslint-disable no-redeclare */
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import RdfResourceImpl from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { Initializer } from '@tpluscode/rdfine/RdfResource'

type MandatoryFields<T, TRequired extends Extract<keyof T, string>> = Pick<Required<Initializer<T>>, TRequired>
type OptionalFields<T, TOptional extends Extract<keyof T, string>> = Pick<Initializer<T>, TOptional>

type InitializerFunction<T, TRequired extends Extract<keyof T, string> = never, TOptional extends Extract<keyof T, string> = never> =
    (pointer: GraphPointer<NamedNode>, init: MandatoryFields<T, TRequired> & OptionalFields<T, TOptional> & Omit<Initializer<T>, keyof TRequired | keyof TOptional>) => T

export function initializer<T>(mixin: Mixin): (pointer: GraphPointer<NamedNode>) => T
export function initializer<T, TRequired extends Extract<keyof T, string>>(mixin: Mixin): (pointer: GraphPointer<NamedNode>, init: MandatoryFields<T, TRequired>) => T
export function initializer<T, TRequired extends Extract<keyof T, string>, TOptional extends Extract<keyof T, string>>(mixin: Mixin): InitializerFunction<T, TRequired, TOptional>
export function initializer<T, TRequired extends Extract<keyof T, string>, TOptional extends Extract<keyof T, string>>(mixin: Mixin): InitializerFunction<T, TRequired, TOptional> {
  return (pointer, init): T => {
    const resource = new (mixin(RdfResourceImpl))(pointer, init || {})
    if (mixin.appliesTo) {
      resource.types.add(mixin.appliesTo)
    }
    return RdfResourceImpl.factory.createEntity(resource.pointer)
  }
}
