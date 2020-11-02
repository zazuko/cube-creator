import { Constructor } from '@tpluscode/rdfine'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Hydra from '@rdfine/hydra'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { CsvMapping } from '@cube-creator/model'
import * as CsvSource from '@cube-creator/model/CsvSource'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

RdfResource.factory.addMixin(...Object.values(Hydra))

interface AddSource {
  fileName: string
}

interface ApiCsvMapping {
  initializeSourcesCollection(store: ResourceStore): void
  initializeTableCollection(store: ResourceStore): void
  addSource(store: ResourceStore, params: AddSource): CsvSource.CsvSource
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
  }
}

Mixin.appliesTo = cc.CsvMapping
