import type { NamedNode, Term } from '@rdfjs/types'
import { CsvProject, Project, CsvMapping, ImportProject } from '@cube-creator/model'
import { Constructor } from '@tpluscode/rdfine'
import { create as createMapping } from '@cube-creator/model/CsvMapping'
import '../csv-mapping/CsvMapping'
import { cc } from '@cube-creator/core/namespace'
import * as Hydra from '@rdfine/hydra'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { childResource } from '@cube-creator/model/lib/resourceIdentifiers'
import { DomainError } from '@cube-creator/api-errors'
import * as id from '../identifiers'
import { ResourceStore } from '../../ResourceStore'

interface ApiProject {
  nextRevision: number
  initializeJobCollection(store: ResourceStore): void
  incrementPublishedRevision(): void
  updateMaintainer(organization: Term | undefined): { before: Term; after: Term }
  rename(name: string | undefined): void
}

interface ApiCsvProject {
  initializeCsvMapping(store: ResourceStore): CsvMapping
  updateCubeIdentifier(id: string | undefined): { before: string; after: string }
}

interface ApiImportProject {
  updateImportCube(id: Term | undefined): { before: NamedNode; after: NamedNode }
  updateImportEndpoint(url: Term | undefined): void
  updateImportGraph(url: Term | undefined): void
}

declare module '@cube-creator/model' {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  interface Project extends ApiProject {
  }

  interface CsvProject extends ApiCsvProject {
  }

  interface ImportProject extends ApiImportProject {
  }
}

export function ProjectMixin<Base extends Constructor<Omit<Project, keyof ApiProject>>>(Resource: Base) {
  class Project extends Resource implements ApiProject {
    get nextRevision() {
      return this.publishedRevision ? this.publishedRevision + 1 : 1
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

export function CsvProjectMixin<Base extends Constructor<Omit<CsvProject, keyof ApiCsvProject>>>(Resource: Base) {
  class Project extends Resource implements ApiCsvProject {
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
  }

  return Project
}

export function ImportProjectMixin<Base extends Constructor<Omit<ImportProject, keyof ApiImportProject>>>(Resource: Base) {
  class Project extends Resource implements ApiImportProject {
    updateImportCube(after: Term | undefined) {
      if (after?.termType !== 'NamedNode') {
        throw new DomainError('Cube identifier cannot be empty')
      }

      const before = this.sourceCube
      if (before.equals(after)) {
        return { before: after, after }
      }

      this.sourceCube = after
      return { before, after }
    }

    updateImportEndpoint(url: Term | undefined): void {
      if (url?.termType !== 'NamedNode') {
        throw new DomainError('Endpoint must be a named node')
      }

      this.sourceEndpoint = url
    }

    updateImportGraph(url: Term | undefined): void {
      if (url && url.termType !== 'NamedNode') {
        throw new DomainError('Graph must be a named node')
      }

      this.sourceGraph = url
    }
  }

  return Project
}

ProjectMixin.appliesTo = cc.CubeProject
CsvProjectMixin.appliesTo = cc.CubeProject
ImportProjectMixin.appliesTo = cc.CubeProject

export default [ProjectMixin, CsvProjectMixin, ImportProjectMixin]
