import { ErrorMapper } from 'http-problem-details-mapper'
import { ProblemDocument } from 'http-problem-details'

export class DomainError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message)
  }
}

export class DomainErrorMapper extends ErrorMapper {
  public constructor() {
    super(DomainError)
  }

  mapError(error: Error): ProblemDocument {
    return new ProblemDocument({
      status: 400,
      detail: error.message,
    })
  }
}
