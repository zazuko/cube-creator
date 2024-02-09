import type { NamedNode } from '@rdfjs/types'
import { Constructor } from '@tpluscode/rdfine'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Hydra from '@rdfine/hydra'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { CsvMapping } from '@cube-creator/model'
import * as CsvSource from '@cube-creator/model/CsvSource'
import * as Table from '@cube-creator/model/Table'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

RdfResource.factory.addMixin(...Object.values(Hydra))

interface AddSource {
  fileName: string
}

interface AddTable {
  name: string
  csvSource: CsvSource.CsvSource
  identifierTemplate: string | undefined
  color: string | undefined
  isObservationTable: boolean
}

interface ApiCsvMapping {
  initializeSourcesCollection(store: ResourceStore): void
  initializeTableCollection(store: ResourceStore): void
  addSource(store: ResourceStore, params: AddSource): CsvSource.CsvSource
  addTable(store: ResourceStore, params: AddTable): Promise<Table.Table>
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CsvMapping extends ApiCsvMapping {}
}

export default function Mixin<Base extends Constructor<Omit<CsvMapping, keyof ApiCsvMapping>>>(Resource: Base) {
  return class extends Resource implements ApiCsvMapping {
    initializeSourcesCollection(store: ResourceStore) {
      if (this.sourcesCollection) {
        throw new Error('Sources collection already exists')
      }

      this.sourcesCollection = new Hydra.CollectionMixin.Class(store.create(id.csvSourceCollection(this)), {
        types: [cc.CSVSourceCollection],
        title: 'CSV-Sources',
        [cc.csvMapping.value]: this,
        manages: [{
          // ?member rdf:type cc:CSVSource
          property: rdf.type,
          object: cc.CSVSource,
        }, {
          // ?member cc:csvMapping <mapping>
          object: this,
          property: cc.csvMapping,
        }],
      })
    }

    initializeTableCollection(store: ResourceStore) {
      if (this.tableCollection) {
        throw new Error('Tables collection already exists')
      }

      this.tableCollection = new Hydra.CollectionMixin.Class(store.create(id.tableCollection(this)), {
        types: [cc.TableCollection],
        title: 'Tables',
        [cc.csvMapping.value]: this,
        manages: [{
          // ?member rdf:type cc:Table
          property: rdf.type,
          object: cc.Table,
        }, {
          // ?member cc:csvMapping <mapping>
          object: this,
          property: cc.csvMapping,
        }],
      })
    }

    addSource(store: ResourceStore, { fileName }: AddSource): CsvSource.CsvSource {
      const source = CsvSource.create(store.create(id.csvSource(this, fileName)), {
        name: fileName,
        csvMapping: this,
      })

      this.pointer.addOut(cc.csvSource, source.id)
      return source
    }

    async addTable(store: ResourceStore, { name, csvSource, identifierTemplate, isObservationTable, color }: AddTable): Promise<Table.Table> {
      const table = await store.createMember(this.tableCollection.id as NamedNode, id.table(this, name))
      const types = isObservationTable ? [cc.ObservationTable] : []

      return Table.create(table, {
        types,
        name,
        csvMapping: this,
        csvSource,
        identifierTemplate,
        color,
      })
    }
  }
}

Mixin.appliesTo = cc.CsvMapping
