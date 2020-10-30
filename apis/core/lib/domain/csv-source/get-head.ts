import { schema } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { loadFile } from '../../storage/s3'
import { loadFileHeadString } from '../csv/file-head'
import { resourceStore } from '../resources'

interface GetCSVHeadCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function getCSVHead({
  resource,
  store = resourceStore(),
}: GetCSVHeadCommand): Promise<string> {
  const csvSource = await store.get(resource)
  const path = csvSource?.out(schema.associatedMedia).out(schema.identifier).term
    ?.value

  if (!path) {
    throw new Error('Key to file on S3 not defined')
  }

  const stream = await loadFile(path)

  if (!stream) {
    throw new Error(`Can not load file stream for ${path}`)
  }

  return loadFileHeadString(stream)
}
