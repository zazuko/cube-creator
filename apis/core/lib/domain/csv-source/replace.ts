import { GraphPointer } from 'clownface'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import * as s3 from '../../storage/s3'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../csv/file-head'
import { parse } from '../csv'
import { CsvSource } from '@cube-creator/model'
import { nanoid } from 'nanoid'
import { createOrUpdateColumns } from './update'
import { DomainError } from '@cube-creator/api-errors'

interface ReplaceCSVCommand {
  file: Readable | Buffer
  resource: NamedNode
  store: ResourceStore
  fileStorage?: s3.FileStorage
}

export async function replaceFile({
  file,
  resource,
  store,
  fileStorage = s3,
}: ReplaceCSVCommand): Promise<GraphPointer> {
  const csvSource = await store.getResource<CsvSource>(resource)

  // Remove any previous error
  csvSource.error = undefined

  const key = csvSource.associatedMedia.identifierLiteral
  if (!key) {
    throw new DomainError(`S3 key is missing for ${resource}`)
  }

  const tempKey = `temp/${nanoid()}`

  // Upload file to temp location
  await fileStorage.saveFile(tempKey, file)

  try {
    // Check header
    const fileStream = await fileStorage.loadFile(tempKey) as Readable
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
    const tempFile = await fileStorage.loadFile(tempKey)
    if (!tempFile) {
      throw new Error('File not found')
    }
    await fileStorage.saveFile(key, tempFile)
  } finally {
    await fileStorage.deleteFile(tempKey)
  }

  // call update
  await createOrUpdateColumns(csvSource, fileStorage)

  return csvSource.pointer
}
