import * as Csvw from '@rdfine/csvw'
import TermMap from '@rdfjs/term-map'
import { ColumnMapping, CsvColumn, CsvMapping, CsvSource, Table } from '@cube-creator/model'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import RdfResource from '@tpluscode/rdfine'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../ResourceStore'
import { warning } from '../log'
import { NamedNode, Term } from 'rdf-js'

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

function mappedColumn({ columnMapping, column, source, namespace }: { column: CsvColumn; columnMapping: ColumnMapping; source: CsvSource; namespace: NamedNode }): Initializer<Csvw.Column> {
  return {
    title: $rdf.literal(column.name),
    propertyUrl: `${namespace.value}${columnMapping.targetProperty.value}`,
  }
}

async function * buildColumns({ table, source, resources, namespace }: { table: Table; source: CsvSource; resources: ResourceStore; namespace: NamedNode }) {
  const unmappedColumns = new TermMap([...source.columns.map<[Term, CsvColumn]>(c => [c.id, c])])

  for (const columnMappingLink of table.columnMappings) {
    const columnMapping = await resources.getResource<ColumnMapping>(columnMappingLink.id)
    if (!columnMapping) {
      warning(`Column mapping ${columnMappingLink.id} not found`)
      continue
    }
    unmappedColumns.delete(columnMapping?.id)

    const column = source.columns.find(column => columnMapping.sourceColumn.equals(column))
    if (!column) {
      warning(`Column ${columnMapping.sourceColumn.id} not found`)
      continue
    }

    yield mappedColumn({ columnMapping, column, source, namespace })
  }

  for (const [, column] of unmappedColumns) {
    yield unmappedColumn({ column })
  }
}

export async function buildCsvw({ table, resources }: { table: Table; resources: ResourceStore }): Promise<Csvw.Table> {
  const source = await resources.getResource<CsvSource>(table.csvSource.id)
  if (!source) {
    throw new Error(`Source not found for table ${table.id.value}`)
  }
  const csvMapping = await resources.getResource<CsvMapping>(table.csvMapping.id)
  if (!csvMapping) {
    throw new Error(`CSV Mapping resource not found for table ${table.id.value}`)
  }

  const { namespace } = csvMapping

  const column: Initializer<Csvw.Column>[] = [{
    virtual: true,
    propertyUrl: cc.cube.value,
    valueUrl: namespace.value,
  }]
  for await (const csvwColumn of buildColumns({ table, source, resources, namespace })) {
    column.push(csvwColumn)
  }

  const csvw = new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
    dialect: {
      ...source.dialect.toJSON(),
    },
    tableSchema: {
      aboutUrl: `${namespace.value}observation/${table.identifierTemplate}`,
      column,
    },
  })

  return csvw as any
}
