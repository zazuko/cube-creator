import * as Csvw from '@rdfine/csvw'
import * as Table from '@cube-creator/model/Table'
import RdfResource from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NotFoundError } from '../../errors'
import { buildCsvw } from '../../csvw-builder'
import '../../domain'

RdfResource.factory.addMixin(
  ...Object.values(Csvw),
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
    throw new NotFoundError(tableResource)
  }

  const table = Table.fromPointer(tablePointer)

  return buildCsvw({ table, resources })
}
/*
  return new Csvw.TableMixin.Class(cf({ dataset: $rdf.dataset(), term: table.csvw.id }), {
    dialect: {
      ...source.dialect.toJSON(),
      types: [csvw.Dialect],
    },
    tableSchema: {
      aboutUrl: `${namespace}observation/${table.identifierTemplate}`,
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
*/
