import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { ForbiddenMapper, UnauthorizedMapper } from './auth'
import { DomainErrorMapper } from './domain'

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
