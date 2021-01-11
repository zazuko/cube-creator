import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import * as s3 from '../../storage/s3'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import * as TableQueries from '../queries/table'
import { deleteTable } from '../table/delete'

interface DeleteSourceCommand {
  resource: NamedNode | Term
  store: ResourceStore
  fileStorage?: s3.FileStorage
  tableQueries?: Pick<typeof TableQueries, 'getLinkedTablesForSource'>
}

export async function deleteSource({
  resource,
  store,
  fileStorage = s3,
  tableQueries: { getLinkedTablesForSource } = TableQueries,
}: DeleteSourceCommand): Promise<void> {
  if (resource.termType !== 'NamedNode') return

  const csvSource = await store.get(resource, { allowMissing: true })
  if (!csvSource) return

  // delete tables
  const tables = getLinkedTablesForSource(csvSource.term)
  for await (const table of tables) {
    await deleteTable({
      store,
      resource: table,
    })
  }

  // Delete S3 resource
  const path = csvSource.out(schema.associatedMedia).out(schema.identifier).term
    ?.value
  if (path) {
    await fileStorage.deleteFile(path)
  }

  // Delete links from in csv-mapping
  const csvMapping = csvSource.out(cc.csvMapping).term
  if (csvMapping) {
    const csvMappingGraph = await store.get(csvMapping.value, { allowMissing: true })
    if (csvMappingGraph) {
      csvMappingGraph.dataset.delete($rdf.quad(csvMappingGraph.term, cc.csvSource, csvSource.term))
    }
  }

  // Delete Graph
  store.delete(resource)
}
