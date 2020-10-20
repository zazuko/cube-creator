import * as Csvw from '@rdfine/csvw'
import { TableMixin as CsvwTable } from '@rdfine/csvw'
import { CsvSourceMixin, TableMixin } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'

RdfResource.factory.addMixin(...Object.values(Csvw))

interface Command {
  tableResource: NamedNode
  resources?: ResourceStore
}

export async function createCsvw({
  tableResource,
  resources = resourceStore(),
}: Command): Promise<Csvw.Table> {
  const table = new TableMixin.Class(await resources!.get(tableResource))
  const source = new CsvSourceMixin.Class(await resources!.get(table.csvSource.id))

  const {
    dialect: {
      quoteChar, delimiter, encoding, doubleQuote,
    },
  } = source

  return new CsvwTable.Class(cf({ dataset: $rdf.dataset(), term: table.csvw }), {
    url: source.id.value,
    dialect: {
      types: [csvw.Dialect],
      quoteChar,
      delimiter,
      encoding,
      doubleQuote,
    },
  }) as any
}
