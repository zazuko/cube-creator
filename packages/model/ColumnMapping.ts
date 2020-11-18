import { Initializer, RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { CsvColumn } from './CsvColumn'
import { DatasetCore, NamedNode, Term } from 'rdf-js'
import { Link } from './lib/Link'
import RdfResourceImpl, { Constructor, namespace, property, ResourceIdentifier } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import type { GraphPointer } from 'clownface'

export interface ColumnMapping<D extends DatasetCore = DatasetCore> extends RdfResource<D> {
  sourceColumn: Link<CsvColumn>
  targetProperty: Term
  datatype: NamedNode
  language: string
  defaultValue: Term
}

export function ColumnMappingMixin<Base extends Constructor>(Resource: Base): Mixin {
  @namespace(cc as any)
  class Impl extends Resource implements Partial<ColumnMapping> {
    @property.resource()
    sourceColumn!: Link<CsvColumn>

    @property()
    targetProperty!: Term

    @property()
    datatype?: NamedNode

    @property()
    language?: string

    @property()
    defaultValue?: Term
  }

  return Impl
}

ColumnMappingMixin.appliesTo = cc.ColumnMapping

export const fromPointer = <T extends ResourceIdentifier, D extends DatasetCore>(pointer: GraphPointer<T, D>, initializer?: Initializer<ColumnMapping>): ColumnMapping<D> => {
  return RdfResourceImpl.factory.createEntity<ColumnMapping<D>>(pointer, [ColumnMappingMixin], {
    initializer: {
      ...initializer,
      types: [cc.ColumnMapping],
    },
  })
}

type RequiredProperties = 'sourceColumn' | 'targetProperty'

export const create = initializer<ColumnMapping, RequiredProperties>(ColumnMappingMixin, {
  types: [cc.ColumnMapping],
})
