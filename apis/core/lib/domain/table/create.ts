import { GraphPointer } from 'clownface'
import { schema, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'

interface CreateTableCommand {
  tableCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore
}

export async function createTable({
  tableCollection,
  resource,
  store = resourceStore(),
}: CreateTableCommand): Promise<GraphPointer> {
  const label = resource.out(schema.name)
  if (!label?.term) {
    throw new Error('schema:name missing from the payload')
  }

  const csvMapping = tableCollection.out(cc.csvMapping)
  if (!csvMapping?.term) {
    throw new Error('cc:csvMapping missing from the payload')
  }

  const table = await store
    .createMember(tableCollection.term, id.table(csvMapping.term, label.term.value))

  table.addOut(rdf.type, cc.Table)
  table.addOut(cc.csvSource, resource.out(cc.csvSource))
  table.addOut(cc.csvMapping, csvMapping.term)
  table.addOut(schema.name, label)
  table.addOut(cc.identifierTemplate, resource.out(cc.identifierTemplate))
  table.addOut(schema.color, resource.out(schema.color))

  await store.save()
  return table
}
