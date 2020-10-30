import * as Csvw from '@rdfine/csvw'
import { CsvSourceMixin, TableMixin } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NotFoundError } from '../../errors'

RdfResource.factory.addMixin(...Object.values(Csvw))

interface Command {
  tableResource: NamedNode
  resources?: ResourceStore
}

export async function createCsvw({
  tableResource,
  resources = resourceStore(),
}: Command) {
  const tablePointer = await resources.get(tableResource)
  if (!tablePointer) {
    throw new Error(`Resource <${tableResource}> not found`)
  }

  const table = new TableMixin.Class(tablePointer)
  const sourcePointer = await resources.get(table.csvSource.id)
  if (!sourcePointer) {
    throw new NotFoundError(table.csvSource.pointer)
  }

  const source = new CsvSourceMixin.Class(sourcePointer)

  return new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
    dialect: {
      ...source.dialect.toJSON(),
      types: [csvw.Dialect],
    },
    tableSchema: {
      types: [csvw.Schema],
      aboutUrl: 'https://environment.ld.admin.ch/foen/ubd/28/{pollutant_id}/observation/{station_id}-{year}-{aggregation_id}',
      column: [{
        types: [csvw.Column],
        title: 'unit_id',
        datatype: xsd.string,
        propertyUrl: 'https://environment.ld.admin.ch/foen/ubd/28/unit-id',
      }, {
        types: [csvw.Column],
        title: 'aggregation_id',
        valueUrl: 'https://environment.ld.admin.ch/foen/ubd/28/aggregation/{aggregation_id}',
        propertyUrl: 'https://environment.ld.admin.ch/foen/ubd/28/aggregation',
      }, {
        types: [csvw.Column],
        title: 'station_id',
        valueUrl: 'https://environment.ld.admin.ch/foen/ubd/28/station/{station_id}',
        propertyUrl: 'https://environment.ld.admin.ch/foen/ubd/28/station',
      }, {
        types: [csvw.Column],
        title: 'value',
        datatype: xsd.float,
        propertyUrl: 'https://environment.ld.admin.ch/foen/ubd/28/dimension/value',
      }, {
        types: [csvw.Column],
        title: 'year',
        datatype: xsd.gYear,
        propertyUrl: 'https://environment.ld.admin.ch/foen/ubd/28/dimension/year',
      }, {
        types: [csvw.Column],
        suppressOutput: true,
        title: 'pollutant_id',
      }, {
        types: [csvw.Column],
        suppressOutput: true,
        title: 'limitvalue',
      }, {
        types: [csvw.Column],
        suppressOutput: true,
        title: 'value_remark',
      }],
    },
  })
}
