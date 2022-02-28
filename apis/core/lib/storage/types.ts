import type { Readable } from 'stream'
import type { MediaObject } from '@rdfine/schema'

export interface MediaStorage {
  getStream(media: MediaObject): Promise<Readable>
  delete(media: MediaObject): Promise<any>
  getDownloadLink(media: MediaObject): string
}

export type GetMediaStorage = (m: MediaObject) => MediaStorage
