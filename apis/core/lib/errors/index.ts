import { ForbiddenMapper, UnauthorizedMapper } from './auth'
import { ValidationErrorMapper } from './validation'

export const errorMappers = [
  new ForbiddenMapper(),
  new UnauthorizedMapper(),
  new ValidationErrorMapper(),
]
