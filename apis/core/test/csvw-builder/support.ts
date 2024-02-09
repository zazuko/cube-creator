import type { NamedNode } from '@rdfjs/types'
import { Column, Table } from '@rdfine/csvw'

export function findColumn(table: Table, nameOrProp: string | NamedNode): Column | undefined {
  if (typeof nameOrProp === 'string') {
    return table.tableSchema?.column.find(column => column.title?.value === nameOrProp)
  }

  return table.tableSchema?.column.find(column => column.propertyUrl === nameOrProp.value)
}
