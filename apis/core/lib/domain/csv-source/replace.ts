import type { NamedNode } from '@rdfjs/types'
import { GraphPointer } from 'clownface'
import type { MediaObject } from '@rdfine/schema'
import { CsvSource } from '@cube-creator/model'
import { fromPointer as mediaObjectFromPointer } from '@cube-creator/model/MediaObject'
import { DomainError } from '@cube-creator/api-errors'
import { ResourceNode } from '@tpluscode/rdfine/RdfResource'
import { parse } from '../csv'
import { loadFileHeadString } from '../csv/file-head'
import { ResourceStore } from '../../ResourceStore'
import type { GetMediaStorage, MediaStorage } from '../../storage'
import { getMediaStorage } from '../../storage'
import { createOrUpdateColumns } from './update'

interface ReplaceCSVCommand {
  csvSourceId: NamedNode
  resource: ResourceNode
  store: ResourceStore
  getStorage?: GetMediaStorage
}

export async function replaceFile({
  csvSourceId,
  resource,
  store,
  getStorage = getMediaStorage,
}: ReplaceCSVCommand): Promise<GraphPointer> {
  const csvSource = await store.getResource<CsvSource>(csvSourceId)

  // Remove any previous error
  csvSource.errors = []

  const newMedia = mediaObjectFromPointer(resource)
  const newStorage = getStorage(newMedia)

  try {
    await validateNewFile(csvSource, newMedia, newStorage)

    // Delete old file
    if (csvSource.associatedMedia) {
      const oldStorage = getStorage(csvSource.associatedMedia)
      await oldStorage.delete(csvSource.associatedMedia)
    }

    const sourceKind = newMedia.sourceKind
    const key = newMedia.identifierLiteral
    const location = newMedia.contentUrl
    csvSource.setUploadedFile(sourceKind, key, location)

    await createOrUpdateColumns(csvSource, getStorage)

    return csvSource.pointer
  } catch (e) {
    await newStorage.delete(newMedia)
    throw e
  }
}

async function validateNewFile(csvSource: CsvSource, media: MediaObject, storage: MediaStorage): Promise<void> {
  const fileStream = await storage.getStream(media)
  const head = await loadFileHeadString(fileStream)

  const parserOptions = {
    to: 1,
    bom: true,
    delimiter: csvSource.dialect.delimiter,
    quote: csvSource.dialect.quoteChar,
  }

  // Check header
  const { header, headerTrimmed } = await parse(head, parserOptions)

  if (headerTrimmed) {
    csvSource.setTrimError()
  }

  const missingColumns = csvSource.columns.filter((column) => !header.includes(column.name)).map((column) => column.name)
  if (missingColumns.length > 0) {
    throw new DomainError(`The columns "${missingColumns.toString()}" are missing in this file`)
  }
}
