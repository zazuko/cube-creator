import { MediaObject } from '@rdfine/schema'
import { httpStorage } from './http'

import { cc } from '@cube-creator/core/namespace'

import * as s3 from './s3'
import { MediaStorage } from './types'

// TODO: This is not very extensible
export function getMediaStorage(media: MediaObject, localFileStorage: s3.FileStorage): MediaStorage {
  const sourceKind = media.sourceKind

  if (cc.MediaURL.equals(sourceKind)) {
    return httpStorage
  } else if (cc.MediaLocal.equals(sourceKind) || media.identifierLiteral) { // Handles legacy MediaObjects without sourceKind
    return getLocalStorage(localFileStorage)
  } else {
    throw new Error('Unknown file storage')
  }
}

function getLocalStorage(localFileStorage: s3.FileStorage): MediaStorage {
  const getKey = (media: MediaObject): string => {
    const key = media.identifierLiteral

    if (!key) throw new Error('Missing media identifier')

    return key
  }

  return {
    async getStream(media: MediaObject) {
      return localFileStorage.loadFile(getKey(media))
    },

    async delete(media: MediaObject) {
      return localFileStorage.deleteFile(getKey(media))
    },

    getDownloadLink(media: MediaObject) {
      return localFileStorage.getDownloadLink(getKey(media))
    },
  }
}
