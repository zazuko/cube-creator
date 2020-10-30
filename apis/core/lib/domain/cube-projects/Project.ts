import { Project, CsvMapping } from '@cube-creator/model'
import { Constructor } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { create as createMapping } from '@cube-creator/model/CsvMapping'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import '../csv-mapping/CsvMapping'
import { cc } from '@cube-creator/core/namespace'

interface ApiProject {
  initializeCsvMapping(store: ResourceStore, namespace: NamedNode): CsvMapping
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Project extends ApiProject {
  }
}

export default function Mixin<Base extends Constructor<Omit<Project, keyof ApiProject>>>(Resource: Base) {
  class Project extends Resource implements ApiProject {
    initializeCsvMapping(store: ResourceStore, namespace: NamedNode) {
      if (this.csvMapping) {
        throw new Error('CSV Mapping already exists')
      }

      const mapping = createMapping(store.create(id.csvMapping(this)), {
        namespace,
      })

      mapping.initializeSourcesCollection(store)
      mapping.initializeTableCollection(store)

      this.csvMapping = mapping
      return mapping
    }
  }

  return Project
}

Mixin.appliesTo = cc.CubeProject
