import { GraphPointer } from 'clownface'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import * as s3 from '../../storage/s3'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../csv/file-head'
import { parse } from '../csv'
import { CsvSource } from '@cube-creator/model'
import { nanoid } from 'nanoid'
import { updateColumns } from './update'
import { DomainError } from '../../errors'

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

  const key = csvSource.associatedMedia.identifierLiteral
  if (!key) {
    throw new DomainError('S3 key is missing for')
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
      ...csvSource.dialect,
    }

    const { header } = await parse(head, parserOptions)

    csvSource.columns.forEach(column => {
      if (!header.includes(column.name)) {
        throw new DomainError(`The column ${column.name} is missing!`)
      }
    })

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
  await updateColumns(csvSource, fileStorage)

  return csvSource.pointer
}
