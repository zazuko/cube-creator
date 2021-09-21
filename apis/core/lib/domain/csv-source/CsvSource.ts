import { cc } from '@cube-creator/core/namespace'
import { CsvSource } from '@cube-creator/model'
import * as CsvColumn from '@cube-creator/model/CsvColumn'
import { fromPointer as mediaObjectFromPointer } from '@cube-creator/model/MediaObject'
import { Constructor, property } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import type * as Csvw from '@rdfine/csvw'
import * as id from '../identifiers'
import { DialectMixin } from '@rdfine/csvw'

interface CreateOrUpdateColumn {
  name: string
  order: number
}

interface ApiCsvSource {
  errors: string[]

  setUploadedFile(kind: NamedNode, key: string, contentUrl: NamedNode): void
  /**
   * Returns true if the dialect has actually changed
   */
  setDialect(dialect: Partial<Csvw.Dialect>): boolean
  appendOrUpdateColumn(params: CreateOrUpdateColumn): CsvColumn.CsvColumn
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CsvSource extends ApiCsvSource {
  }
}

export default function Mixin<Base extends Constructor<Omit<CsvSource, keyof ApiCsvSource>>>(Resource: Base) {
  class Impl extends Resource implements ApiCsvSource {
    @property.literal({ path: schema.error, values: 'array' })
    errors!: string[]

    setUploadedFile(sourceKind: NamedNode, key: string, contentUrl: NamedNode): void {
      if (this.associatedMedia) {
        this.associatedMedia.pointer.deleteOut()
      }

      this.associatedMedia = mediaObjectFromPointer(this.pointer.blankNode(), {
        identifierLiteral: key,
        sourceKind,
        contentUrl,
      }) as any
    }

    setDialect(dialect: Partial<Csvw.Dialect>): boolean {
      if (!this.dialect) {
        this.dialect = this.pointer.blankNode() as any
      }

      if (dialect.pointer && this.dialect.strictEquals(dialect.pointer)) {
        return false
      }

      const dialectJson = dialect.toJSON?.() as any || { ...dialect }

      this.dialect = new DialectMixin.Class(this.dialect.pointer, {
        ...dialectJson,
        header: (dialect.headerRowCount || 0) > 0,
      }) as any

      return true
    }

    appendOrUpdateColumn({ name, order }: CreateOrUpdateColumn): CsvColumn.CsvColumn {
      let column: CsvColumn.CsvColumn | undefined
      column = this.columns.find(column => column.name === name)

      if (column) {
        column.order = order
      } else {
        column = CsvColumn.create(this.pointer.node(id.column(this, name)), {
          name,
          order,
        })

        this.pointer.addOut(csvw.column, column.id)
      }

      return column
    }
  }

  return Impl
}

Mixin.appliesTo = cc.CSVSource
