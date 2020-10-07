import { GraphPointer } from 'clownface'
import { rdf, hydra, dbo } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { Readable } from 'stream'
import * as id from '../identifiers'
import { saveFile } from '../../storage/s3'

interface UploadCSVCommand {
  file: Readable
  fileName: string
  resource: GraphPointer
  store: ResourceStore
}

export async function uploadFile({
  file,
  fileName,
  resource,
  store,
}: UploadCSVCommand): Promise<GraphPointer> {
  const csvMapping = resource.node(cc.CsvMapping)

  const upload = await saveFile(fileName, file)

  const csvSource = store
    .create(id.csvSource(csvMapping, fileName))
    .addOut(dbo.filename, fileName)
    .addOut(dbo.fileURL, upload.Location)
    .addOut(rdf.type, [cc.CSVSource, hydra.Resource])

  csvMapping.addOut(cc.csvSource, csvSource)

  await store.save()

  return csvSource
}
