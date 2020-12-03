import * as Csvw from '@rdfine/csvw'
import TermMap from '@rdfjs/term-map'
import { ColumnMapping, CsvColumn, CsvMapping, CsvSource, LiteralColumnMapping, ReferenceColumnMapping, Table } from '@cube-creator/model'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import RdfResource from '@tpluscode/rdfine'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { parse } from './uriTemplateParser'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../ResourceStore'
import { warning } from '../log'
import { Term } from 'rdf-js'

RdfResource.factory.addMixin(
  ...Object.values(Csvw),
)

function unmappedColumn({ column }: { column: CsvColumn }): Initializer<Csvw.Column> {
  const initializer: Initializer<Csvw.Column> = {
    title: $rdf.literal(column.name),
  }

  initializer.suppressOutput = true

  return initializer
}

interface CsvwBuildingContext {
  csvMapping: CsvMapping
  source: CsvSource
  resources: ResourceStore
}

function mappedLiteralColumn({ csvMapping, columnMapping, column }: CsvwBuildingContext & { column: CsvColumn; columnMapping: LiteralColumnMapping }): Initializer<Csvw.Column> {
  const csvwColumn: Initializer<Csvw.Column> = {
    title: $rdf.literal(column.name),
    propertyUrl: csvMapping.createIdentifier(columnMapping.targetProperty).value,
  }

  if (columnMapping.datatype) {
    csvwColumn.datatype = columnMapping.datatype
  }

  if (columnMapping.language) {
    csvwColumn.lang = columnMapping.language
  }

  return csvwColumn
}

async function mappedReferenceColumn({ csvMapping, columnMapping, resources }: CsvwBuildingContext & { columnMapping: ReferenceColumnMapping }): Promise<Initializer<Csvw.Column>> {
  const csvwColumn: Initializer<Csvw.Column> = {
    propertyUrl: csvMapping.createIdentifier(columnMapping.targetProperty).value,
  }

  const identifierMappings = columnMapping.identifierMapping
  const columnNameMap = await identifierMappings.reduce<Promise<Map<string, string>>>(async (mapP, mapping) => {
    const map = await mapP
    const sourceColumn = await resources.getResource<CsvColumn>(mapping.sourceColumn.id)
    const referencedColumn = await resources.getResource<CsvColumn>(mapping.referencedColumn.id)

    if (!sourceColumn) {
      warning(`Column ${mapping.sourceColumn.id} not found`)
      return map
    }

    if (!referencedColumn) {
      warning(`Column ${mapping.referencedColumn.id} not found`)
      return map
    }

    const from = sourceColumn.name
    const to = referencedColumn.name

    map.set(to, from)

    return Promise.resolve(map)
  }, Promise.resolve(new Map<string, string>()))

  const referencedTable = await resources.getResource<Table>(columnMapping.referencedTable.id)
  if (!referencedTable) {
    throw new Error(`Table ${columnMapping.referencedTable.id} not found`)
  }

  if (typeof referencedTable.identifierTemplate === 'string') {
    const uriTemplate = parse(referencedTable.identifierTemplate)
    columnNameMap.forEach((to, from) => {
      if (!uriTemplate.renameColumnVariable(from, to)) {
        warning('Column name %s was not found in template for table <%s>', to, referencedTable.id)
      }
    })

    csvwColumn.valueUrl = uriTemplate.toAbsoluteUrl(csvMapping.namespace.value)
  }

  return csvwColumn
}

async function * buildColumns({ table, source, resources, csvMapping }: CsvwBuildingContext & { table: Table }) {
  const unmappedColumns = new TermMap([...source.columns.map<[Term, CsvColumn]>(c => [c.id, c])])

  for (const columnMappingLink of table.columnMappings) {
    const columnMapping = await resources.getResource<ColumnMapping>(columnMappingLink.id)
    if (!columnMapping) {
      warning(`Column mapping ${columnMappingLink.id} not found`)
      continue
    }

    if (isLiteralColumnMapping(columnMapping)) {
      unmappedColumns.delete(columnMapping?.sourceColumn.id)

      const column = source.columns.find(column => columnMapping.sourceColumn.equals(column))
      if (!column) {
        warning(`Column ${columnMapping.sourceColumn.id} not found`)
        continue
      }

      yield mappedLiteralColumn({ csvMapping, columnMapping, column, source, resources })
    } else if (isReferenceColumnMapping(columnMapping)) {
      yield mappedReferenceColumn({ csvMapping, columnMapping, source, resources })
    }
  }

  for (const [, column] of unmappedColumns) {
    yield unmappedColumn({ column })
  }
}

export async function buildCsvw({ table, resources }: { table: Table; resources: ResourceStore }): Promise<Csvw.Table> {
  const source = await resources.getResource<CsvSource>(table.csvSource?.id)
  if (!source) {
    throw new Error(`Source not found for table ${table.id.value}`)
  }
  const csvMapping = await resources.getResource<CsvMapping>(table.csvMapping.id)
  if (!csvMapping) {
    throw new Error(`CSV Mapping resource not found for table ${table.id.value}`)
  }

  let template: string
  const column: Initializer<Csvw.Column>[] = []

  if (table.isObservationTable) {
    template = `observation/${table.identifierTemplate}`
    column.push({
      virtual: true,
      propertyUrl: cc.cube.value,
      valueUrl: csvMapping.namespace.value,
    })
  } else {
    template = table.identifierTemplate
  }

  for await (const csvwColumn of buildColumns({ csvMapping, table, source, resources })) {
    column.push(csvwColumn)
  }

  const csvw = new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
    dialect: {
      ...source.dialect.toJSON(),
    },
    tableSchema: {
      aboutUrl: csvMapping.createIdentifier(template).value,
      column,
    },
  })

  return csvw as any
}

function isLiteralColumnMapping(columnMapping: ColumnMapping): columnMapping is LiteralColumnMapping {
  return columnMapping.types.has(cc.LiteralColumnMapping)
}

function isReferenceColumnMapping(columnMapping: ColumnMapping): columnMapping is ReferenceColumnMapping {
  return columnMapping.types.has(cc.ReferenceColumnMapping)
}
