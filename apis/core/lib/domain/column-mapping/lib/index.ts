import { ColumnMapping, CsvMapping, Table } from '@cube-creator/model'
import { Term } from 'rdf-js'
import { ResourceStore } from '../../../ResourceStore'

export async function findMapping(table: Table, targetProperty: Term, store: ResourceStore): Promise<ColumnMapping | null> {
  const csvMapping = await store.getResource<CsvMapping>(table.csvMapping.id)

  for (const columnMappingLink of table.columnMappings) {
    const columnMapping = await store.getResource<ColumnMapping>(columnMappingLink.id)
    if (!columnMapping) {
      continue
    }

    if (columnMapping.targetProperty.equals(targetProperty)) {
      return columnMapping
    }

    const effectiveProperty = csvMapping?.createIdentifier(targetProperty)
    if (columnMapping.targetProperty.equals(effectiveProperty)) {
      return columnMapping
    }
  }

  return null
}
