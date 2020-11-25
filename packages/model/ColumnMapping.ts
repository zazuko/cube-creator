import { Initializer, RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { CsvColumn } from './CsvColumn'
import { Table } from './Table'
import { DatasetCore, NamedNode, Term } from 'rdf-js'
import { Link } from './lib/Link'
import RdfResourceImpl, { Constructor, namespace, property, ResourceIdentifier } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import type { GraphPointer } from 'clownface'

export interface ColumnMapping extends RdfResource {
  targetProperty: Term
}

export interface LiteralColumnMapping extends ColumnMapping {
  sourceColumn: Link<CsvColumn>
  datatype?: NamedNode
  language?: string
  defaultValue?: Term
}

export interface IdentifierMapping extends RdfResource {
  referencedColumn: Link<CsvColumn>
  sourceColumn: Link<CsvColumn>
}

export interface ReferenceColumnMapping extends ColumnMapping {
  referencedTable: Link<Table>
  identifierMapping: IdentifierMapping[]
}

export function ColumnMappingMixin<Base extends Constructor>(Resource: Base): Mixin {
  @namespace(cc)
  class Impl extends Resource implements Partial<ColumnMapping> {
    @property()
    targetProperty!: Term
  }

  return Impl
}

ColumnMappingMixin.appliesTo = cc.ColumnMapping

export function LiteralColumnMappingMixin<Base extends Constructor>(Resource: Base): Mixin {
  @namespace(cc)
  class Impl extends Resource implements Partial<LiteralColumnMapping> {
    @property()
    targetProperty!: Term

    @property.resource()
    sourceColumn!: Link<CsvColumn>

    @property()
    datatype?: NamedNode

    @property()
    language?: string

    @property()
    defaultValue?: Term
  }

  return Impl
}

LiteralColumnMappingMixin.appliesTo = cc.LiteralColumnMapping

export function IdentifierMappingMixin<Base extends Constructor>(Resource: Base): Mixin {
  @namespace(cc)
  class Impl extends Resource implements Partial<IdentifierMapping> {
    @property.resource()
    sourceColumn!: Link<CsvColumn>

    @property.resource()
    referencedColumn!: Link<CsvColumn>
  }

  return Impl
}

export function ReferenceColumnMappingMixin<Base extends Constructor>(Resource: Base): Mixin {
  @namespace(cc)
  class Impl extends Resource implements Partial<ReferenceColumnMapping> {
    @property()
    targetProperty!: Term

    @property.resource()
    referencedTable!: Link<Table>

    @property.resource({ path: cc.identifierMapping, values: 'array', as: [IdentifierMappingMixin] })
    identifierMapping!: IdentifierMapping[]
  }

  return Impl
}

ReferenceColumnMappingMixin.appliesTo = cc.ReferenceColumnMapping

export const literalFromPointer = <T extends ResourceIdentifier, D extends DatasetCore>(pointer: GraphPointer<T, D>, initializer?: Initializer<ColumnMapping>): LiteralColumnMapping => {
  return RdfResourceImpl.factory.createEntity<LiteralColumnMapping>(pointer, [LiteralColumnMappingMixin], {
    initializer: {
      ...initializer,
      types: [cc.ColumnMapping, cc.LiteralColumnMapping],
    },
  })
}

export const referenceFromPointer = <T extends ResourceIdentifier, D extends DatasetCore>(pointer: GraphPointer<T, D>, initializer?: Initializer<ColumnMapping>): ReferenceColumnMapping => {
  return RdfResourceImpl.factory.createEntity<ReferenceColumnMapping>(pointer, [ReferenceColumnMappingMixin], {
    initializer: {
      ...initializer,
      types: [cc.ColumnMapping, cc.ReferenceColumnMapping],
    },
  })
}

type LiteralRequiredProperties = 'targetProperty' | 'sourceColumn'
type ReferenceRequiredProperties = 'targetProperty' | 'referencedTable'

export const createLiteral = initializer<LiteralColumnMapping, LiteralRequiredProperties>(LiteralColumnMappingMixin, {
  types: [cc.ColumnMapping, cc.LiteralColumnMapping],
})

export const createReference = initializer<ReferenceColumnMapping, ReferenceRequiredProperties>(ReferenceColumnMappingMixin, {
  types: [cc.ColumnMapping, cc.ReferenceColumnMapping],
})

type IdentifierMappingRequiredProperties = 'sourceColumn' | 'referencedColumn'

export const createIdentifierMapping = initializer<IdentifierMapping, IdentifierMappingRequiredProperties>(IdentifierMappingMixin, {})
