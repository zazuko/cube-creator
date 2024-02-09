import { HydraResponse } from 'alcaeus'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import type { DatasetCore } from '@rdfjs/types'

export interface ValidationReport {
  path: string
  message: string[]
  detail?: ValidationReport[]
}

export type ErrorDetails = {
  title?: string
  detail?: string
  link?: {
    href: string
  }
  report?: ValidationReport[]
  [key: string]: unknown
}

export class APIError extends Error {
  details: ErrorDetails | null
  response: HydraResponse<DatasetCore, RdfResourceCore>

  constructor (details: ErrorDetails, response: HydraResponse<DatasetCore, RdfResourceCore>) {
    const message = details?.title || 'Unknown error'

    super(message)

    this.details = details
    this.response = response
  }

  static async fromResponse (response: HydraResponse<DatasetCore, RdfResourceCore>): Promise<APIError> {
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
      case 413:
        return new APIPayloadTooLarge(details, response)
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
export class APIPayloadTooLarge extends APIError {}
export class APIErrorAuthorization extends APIError {}
