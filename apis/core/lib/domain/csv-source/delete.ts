import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { getLinkedTablesForSource } from '../queries/table'
import { deleteTable } from '../table/delete'
import type { GetMediaStorage } from '../../storage'
import { getMediaStorage } from '../../storage'
import { CsvSource } from '@cube-creator/model'

interface DeleteSourceCommand {
  resource: NamedNode | Term
  store: ResourceStore
  getStorage?: GetMediaStorage
}

export async function deleteSource({
  resource,
  store,
  getStorage = getMediaStorage,
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
  if (csvSource.associatedMedia) {
    const storage = getStorage(csvSource.associatedMedia)
    await storage.delete(csvSource.associatedMedia)
  }
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
