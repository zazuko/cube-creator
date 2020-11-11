import * as Csvw from '@rdfine/csvw'
import { CsvSource, Table } from '@cube-creator/model'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import { ResourceStore } from '../ResourceStore'

export async function buildCsvw({ table, resources }: { table: Table; resources: ResourceStore }): Promise<Csvw.Table> {
  const source = await resources.getResource<CsvSource>(table.csvSource.id)
  if (!source) {
    throw new Error(`Source not found for table ${table.id.value}`)
  }

  const csvw = new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
  })

  return csvw as any
}
