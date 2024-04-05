import $rdf from '@zazuko/env'
import env from '@cube-creator/core/env'
import { nanoid } from 'nanoid'

export function newId() {
  return $rdf.namedNode(`${env.API_CORE_BASE}activity/${nanoid()}`)
}

export function now() {
  return new Date()
}
