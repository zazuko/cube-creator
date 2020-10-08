import { GraphPointer } from 'clownface'
import { rdf, hydra, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { Readable } from 'stream'
import * as id from '../identifiers'
import { saveFile } from '../../storage/s3'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import env from '../../env'

interface UploadCSVCommand {
  file: Readable
  fileName: string
  resource: NamedNode
  store: ResourceStore
}

export async function uploadFile({
  file,
  fileName,
  resource,
  store,
}: UploadCSVCommand): Promise<GraphPointer> {
  const csvMapping = await store.get(resource)
  const key = `${csvMapping.value.replace(env.API_CORE_BASE, '')}/${fileName}`
  const upload = await saveFile(key, file)

  const csvSource = store
    .create(id.csvSource(csvMapping, fileName))
    .addOut(schema.name, fileName)
    .addOut(schema.contentUrl, $rdf.namedNode(upload.Location))
    .addOut(rdf.type, [cc.CSVSource, hydra.Resource])
    .addOut(cc.csvMapping, csvMapping)

  csvMapping.addOut(cc.csvSource, csvSource)

  await store.save()

  return csvSource
}
