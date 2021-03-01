import { ForbiddenMapper, UnauthorizedMapper } from './auth'
import { DomainErrorMapper } from './domain'
import { Term } from 'rdf-js'
import type { GraphPointer } from 'clownface'

export { DomainError } from './domain'

export class NotFoundError extends Error {
  constructor(id: Term | GraphPointer | undefined) {
    super(`Resource <${id?.value}> not found`)
  }
}

export const errorMappers = [
  new ForbiddenMapper(),
  new UnauthorizedMapper(),
  new DomainErrorMapper(),
]
