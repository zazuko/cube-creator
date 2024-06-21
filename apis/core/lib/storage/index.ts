import { MediaObject } from '@rdfine/schema'

import { cc } from '@cube-creator/core/namespace'

import { httpStorage } from './http.js'
import * as s3 from './s3.js'
import { MediaStorage } from './types.js'

export type { GetMediaStorage, MediaStorage } from './types.js'

export function getMediaStorage(media: MediaObject): MediaStorage {
  const sourceKind = media.sourceKind

  if (cc.MediaURL.equals(sourceKind)) {
    return httpStorage
  } else if (cc.MediaLocal.equals(sourceKind) || media.identifierLiteral) { // Handles legacy MediaObjects without sourceKind
    return s3.mediaStorage
  } else {
    throw new Error('Unknown file storage')
  }
}
