import { Term } from 'rdf-js'
import { Project, CsvMapping } from '@cube-creator/model'
import { Constructor } from '@tpluscode/rdfine'
import { create as createMapping } from '@cube-creator/model/CsvMapping'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import '../csv-mapping/CsvMapping'
import { cc } from '@cube-creator/core/namespace'
import * as Hydra from '@rdfine/hydra'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { childResource } from '@cube-creator/model/lib/resourceIdentifiers'
import { DomainError } from '@cube-creator/api-errors'

interface ApiProject {
  nextRevision: number
  initializeCsvMapping(store: ResourceStore): CsvMapping
  initializeJobCollection(store: ResourceStore): void
  incrementPublishedRevision(): void
  updateCubeIdentifier(id: string | undefined): { before: string; after: string }
  updateMaintainer(organization: Term | undefined): { before: Term; after: Term }
  rename(name: string | undefined): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Project extends ApiProject {
  }
}

export default function Mixin<Base extends Constructor<Omit<Project, keyof ApiProject>>>(Resource: Base) {
  class Project extends Resource implements ApiProject {
    get nextRevision() {
      return this.publishedRevision ? this.publishedRevision + 1 : 1
    }

    initializeCsvMapping(store: ResourceStore) {
      if (this.csvMapping) {
        throw new Error('CSV Mapping already exists')
      }

      const mapping = createMapping(store.create(id.csvMapping(this)), {
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

    updateCubeIdentifier(after: string | undefined) {
      if (!after) {
        throw new DomainError('Cube identifier cannot be empty')
      }

      const before = this.cubeIdentifier
      if (before === after) {
        return { before: after, after }
      }

      this.cubeIdentifier = after
      return { before, after }
    }

    updateMaintainer(org: Term | undefined) {
      if (!org || org.termType !== 'NamedNode') {
        throw new DomainError('Organization must be a named node')
      }

      const before = this.maintainer.id
      if (before.equals(org)) {
        return { before, after: org }
      }

      this.maintainer = org as any

      return {
        before,
        after: org,
      }
    }

    rename(label: string | undefined): void {
      if (!label) {
        throw new DomainError('Label cannot be empty')
      }

      this.label = label
    }
  }

  return Project
}

Mixin.appliesTo = cc.CubeProject
