import { Readable } from 'stream'
import type { MediaObject } from '@rdfine/schema'
import type { MediaStorage } from './types.js'

export const httpStorage: MediaStorage = {
  async getStream(media: MediaObject): Promise<Readable> {
    const url = getUrl(media)
    const response = await fetch(url)

    return response.body as unknown as Readable
  },

  // Deleting remote file is a noop
  async delete() {
    return null
  },

  getDownloadLink(media: MediaObject): string {
    return getUrl(media)
  },
}

function getUrl(media: MediaObject): string {
  const url = media.contentUrl?.value

  if (!url) throw new Error('Missing file URL')

  return url
}
