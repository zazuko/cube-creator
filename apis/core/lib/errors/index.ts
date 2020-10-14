import { ForbiddenMapper, UnauthorizedMapper } from './auth'

export const errorMappers = [
  new ForbiddenMapper(),
  new UnauthorizedMapper(),
]
