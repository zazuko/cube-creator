import { Term } from 'rdf-js'
import type * as Csvw from '@rdfine/csvw'
import {
  ColumnMapping,
  CsvColumn,
  CsvSource,
  LiteralColumnMapping,
  CsvProject,
  ReferenceColumnMapping,
  Table,
} from '@cube-creator/model'
import $rdf from '@cube-creator/env'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { Organization } from '@rdfine/schema'
import { cc } from '@cube-creator/core/namespace'
import { DefaultCsvwLiteral } from '@cube-creator/core/mapping'
import { qudt } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../ResourceStore.js'
import { warning } from '../log.js'
import { findOrganization } from '../domain/organization/query.js'

function unmappedColumn({ column }: { column: CsvColumn }): Initializer<Csvw.Column> {
  const initializer: Initializer<Csvw.Column> = {
    title: $rdf.literal(column.name),
  }

  initializer.suppressOutput = true

  return initializer
}

interface CsvwBuildingContext {
  cubeIdentifier: string
  organization: Organization
  source: CsvSource
  resources: ResourceStore
}

function mappedLiteralColumn({ cubeIdentifier, organization, columnMapping, column }: CsvwBuildingContext & { column: CsvColumn; columnMapping: LiteralColumnMapping }): Initializer<Csvw.Column> {
  const csvwColumn: Initializer<Csvw.Column> = {
    title: $rdf.literal(column.name),
    propertyUrl: organization.createIdentifier({ cubeIdentifier, termName: columnMapping.targetProperty }).value,
  }

  if (columnMapping.datatype) {
    csvwColumn.datatype = columnMapping.datatype
  }

  if (columnMapping.language) {
    csvwColumn.lang = columnMapping.language
  }

  if (columnMapping.defaultValue) {
    csvwColumn.default = columnMapping.defaultValue.value
  }

  return csvwColumn
}

async function mappedReferenceColumn({ cubeIdentifier, organization, columnMapping, source, resources }: CsvwBuildingContext & { columnMapping: ReferenceColumnMapping }): Promise<Initializer<Csvw.Column>> {
  const csvwColumn: Initializer<Csvw.Column> = {
    propertyUrl: organization.createIdentifier({ cubeIdentifier, termName: columnMapping.targetProperty }).value,
  }

  const referencedTable = await resources.getResource<Table>(columnMapping.referencedTable.id)
  if (!referencedTable.csvSource) {
    throw new Error(`Table ${columnMapping.referencedTable.id} not linked to a source`)
  }

  const referencedSource = await resources.getResource<CsvSource>(referencedTable.csvSource.id)

  const identifierMappings = columnMapping.identifierMapping
  const columnNameMap = await identifierMappings.reduce<Promise<Map<string, string>>>(async (mapP, mapping) => {
    const map = await mapP

    const sourceColumn = source.columns.find(({ id }) => id.equals(mapping.sourceColumn?.id))
    if (!sourceColumn) {
      warning(`Column ${mapping.sourceColumn?.id} not found`)
      return map
    }

    const referencedColumn = referencedSource.columns.find(({ id }) => id.equals(mapping.referencedColumn.id))
    if (!referencedColumn) {
      warning(`Column ${mapping.referencedColumn.id} not found`)
      return map
    }

    const from = sourceColumn.name
    const to = referencedColumn.name

    map.set(to, from)

    return Promise.resolve(map)
  }, Promise.resolve(new Map<string, string>()))

  if (typeof referencedTable.identifierTemplate === 'string') {
    const uriTemplate = referencedTable.parsedTemplate
    columnNameMap.forEach((to, from) => {
      if (!uriTemplate.renameColumnVariable(from, to)) {
        warning('Column name %s was not found in template for table <%s>', to, referencedTable.id)
      }
    })

    const valueBase = organization.createIdentifier({ cubeIdentifier }).value
    csvwColumn.valueUrl = uriTemplate.toAbsoluteUrl(valueBase)

    csvwColumn[qudt.pattern.value] = uriTemplate.toRegex(valueBase)
  }

  return csvwColumn
}

async function * buildColumns({ cubeIdentifier, table, source, resources, organization }: CsvwBuildingContext & { table: Table }) {
  const unmappedColumns = $rdf.termMap([...source.columns.map<[Term, CsvColumn]>(c => [c.id, c])])

  for (const columnMappingLink of table.columnMappings) {
    const columnMapping = await resources.getResource<ColumnMapping>(columnMappingLink.id, { allowMissing: true })
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

      const outColumn = mappedLiteralColumn({ cubeIdentifier, organization, columnMapping, column, source, resources })
      if (!outColumn.default && table.isObservationTable) {
        outColumn.default = DefaultCsvwLiteral
      }
      yield outColumn
    } else if (isReferenceColumnMapping(columnMapping)) {
      yield mappedReferenceColumn({ cubeIdentifier, organization, columnMapping, source, resources })
    }
  }

  for (const [, column] of unmappedColumns) {
    yield unmappedColumn({ column })
  }
}

function autoTemplate(source: CsvSource): string {
  return source.columns
    .sort((l, r) => l.order - r.order)
    .map((column) => `{${column.name}}`)
    .join('-')
}

export async function buildCsvw({ table, resources }: { table: Table; resources: ResourceStore }): Promise<Csvw.Table> {
  const source = await resources.getResource(table.csvSource)
  const { projectId, organizationId } = await findOrganization({ table })
  const organization = await resources.getResource<Organization>(organizationId)
  const { cubeIdentifier } = await resources.getResource<CsvProject>(projectId)

  const identifierTemplate = table.identifierTemplate || autoTemplate(source)
  let template: string
  const column: Initializer<Csvw.Column>[] = []

  if (table.isObservationTable) {
    template = `observation/${identifierTemplate}`
    column.push({
      virtual: true,
      propertyUrl: cc.cube.value,
      valueUrl: organization.createIdentifier({
        cubeIdentifier,
      }).value,
    })
  } else {
    template = identifierTemplate
  }

  for await (const csvwColumn of buildColumns({ cubeIdentifier, organization, table, source, resources })) {
    column.push(csvwColumn)
  }

  const csvw = $rdf.rdfine.csvw.Table($rdf.clownface({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
    dialect: {
      ...source.dialect.toJSON(),
    },
    tableSchema: {
      aboutUrl: organization.createIdentifier({ cubeIdentifier, termName: template }).value,
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
