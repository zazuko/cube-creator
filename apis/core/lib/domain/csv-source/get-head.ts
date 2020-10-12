import { cc } from '@cube-creator/core/namespace'
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
  const s3Key = csvSource.out(cc.s3Key).term?.value

  if (!s3Key) {
    throw new Error('Key to file on S3 not defined')
  }

  return loadFileHeadString(s3Key)
}
