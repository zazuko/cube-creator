import { MediaObject } from '@rdfine/schema'
import { Readable } from 'stream'

export interface MediaStorage {
  getStream(media: MediaObject): Promise<Readable>
  delete(media: MediaObject): Promise<any>
  getDownloadLink(media: MediaObject): string
}
