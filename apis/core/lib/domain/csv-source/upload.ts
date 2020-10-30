import { GraphPointer } from 'clownface'
import { rdf, hydra, schema, csvw, dtype } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { loadFile, saveFile } from '../../storage/s3'
import { error } from '../../log'
import env from '@cube-creator/core/env'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { loadFileHeadString } from '../csv/file-head'
import { sniffParse } from '../csv'
import { sourceWithFilenameExists } from '../queries/csv-source'
import { Conflict } from 'http-errors'
import { resourceStore } from '../resources'
import { sampleValues } from '../csv/sample-values'

interface UploadCSVCommand {
  file: Readable | Buffer
  fileName: string
  resource: NamedNode
  store?: ResourceStore
}

export async function uploadFile({
  file,
  fileName,
  resource,
  store = resourceStore(),
}: UploadCSVCommand): Promise<GraphPointer> {
  const csvMapping = await store.get(resource)

  if (await sourceWithFilenameExists(csvMapping.term, fileName)) {
    throw new Conflict(`A file with ${fileName} has already been added to the project`)
  }

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
    const head = await loadFileHeadString(fileStream, 500)
    const { dialect, header, rows } = await sniffParse(head)
    const sampleCol = sampleValues(header, rows)

    csvSource
      .addOut(csvw.dialect, id.dialect(csvSource), csvDialect => {
        csvDialect.addOut(csvw.quoteChar, dialect.quote)
          .addOut(csvw.delimiter, dialect.delimiter)
          .addOut(csvw.header, true)
          .addOut(csvw.headerRowCount, header.length)
      })

    for (let index = 0; index < header.length; index++) {
      const columnName = header[index]
      csvSource.addOut(csvw.column, id.column(csvSource, columnName), column => {
        column.addOut(rdf.type, [csvw.Column])
          .addOut(schema.name, columnName)
          .addOut(dtype.order, index)
        sampleCol[index].forEach(value => {
          column.addOut(cc.csvColumnSample, value)
        })
      })
    }
  } catch (err) {
    error(err)
    csvSource.addOut(schema.error, err.message)
  }

  csvMapping.addOut(cc.csvSource, csvSource)

  await store.save()

  return csvSource
}
