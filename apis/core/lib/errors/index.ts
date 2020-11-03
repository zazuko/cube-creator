import { ForbiddenMapper, UnauthorizedMapper } from './auth'
import { Term } from 'rdf-js'

export class NotFoundError extends Error {
  constructor(id: Term | undefined) {
    super(`Resource <${id?.value}> not found`)
  }
}

export const errorMappers = [
  new ForbiddenMapper(),
  new UnauthorizedMapper(),
]
