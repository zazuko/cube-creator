import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import * as s3 from '../../storage/s3'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { getLinkedTablesForSource } from '../queries/table'
import { deleteTable } from '../table/delete'
import { getMediaStorage } from '../../storage'
import { CsvSource } from '@cube-creator/model'

interface DeleteSourceCommand {
  resource: NamedNode | Term
  store: ResourceStore
  fileStorage?: s3.FileStorage
}

export async function deleteSource({
  resource,
  store,
  fileStorage = s3,
}: DeleteSourceCommand): Promise<void> {
  if (resource.termType !== 'NamedNode') return

  const csvSource = await store.getResource<CsvSource>(resource, { allowMissing: true })
  if (!csvSource) return

  // delete tables
  const tables = getLinkedTablesForSource(csvSource.id)
  for await (const table of tables) {
    await deleteTable({
      store,
      resource: table,
    })
  }

  // Delete S3 resource
  const storage = getMediaStorage(csvSource.associatedMedia, fileStorage)
  await storage.delete(csvSource.associatedMedia)

  // Delete links from in csv-mapping
  const csvMapping = csvSource.csvMapping.id
  if (csvMapping) {
    const csvMappingGraph = await store.get(csvMapping.value, { allowMissing: true })
    if (csvMappingGraph) {
      csvMappingGraph.dataset.delete($rdf.quad(csvMappingGraph.term, cc.csvSource, csvSource.id))
    }
  }

  // Delete Graph
  store.delete(resource)
}
