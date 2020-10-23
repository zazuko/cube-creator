import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { deleteFile } from '../../storage/s3'
import { schema } from '@tpluscode/rdf-ns-builders'

interface DeleteSourceCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function deleteSource({
  resource,
  store = resourceStore(),
}: DeleteSourceCommand): Promise<void> {
  const csvSource = await store.get(resource)

  // TODO: Delete Tables or prevent it
  // Find related tables
  // Delete them

  // Delete S3 resource
  const path = csvSource.out(schema.associatedMedia).out(schema.identifier).term
    ?.value
  if (path) {
    await deleteFile(path)
  }

  // Delete Graph
  store.delete(resource)

  // Save changes
  await store.save()
}
