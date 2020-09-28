import { HydraResponse } from 'alcaeus'

export class APIError extends Error {
  details: any;
  response: HydraResponse;

  constructor (details: any, response: HydraResponse) {
    const message = details?.title || 'Unknown error'

    super(message)

    this.details = details
    this.response = response
  }

  static async fromResponse (response: HydraResponse): Promise<APIError> {
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
      default:
        return new APIError(details, response)
    }
  }
}

export class APIErrorNotFound extends APIError {}
export class APIErrorValidation extends APIError {}
