import { Constructor } from '@tpluscode/rdfine'
import { CsvColumn, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import $rdf from 'rdf-ext'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

interface CreateColumnMapping {
  column: CsvColumn
  store: ResourceStore
}

interface ApiTable extends RdfResourceCore {
  addColumnMapping(params: CreateColumnMapping): void
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
    addColumnMapping({ store, column }: CreateColumnMapping) {
      const columnName = column.name

      const columnMapping = ColumnMapping.create(store.create(id.columnMapping(this, columnName)), {
        sourceColumn: column,
        targetProperty: defaultProperty(columnName),
      })

      this.pointer.addOut(cc.columnMapping, columnMapping.id)
    }
  }
}

Mixin.appliesTo = cc.Table
