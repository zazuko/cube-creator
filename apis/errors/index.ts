import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { ForbiddenMapper, UnauthorizedMapper } from './auth.js'
import { DomainErrorMapper } from './domain.js'

export { DomainError } from './domain.js'

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
