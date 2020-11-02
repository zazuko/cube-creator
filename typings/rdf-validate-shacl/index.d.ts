declare module 'rdf-validate-shacl' {
  import type { DatasetCore, Term } from 'rdf-js'
  import type { GraphPointer } from 'clownface'

  namespace SHACLValidator {
    interface ValidationResult {
      message: Term[]
      path: Term | null
      focusNode: Term | null
      severity: Term | null
      sourceConstraintComponent: Term | null
      sourceShape: Term | null
      cf: GraphPointer
    }

    interface ValidationReport {
      conforms: boolean
      results: ValidationResult[]
      dataset: DatasetCore
    }
  }

  class SHACLValidator {
    constructor(shapes: DatasetCore)

    validate(dataset: DatasetCore): SHACLValidator.ValidationReport
  }

  export = SHACLValidator
}
