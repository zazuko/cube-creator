import { Constructor } from '@tpluscode/rdfine'
import { CsvColumn, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import $rdf from 'rdf-ext'
import { Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

interface CreateColumnMapping {
  sourceColumn: CsvColumn
  targetProperty: Term
  store: ResourceStore
}

interface CreateColumnMappingFromColumn {
  column: CsvColumn
  store: ResourceStore
}

interface ApiTable extends RdfResourceCore {
  addColumnMapping(params: CreateColumnMapping): ColumnMapping.ColumnMapping
  addColumnMappingFromColumn(params: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Table extends ApiTable {
  }
}

function defaultProperty(columnName: string) {
  // TODO: How do we define the default target property for a column?
  return $rdf.literal(columnName)
}

export default function Mixin<Base extends Constructor<Table>>(Resource: Base) {
  return class Impl extends Resource implements ApiTable {
    addColumnMapping({ store, sourceColumn, targetProperty }: CreateColumnMapping): ColumnMapping.ColumnMapping {
      const columnMapping = ColumnMapping.create(store.create(id.columnMapping(this, sourceColumn.name)), {
        sourceColumn,
        targetProperty,
      })

      this.pointer.addOut(cc.columnMapping, columnMapping.id)

      return columnMapping
    }

    addColumnMappingFromColumn({ store, column }: CreateColumnMappingFromColumn): ColumnMapping.ColumnMapping {
      const targetProperty = defaultProperty(column.name)

      return this.addColumnMapping({
        store,
        sourceColumn: column,
        targetProperty,
      })
    }
  }
}

Mixin.appliesTo = cc.Table
