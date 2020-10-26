import { HydraResponse } from 'alcaeus'

type ErrorDetails = Record<string, any>

export class APIError extends Error {
  details: ErrorDetails | null;
  response: HydraResponse;

  constructor (details: ErrorDetails, response: HydraResponse) {
    const message = details?.title || 'Unknown error'

    super(message)

    this.details = details
    this.response = response
  }

  static async fromResponse (response: HydraResponse<any, any>): Promise<APIError> {
    const httpResponse = response?.response
    let details
    try {
      details = await httpResponse?.xhr.json()
    } catch (e) {
      details = null
    }

    switch (httpResponse?.xhr.status) {
      case 404:
        return new APIErrorNotFound(details, response)
      case 400:
        return new APIErrorValidation(details, response)
      case 409:
        return new APIErrorConflict(details, response)
      case 401:
      case 403:
        return new APIErrorAuthorization(details, response)
      default:
        return new APIError(details, response)
    }
  }
}

export class APIErrorNotFound extends APIError {}
export class APIErrorValidation extends APIError {}
export class APIErrorConflict extends APIError {}
export class APIErrorAuthorization extends APIError {}
