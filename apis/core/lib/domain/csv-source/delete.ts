import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { deleteFile } from '../../storage/s3'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'

interface DeleteSourceCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function deleteSource({
  resource,
  store = resourceStore(),
}: DeleteSourceCommand): Promise<void> {
  await deleteSourceWithoutSave(resource, store)

  // Save changes
  await store.save()
}

export async function deleteSourceWithoutSave(csvSourceTerm: Term, store: ResourceStore): Promise<void> {
  if (csvSourceTerm.termType !== 'NamedNode') return

  const csvSource = await store.get(csvSourceTerm)
  if (!csvSource) return

  // TODO: Delete Tables or prevent it
  // Find related tables
  // Delete them
  // Delete S3 resource
  const path = csvSource.out(schema.associatedMedia).out(schema.identifier).term
    ?.value
  if (path) {
    await deleteFile(path)
  }

  // Delete links from in csv-mapping
  const csvMapping = csvSource.out(cc.csvMapping).term
  if (csvMapping) {
    const csvMappingGraph = await store.get(csvMapping.value)
    if (csvMappingGraph) {
      csvMappingGraph.dataset.delete($rdf.quad(csvMappingGraph.term, cc.csvSource, csvSource.term))
    }
  }

  // Delete Graph
  store.delete(csvSourceTerm)
}
