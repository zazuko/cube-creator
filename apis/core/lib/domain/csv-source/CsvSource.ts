import { cc } from '@cube-creator/core/namespace'
import { CsvSource } from '@cube-creator/model'
import * as CsvColumn from '@cube-creator/model/CsvColumn'
import { Constructor } from '@tpluscode/rdfine'
import { MediaObjectMixin } from '@rdfine/schema'
import { NamedNode } from 'rdf-js'
import { csvw } from '@tpluscode/rdf-ns-builders'
import * as Csvw from '@rdfine/csvw'
import * as id from '../identifiers'
import { DialectMixin } from '@rdfine/csvw'

interface AppendColumn {
  name: string
}

interface ApiCsvSource {
  setUploadedFile(key: string, contentUrl: NamedNode): void
  setDialect(dialect: Partial<Csvw.Dialect>): void
  appendColumn(params: AppendColumn): CsvColumn.CsvColumn
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CsvSource extends ApiCsvSource {
  }
}

export default function Mixin<Base extends Constructor<Omit<CsvSource, keyof ApiCsvSource>>>(Resource: Base) {
  class Impl extends Resource implements ApiCsvSource {
    setUploadedFile(key: string, contentUrl: NamedNode): void {
      if (this.associatedMedia) {
        throw new Error('Source file already exists')
      }

      this.associatedMedia = new MediaObjectMixin.Class(this.pointer.blankNode(), {
        identifierLiteral: key,
        contentUrl,
      }) as any
    }

    setDialect(dialect: Partial<Csvw.Dialect>): void {
      this.pointer.out(csvw.dialect).deleteOut()
      if (!this.dialect) {
        this.dialect = this.pointer.blankNode() as any
      }

      this.dialect = new DialectMixin.Class(this.dialect.pointer, {
        ...dialect,
      }) as any
    }

    appendColumn({ name }: AppendColumn): CsvColumn.CsvColumn {
      const order = this.columns.length

      const column = CsvColumn.create(this.pointer.node(id.column(this, name)), {
        name,
        order,
      })

      this.pointer.addOut(csvw.column, column.id)
      return column
    }
  }

  return Impl
}

Mixin.appliesTo = cc.CSVSource
