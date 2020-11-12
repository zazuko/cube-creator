import { Column, Table } from '@rdfine/csvw'

export function findColumn(table: Table, name: string): Column | undefined {
  return table.tableSchema?.column.find(column => column.title?.value === name)
}
