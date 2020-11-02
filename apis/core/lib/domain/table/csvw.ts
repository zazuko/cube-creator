import * as Csvw from '@rdfine/csvw'
import { CsvMapping, CsvMappingMixin, CsvSourceMixin, TableMixin } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import cf from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NotFoundError } from '../../errors'

RdfResource.factory.addMixin(
  ...Object.values(Csvw),
  CsvMappingMixin,
)

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
  const csvMappingPointer = await resources.get(table.csvMapping)
  if (!csvMappingPointer) {
    throw new NotFoundError(table.csvMapping)
  }
  const { namespace: { value: namespace } } = RdfResource.factory.createEntity<CsvMapping>(csvMappingPointer)

  const source = new CsvSourceMixin.Class(sourcePointer)

  return new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    url: source.id.value,
    dialect: {
      ...source.dialect.toJSON(),
      types: [csvw.Dialect],
    },
    tableSchema: {
      aboutUrl: `${namespace}observation/{station_id}-{year}-{aggregation_id}`,
      column: [{
        title: 'unit_id',
        datatype: xsd.string,
        propertyUrl: `${namespace}unit-id`,
      }, {
        virtual: true,
        propertyUrl: cc.cube.value,
        valueUrl: namespace,
      }, {
        title: 'pollutant_id',
        valueUrl: `${namespace}pollutant/{pollutant_id}`,
        propertyUrl: `${namespace}pollutant`,
      }, {
        title: 'aggregation_id',
        valueUrl: `${namespace}aggregation/{aggregation_id}`,
        propertyUrl: `${namespace}aggregation`,
      }, {
        title: 'station_id',
        valueUrl: `${namespace}station/{station_id}`,
        propertyUrl: `${namespace}station`,
      }, {
        title: 'value',
        datatype: xsd.float,
        propertyUrl: `${namespace}dimension/value`,
      }, {
        title: 'year',
        datatype: xsd.gYear,
        propertyUrl: `${namespace}dimension/year`,
      }, {
        suppressOutput: true,
        title: 'pollutant_id',
      }, {
        suppressOutput: true,
        title: 'limitvalue',
      }, {
        suppressOutput: true,
        title: 'value_remark',
      }],
    },
  })
}
