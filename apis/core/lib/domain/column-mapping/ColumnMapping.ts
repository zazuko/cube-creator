import type { NamedNode } from '@rdfjs/types'
import { Constructor } from '@tpluscode/rdfine'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { Initializer, RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { cc } from '@cube-creator/core/namespace'
import * as Schema from '@rdfine/schema'
import { createIdentifierMapping } from '@cube-creator/model/ColumnMapping'
import { LiteralColumnMapping, ReferenceColumnMapping } from '@cube-creator/model'

interface ApiColumnMapping {
  setErrors(): void
}

interface ApiReferenceColumnMapping extends ApiColumnMapping {
  resetIdentifierMappings(referencedTable: NamedNode[]): void
}

declare module '@cube-creator/model' {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  interface LiteralColumnMapping extends ApiColumnMapping {
  }

  interface ReferenceColumnMapping extends ApiReferenceColumnMapping {
  }
}

export function LiteralColumnMappingMixin<Base extends Constructor<Omit<LiteralColumnMapping, keyof ApiColumnMapping>>>(Resource: Base): Constructor<ApiColumnMapping & RdfResourceCore> & Base {
  return class extends Resource implements ApiColumnMapping {
    setErrors() {
      delete this.errors
      const errors: Array<Initializer<Schema.Thing>> = []

      if (this.language && this.datatype && !xsd.string.equals(this.datatype)) {
        errors.push({
          description: 'either set language or datatype, not both',
        })
      }

      this.errors = errors as any
    }
  }
}

LiteralColumnMappingMixin.appliesTo = cc.LiteralColumnMapping

export function ReferenceColumnMappingMixin<Base extends Constructor<Omit<ReferenceColumnMapping, keyof ApiReferenceColumnMapping>>>(Resource: Base): Constructor<ApiReferenceColumnMapping & RdfResourceCore> & Base {
  return class extends Resource implements ApiReferenceColumnMapping {
    resetIdentifierMappings(referencedColumns: NamedNode[]) {
      this.identifierMapping.forEach(mapping => {
        mapping.pointer.deleteOut()
      })

      this.identifierMapping = referencedColumns.map(referencedColumn => createIdentifierMapping(this.pointer.blankNode(), {
        referencedColumn,
      }))
    }

    setErrors() {
      delete this.errors
      const errors: Array<Initializer<Schema.Thing>> = []

      if (this.identifierMapping.some(im => !im.sourceColumn)) {
        errors.push({
          description: 'Identifier mapping is incomplete',
        })
      }

      this.errors = errors as any
    }
  }
}

ReferenceColumnMappingMixin.appliesTo = cc.ReferenceColumnMapping
