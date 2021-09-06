import { MediaObject } from '@rdfine/schema'

import { cc } from '@cube-creator/core/namespace'

import { httpStorage } from './http'
import * as s3 from './s3'
import { MediaStorage } from './types'

export type { MediaStorage } from './types'

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
