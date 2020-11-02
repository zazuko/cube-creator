import { ForbiddenMapper, UnauthorizedMapper } from './auth'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'

export class NotFoundError extends Error {
  constructor(id: NamedNode | GraphPointer) {
    super(`Resource <${id.value}> not found`)
  }
}

export const errorMappers = [
  new ForbiddenMapper(),
  new UnauthorizedMapper(),
]
