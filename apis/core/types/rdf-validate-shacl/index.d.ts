declare module 'rdf-validate-shacl' {
  import { DatasetCore, Term } from 'rdf-js'

  export interface ValidationResult {
    message: Term[]
    path: Term | null
    focusNode: Term | null
    severity: Term | null
    sourceConstraintComponent: Term | null
    sourceShape: Term | null
  }

  export interface ValidationReport {
    conforms: boolean
    results: ValidationResult[]
    dataset: DatasetCore
  }

  class SHACLValidator {
    constructor(shapes: DatasetCore)

    validate(dataset: DatasetCore): ValidationReport
  }

  export = SHACLValidator
}
