import { Constructor, property } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { CsvColumn, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import $rdf from 'rdf-ext'
import slug from 'slug'
import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { Link } from '@cube-creator/model/lib/Link'

interface CreateLiteralColumnMapping {
  store: ResourceStore
  sourceColumn: CsvColumn
  targetProperty: Term
  datatype?: NamedNode
  language?: string
  defaultValue?: Term
}

interface CreateReferenceColumnMapping {
  store: ResourceStore
  targetProperty: Term
  referencedTable: Table
  identifierMappings: {
    sourceColumn: CsvColumn
    referencedColumn: CsvColumn
  }[]
}

interface CreateColumnMappingFromColumn {
  store: ResourceStore
  column: CsvColumn
}

interface ApiTable {
  addLiteralColumnMapping(params: CreateLiteralColumnMapping): ColumnMapping.ColumnMapping
  addReferenceColumnMapping(params: CreateReferenceColumnMapping): ColumnMapping.ColumnMapping
  addColumnMappingFromColumn(params: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping
  columnMappings: Array<Link<ColumnMapping.ColumnMapping>>
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Table extends ApiTable {
  }
}

export default function mixin<Base extends Constructor<Table>>(Resource: Base): Mixin {
  class Impl extends Resource implements ApiTable {
    @property.resource({ values: 'array', path: cc.columnMapping })
    columnMappings!: Array<Link<ColumnMapping.ColumnMapping>>

    addLiteralColumnMapping({ store, sourceColumn, targetProperty, datatype, language, defaultValue }: CreateLiteralColumnMapping): ColumnMapping.ColumnMapping {
      const columnMapping = ColumnMapping.createLiteral(store.create(id.columnMapping(this, sourceColumn.name)), {
        sourceColumn,
        targetProperty,
        datatype,
        language,
        defaultValue,
      })

      this.pointer.addOut(cc.columnMapping, columnMapping.id)

      return columnMapping
    }

    addReferenceColumnMapping({ store, targetProperty, referencedTable, identifierMappings }: CreateReferenceColumnMapping): ColumnMapping.ColumnMapping {
      const columnMapping = ColumnMapping.createReference(store.create(id.columnMapping(this, targetProperty.value)), {
        targetProperty,
        referencedTable,
      })

      columnMapping.identifierMapping = identifierMappings.map((properties) =>
        ColumnMapping.createIdentifierMapping(
          columnMapping.pointer.node(id.identifierMapping(columnMapping)),
          properties,
        ),
      )

      this.pointer.addOut(cc.columnMapping, columnMapping.id)

      return columnMapping
    }

    addColumnMappingFromColumn({ store, column }: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping {
      return this.addLiteralColumnMapping({
        store,
        sourceColumn: column,
        targetProperty: $rdf.literal(slug(column.name)),
      })
    }
  }

  return Impl
}

mixin.appliesTo = cc.Table
