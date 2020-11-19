import { Constructor } from '@tpluscode/rdfine'
import { CsvColumn, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import $rdf from 'rdf-ext'
import slug from 'slug'
import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

interface CreateColumnMapping {
  store: ResourceStore
  sourceColumn: CsvColumn
  targetProperty: Term
  datatype?: NamedNode
  language?: string
  defaultValue?: Term
}

interface CreateColumnMappingFromColumn {
  store: ResourceStore
  column: CsvColumn
}

interface ApiTable {
  addColumnMapping(params: CreateColumnMapping): ColumnMapping.ColumnMapping
  addColumnMappingFromColumn(params: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Table extends ApiTable {
  }
}

export default function Mixin<Base extends Constructor<Table>>(Resource: Base) {
  return class Impl extends Resource implements ApiTable {
    addColumnMapping({ store, sourceColumn, targetProperty, datatype, language, defaultValue }: CreateColumnMapping): ColumnMapping.ColumnMapping {
      const columnMapping = ColumnMapping.create(store.create(id.columnMapping(this, sourceColumn.name)), {
        sourceColumn,
        targetProperty,
        datatype,
        language,
        defaultValue,
      })

      this.pointer.addOut(cc.columnMapping, columnMapping.id)

      return columnMapping
    }

    addColumnMappingFromColumn({ store, column }: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping {
      return this.addColumnMapping({
        store,
        sourceColumn: column,
        targetProperty: $rdf.literal(slug(column.name)),
      })
    }
  }
}

Mixin.appliesTo = cc.Table
