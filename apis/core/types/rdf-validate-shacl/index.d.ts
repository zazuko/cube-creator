declare module 'rdf-validate-shacl' {
  import { DatasetCore } from 'rdf-js'

  interface ValidationResult {
    message: string
  }

  interface ValidationReport {
    conforms: boolean
    results: ValidationResult[]
  }

  class SHACLValidator {
    constructor(shapes: DatasetCore)

    validate(dataset: DatasetCore): ValidationReport
  }

  export = SHACLValidator
}
