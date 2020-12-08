import { Project, CsvMapping } from '@cube-creator/model'
import { Constructor } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { create as createMapping } from '@cube-creator/model/CsvMapping'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import '../csv-mapping/CsvMapping'
import { cc } from '@cube-creator/core/namespace'
import * as Hydra from '@rdfine/hydra'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { childResource } from '@cube-creator/model/lib/resourceIdentifiers'

interface ApiProject {
  identifier: string
  nextRevision: number
  initializeCsvMapping(store: ResourceStore, namespace: NamedNode): CsvMapping
  initializeJobCollection(store: ResourceStore): void
  incrementPublishedRevision(): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Project extends ApiProject {
  }
}

export default function Mixin<Base extends Constructor<Omit<Project, keyof ApiProject>>>(Resource: Base) {
  class Project extends Resource implements ApiProject {
    get identifier() {
      return this.id.value.substring(this.id.value.lastIndexOf('/') + 1)
    }

    get nextRevision() {
      return this.publishedRevision ? this.publishedRevision + 1 : 1
    }

    initializeCsvMapping(store: ResourceStore, namespace: NamedNode) {
      if (this.csvMapping) {
        throw new Error('CSV Mapping already exists')
      }

      const mapping = createMapping(store.create(id.csvMapping(this)), {
        namespace,
        project: this,
      })

      mapping.initializeSourcesCollection(store)
      mapping.initializeTableCollection(store)

      this.csvMapping = mapping
      return mapping
    }

    initializeJobCollection(store: ResourceStore) {
      if (this.jobCollection) {
        throw new Error('Job collection already exists')
      }

      this.jobCollection = new Hydra.CollectionMixin.Class(store.create(childResource('jobs')(this)), {
        types: [cc.JobCollection],
        title: 'Jobs',
        [cc.project.value]: this,
        manages: [{
          // ?member rdf:type cc:Job
          property: rdf.type,
          object: cc.Job,
        }, {
          // ?member cc:project <project>
          object: this,
          property: cc.project,
        }],
      })
    }

    incrementPublishedRevision() {
      this.publishedRevision = this.nextRevision
    }
  }

  return Project
}

Mixin.appliesTo = cc.CubeProject
