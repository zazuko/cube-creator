import { Constructor } from '@tpluscode/rdfine'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { CollectionMixin } from '@rdfine/hydra'
import { CsvMapping } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'

interface ApiCsvMapping {
  initializeSourcesCollection(store: ResourceStore): void
  initializeTableCollection(store: ResourceStore): void
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

      this.sourcesCollection = new CollectionMixin.Class(store.create(id.csvSourceCollection(this)), {
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

      this.tableCollection = new CollectionMixin.Class(store.create(id.tableCollection(this)), {
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
  }
}

Mixin.appliesTo = cc.CsvMapping
