import { Project } from '@cube-creator/model'
import { Constructor } from '@tpluscode/rdfine'
import * as CsvMapping from '@cube-creator/model/CsvMapping'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import '../csv-mapping/CsvMapping'
import { cc } from '@cube-creator/core/namespace'

interface ApiProject {
  initializeCsvMapping(store: ResourceStore): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Project extends ApiProject {
  }
}

export default function Mixin<Base extends Constructor<Omit<Project, keyof ApiProject>>>(Resource: Base) {
  class Project extends Resource implements ApiProject {
    initializeCsvMapping(store: ResourceStore) {
      if (this.csvMapping) {
        throw new Error('CSV Mapping already exists')
      }

      const mapping = CsvMapping.create(store.create(id.csvMapping(this)))

      mapping.initializeSourcesCollection(store)
      mapping.initializeTableCollection(store)

      this.csvMapping = mapping
    }
  }

  return Project
}

Mixin.appliesTo = cc.CubeProject
