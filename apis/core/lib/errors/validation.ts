import { ErrorMapper } from 'http-problem-details-mapper'
import { ProblemDocument } from 'http-problem-details'
import { ValidationReport } from 'rdf-validate-shacl'

export class ValidationError extends Error {
  readonly validationReport: ValidationReport

  constructor(validationReport: ValidationReport) {
    super()

    this.message = 'Request validation failed'
    this.validationReport = validationReport
  }
}

export class ValidationErrorMapper extends ErrorMapper {
  public constructor() {
    super(ValidationError)
  }

  mapError(error: ValidationError): ProblemDocument {
    const report = error.validationReport.results.map((r) => ({
      message: r.message.map((message) => message.value),
      path: r.path?.value,
    }))

    return new ProblemDocument({
      status: 400,
      title: error.message,
      detail: 'The request payload does not conform to the SHACL description of this endpoint.',
      type: 'http://tempuri.org/BadRequest',
    }, {
      report,
    })
  }
}
