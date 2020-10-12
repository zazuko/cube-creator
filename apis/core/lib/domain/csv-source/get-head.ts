import { schema } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../../storage/s3'

interface GetCSVHeadCommand {
  resource: NamedNode
  store: ResourceStore
}

export async function getCSVHead({
  resource,
  store,
}: GetCSVHeadCommand): Promise<string> {
  const csvSource = await store.get(resource)
  const path = csvSource.out(schema.associatedMedia).out(schema.identifier).term
    ?.value

  if (!path) {
    throw new Error('Key to file on S3 not defined')
  }

  return loadFileHeadString(path)
}
