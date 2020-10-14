import { ErrorMapper } from 'http-problem-details-mapper'
import { ProblemDocument } from 'http-problem-details'
import httpError from 'http-errors'
import env from '../env'

class AuthErrorMapper extends ErrorMapper {
  private readonly status: number;
  constructor(e: any, status: number) {
    super(e)
    this.status = status
  }

  mapError(): ProblemDocument {
    return new ProblemDocument({
      status: this.status,
      title: 'Access denied',
      detail: 'Follow the link to request access to this page:',
      type: 'http://tempuri.org/Forbidden',
    }, {
      link: {
        title: 'Request access',
        href: `${env.AUTH_ACCESS_REQUEST}`,
      },
    })
  }
}

export class UnauthorizedMapper extends AuthErrorMapper {
  public constructor() {
    super(httpError.Unauthorized, 401)
  }
}

export class ForbiddenMapper extends AuthErrorMapper {
  public constructor() {
    super(httpError.Forbidden, 403)
  }
}
