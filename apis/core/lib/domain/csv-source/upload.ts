import { GraphPointer } from 'clownface'
import { rdf, hydra, schema, csvw } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { loadFile, saveFile } from '../../storage/s3'
import { error } from '../../log'
import env from '../../env'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { loadFileHeadString } from '../csv/file-head'
import { sniffParse } from '../csv'

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
    .addOut(rdf.type, [cc.CSVSource, hydra.Resource])
    .addOut(cc.csvMapping, csvMapping)
    .addOut(schema.associatedMedia, mediaObject => {
      mediaObject.addOut(rdf.type, schema.MediaObject)
        .addOut(schema.identifier, key)
        .addOut(schema.contentUrl, $rdf.namedNode(upload.Location))
    })

  try {
    const fileStream = await loadFile(key) as Readable
    const head = await loadFileHeadString(fileStream)
    const { dialect, header } = await sniffParse(head)

    csvSource
      .addOut(csvw.dialect, id.dialect(csvSource), csvDialect => {
        csvDialect.addOut(csvw.quoteChar, dialect.quote)
          .addOut(csvw.delimiter, dialect.delimiter)
          .addOut(csvw.header, true)
          .addOut(csvw.headerRowCount, header.length)
      })
  } catch (err) {
    error(err)
  }

  csvMapping.addOut(cc.csvSource, csvSource)

  await store.save()

  return csvSource
}
