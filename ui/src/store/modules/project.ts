import Vue from 'vue'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import {
  CsvMapping,
  JobCollection,
  SourcesCollection,
  TableCollection,
  Table,
  Dataset,
  DimensionMetadataCollection,
  CsvSource,
  Job,
  CsvProject,
  ImportProject,
} from '@cube-creator/model'
import {
  serializeColumnMapping,
  serializeCubeMetadata,
  serializeDimensionMetadataCollection,
  serializeJobCollection,
  serializeSourcesCollection,
  serializeTable,
  serializeTableCollection,
} from '../serializers'
import { Term } from 'rdf-js'
import { RdfResource } from 'alcaeus'
import { cc } from '@cube-creator/core/namespace'
import type { Organization } from '@rdfine/schema'

export interface CreateIdentifier {
  (term: Term): string
}

export interface ProjectState {
  createIdentifier: null | CreateIdentifier
  project: null | CsvProject | ImportProject
  csvMapping: null | CsvMapping
  sourcesCollection: null | SourcesCollection
  sources: Record<string, CsvSource>
  tableCollection: null | TableCollection
  tables: Record<string, Table>
  cubeMetadata: null | Dataset
  dimensionMetadataCollection: null | DimensionMetadataCollection
  jobCollection: null | JobCollection
  selectedLanguage: string
}

const getInitialState = () => ({
  createIdentifier: null,
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  sources: {},
  tableCollection: null,
  tables: {},
  cubeMetadata: null,
  dimensionMetadataCollection: null,
  jobCollection: null,
  selectedLanguage: 'en',
})

const getters: GetterTree<ProjectState, RootState> = {
  hasCSVMapping (state) {
    return !!state.project?.csvMapping
  },

  materializeLabel (state, getters) {
    return getters.hasCSVMapping ? 'transformation' : 'import'
  },

  sources (state, getters) {
    return Object.values(state.sources)
      .map(source => {
        const tables: Table[] = getters.getSourceTables(source)
        const hasObservationTable = tables.some(table => table.isObservationTable)

        return { source, hasObservationTable }
      })
      .sort(({ hasObservationTable: o1 }, { hasObservationTable: o2 }) => (o1 === o2) ? 0 : (o1 ? -1 : 1))
      .map(({ source }) => source)
  },

  tables (state) {
    return Object.values(state.tables)
      .sort(({ isObservationTable: o1 }, { isObservationTable: o2 }) => (o1 === o2) ? 0 : (o1 ? -1 : 1))
  },

  dimensions (state) {
    const dimensions = state.dimensionMetadataCollection?.hasPart || []

    // Sort dimensions with the following priority:
    //   sh:order / measure dimension / key dimension / property (alphabetically)
    return dimensions.sort((dim1, dim2) => (
      ((dim1.order ?? Infinity) - (dim2.order ?? Infinity))) ||
      ((dim1.isMeasureDimension ? 1 : Infinity) - (dim2.isMeasureDimension ? 1 : Infinity)) ||
      ((dim1.isKeyDimension ? 1 : Infinity) - (dim2.isKeyDimension ? 1 : Infinity)) ||
      dim1.about.value.localeCompare(dim2.about.value)
    )
  },

  findSource (_state, getters) {
    return (id: string) =>
      getters.sources.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  getSource (state) {
    return (uri: Term): CsvSource => {
      const source = state.sources[uri.value]
      if (!source) throw new Error(`Source not found: ${uri.value}`)
      return source
    }
  },

  getSourceTables (state, getters) {
    return (source: CsvSource): Table[] =>
      getters.tables.filter((table: Table) => source.id.equals(table.csvSource?.id))
  },

  findTable (_state, getters) {
    return (id: string) =>
      getters.tables.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  getTable (state) {
    return (uri: Term): Table => {
      const table = state.tables[uri.value]
      if (!table) throw new Error(`Table not found: ${uri.value}`)
      return table
    }
  },

  columnMappings (state, getters) {
    return getters.tables.map((table: Table) => table.columnMappings).flat()
  },

  findColumnMapping (_state, getters) {
    return (id: string) =>
      getters.columnMappings.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  findDimension (_state, getters) {
    return (id: string) =>
      getters.dimensions.find(({ clientPath }: { clientPath: string }) => clientPath === id)
  },

  jobs (state): Job[] {
    const jobs = state.jobCollection?.member ?? []

    return jobs.sort(({ created: created1 }, { created: created2 }) => created2.getTime() - created1.getTime())
  },

  findJob (_state, getters) {
    return (id: string) =>
      getters.jobs.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  transformJobs (state, getters): Job[] {
    return getters.jobs.filter((job: Job) => job.types.has(cc.TransformJob) || job.types.has(cc.ImportJob))
  },

  publicationJobs (state, getters): Job[] {
    return getters.jobs.filter((job: Job) => job.types.has(cc.PublishJob) || job.types.has(cc.UnlistJob))
  },
}

const actions: ActionTree<ProjectState, RootState> = {
  async fetchProject (context, id) {
    context.commit('storeProject', null)

    const project = await api.fetchResource(id)

    context.commit('storeProject', project)

    context.commit('storeJobCollection', null)
    context.dispatch('fetchJobCollection')

    return project
  },

  reset (context) {
    context.commit('reset')
  },

  async fetchCSVMapping (context) {
    const project = context.state.project

    if (!project) {
      throw new Error('Project not loaded')
    }

    const mappingId = project.csvMapping?.id.value

    if (!mappingId) {
      throw new Error('Project does not have a csvMapping')
    }

    context.commit('storeCSVMapping', null)
    context.commit('storeSourcesCollection', null)
    context.commit('storeTableCollection', null)

    const mapping = await api.fetchResource<CsvMapping>(mappingId)
    context.commit('storeCSVMapping', mapping)

    api.fetchResource(mapping.sourcesCollection.id.value).then((sourcesCollection) =>
      context.commit('storeSourcesCollection', sourcesCollection))

    api.fetchResource(mapping.tableCollection.id.value).then((tableCollection) =>
      context.commit('storeTableCollection', tableCollection))

    return mapping
  },

  async fetchJobCollection (context) {
    if (!context.state.project) {
      throw new Error('Project not loaded')
    }

    const id = context.state.project.jobCollection?.id.value

    if (!id) {
      throw new Error('Project does not have a jobCollection')
    }

    const collection = await api.fetchResource<JobCollection>(id)
    context.commit('storeJobCollection', collection)

    return collection
  },

  async refreshSourcesCollection (context) {
    const collection = context.state.sourcesCollection

    if (!collection) {
      throw new Error('Sources collection not loaded')
    }

    context.commit('storeSourcesCollection', null)

    const freshCollection = await api.fetchResource<SourcesCollection>(collection.id.value)
    context.commit('storeSourcesCollection', freshCollection)

    return freshCollection
  },

  async refreshTableCollection (context) {
    const collection = context.state.tableCollection

    if (!collection) {
      throw new Error('Table collection not loaded')
    }

    context.commit('storeTableCollection', null)

    const freshCollection = await api.fetchResource<TableCollection>(collection.id.value)
    context.commit('storeTableCollection', freshCollection)

    return freshCollection
  },

  async fetchCubeMetadata (context) {
    const project = context.state.project

    if (!project) {
      throw new Error('Project not loaded')
    }

    if (!project.dataset) {
      throw new Error('Project does not have a cc:dataset')
    }

    context.commit('storeCubeMetadata', null)

    const cubeMetadata = await api.fetchResource<Dataset>(project.dataset.id.value)
    context.commit('storeCubeMetadata', cubeMetadata)

    return cubeMetadata
  },

  async fetchDimensionMetadataCollection (context) {
    const cubeMetadata = context.state.cubeMetadata

    if (!cubeMetadata) {
      throw new Error('CubeMetadata not loaded')
    }

    context.commit('storeDimensionMetadataCollection', null)

    return context.dispatch('refreshDimensionMetadataCollection')
  },

  async refreshDimensionMetadataCollection (context) {
    const cubeMetadata = context.state.cubeMetadata

    if (!cubeMetadata) {
      throw new Error('CubeMetadata not loaded')
    }

    const collection = await api.fetchResource<DimensionMetadataCollection>(cubeMetadata.dimensionMetadata.id.value)
    context.commit('storeDimensionMetadataCollection', collection)

    return collection
  },

  selectLanguage (context, language) {
    context.commit('storeSelectedLanguage', language)
  },
}

const mutations: MutationTree<ProjectState> = {
  storeProject (state, project: CsvProject | ImportProject) {
    state.project = Object.freeze(project)

    if (project && 'cubeIdentifier' in project) {
      const { cubeIdentifier } = project
      state.createIdentifier = (termName: Term) => {
        return (project.maintainer as Organization).createIdentifier({
          termName,
          cubeIdentifier,
        }).value
      }
    } else {
      state.createIdentifier = () => {
        throw new Error('Project does not have a cube identifier')
      }
    }
  },

  storeCSVMapping (state, mapping) {
    state.csvMapping = Object.freeze(mapping)
  },

  storeSourcesCollection (state, collection) {
    state.sourcesCollection = collection ? serializeSourcesCollection(collection) : null
    state.sources = indexResources(state.sourcesCollection?.member || [], ({ id }: CsvSource) => id.value)
  },

  storeTableCollection (state, collection) {
    state.tableCollection = collection ? serializeTableCollection(collection) : null
    state.tables = indexResources(state.tableCollection?.member || [], ({ id }: Table) => id.value)
  },

  storeTable (state, table) {
    Vue.set(state.tables, table.id.value, serializeTable(table))
  },

  storeNewColumnMapping (state, { table, columnMapping }) {
    const storedTable = state.tables[table.id.value]
    if (!storedTable) throw new Error(`Table not found: ${table.id.value}`)

    const serializedColumnMapping = serializeColumnMapping(columnMapping)
    storedTable.columnMappings.push(serializedColumnMapping)
  },

  storeUpdatedColumnMapping (state, { table, columnMapping }) {
    const storedTable = state.tables[table.id.value]
    if (!storedTable) throw new Error(`Table not found: ${table.id.value}`)

    const serializedColumnMapping = serializeColumnMapping(columnMapping)
    const index = storedTable.columnMappings.findIndex(({ id }) => id.equals(columnMapping.id))
    Vue.set(storedTable.columnMappings, index, serializedColumnMapping)
  },

  storeCubeMetadata (state, cubeMetadata) {
    state.cubeMetadata = cubeMetadata ? serializeCubeMetadata(cubeMetadata) : null
  },

  storeDimensionMetadataCollection (state, collection) {
    state.dimensionMetadataCollection = collection ? serializeDimensionMetadataCollection(collection) : null
  },

  storeJobCollection (state, collection) {
    state.jobCollection = collection ? serializeJobCollection(collection) : null
  },

  storeSelectedLanguage (state, language) {
    state.selectedLanguage = language
  },

  reset (state) {
    Object.assign(state, getInitialState())
  },
}

export default {
  namespaced: true,
  state: getInitialState(),
  getters,
  actions,
  mutations,
}

function indexResources<T extends RdfResource> (array: T[], indexFunction: (item: T) => string): Record<string, T> {
  return array.reduce((acc, item) => {
    return {
      ...acc,
      [indexFunction(item)]: item,
    }
  }, {})
}
