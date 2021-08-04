import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import * as s3 from '../../storage/s3'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../csv/file-head'
import { parse } from '../csv'
import { CsvSource } from '@cube-creator/model'
import { createOrUpdateColumns } from './update'
import { DomainError } from '@cube-creator/api-errors'
import { schema } from '@tpluscode/rdf-ns-builders'

interface ReplaceCSVCommand {
  csvSourceId: NamedNode
  resource: GraphPointer
  store: ResourceStore
  fileStorage?: s3.FileStorage
}

export async function replaceFile({
  csvSourceId,
  resource,
  store,
  fileStorage = s3,
}: ReplaceCSVCommand): Promise<GraphPointer> {
  const csvSource = await store.getResource<CsvSource>(csvSourceId)

  // Remove any previous error
  csvSource.error = undefined

  const key = csvSource.associatedMedia.identifierLiteral
  if (!key) {
    throw new DomainError(`S3 key is missing for ${resource}`)
  }

  const tempKey = resource.out(schema.identifier).value!

  try {
    // Check header
    const fileStream = fileStorage.loadFile(tempKey)
    const head = await loadFileHeadString(fileStream)

    const parserOptions = {
      to: 1,
      bom: true,
      delimiter: csvSource.dialect.delimiter,
      quote: csvSource.dialect.quoteChar,
    }

    const { header } = await parse(head, parserOptions)

    const missingColumns = csvSource.columns.filter((column) => !header.includes(column.name)).map((column) => column.name)
    if (missingColumns.length > 0) {
      throw new DomainError(`The columns "${missingColumns.toString()}" are missing in this file`)
    }

    // copy new
    const tempFile = fileStorage.loadFile(tempKey)
    await fileStorage.saveFile(key, tempFile)
  } finally {
    await fileStorage.deleteFile(tempKey)
  }

  // call update
  await createOrUpdateColumns(csvSource, fileStorage)

  return csvSource.pointer
}
