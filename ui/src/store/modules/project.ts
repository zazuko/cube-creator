import Vue from 'vue'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import {
  Project,
  CsvMapping,
  JobCollection,
  SourcesCollection,
  TableCollection,
  Table,
  Dataset,
  DimensionMetadataCollection,
  CsvSource,
  Job,
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

export interface ProjectState {
  project: null | Project,
  csvMapping: null | CsvMapping,
  sourcesCollection: null | SourcesCollection,
  sources: Record<string, CsvSource>,
  tableCollection: null | TableCollection,
  tables: Record<string, Table>,
  cubeMetadata: null | Dataset,
  dimensionMetadataCollection: null | DimensionMetadataCollection,
  jobCollection: null | JobCollection,
}

const initialState = {
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  sources: {},
  tableCollection: null,
  tables: {},
  cubeMetadata: null,
  dimensionMetadataCollection: null,
  jobCollection: null,
}

const getters: GetterTree<ProjectState, RootState> = {
  sources (state) {
    return Object.values(state.sources)
  },

  tables (state) {
    return Object.values(state.tables)
  },

  dimensions (state) {
    return state.dimensionMetadataCollection?.hasPart || []
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

  transformJobs (state, getters): Job[] {
    return getters.jobs.filter((job: Job) => job.types.has(cc.TransformJob))
  },

  publishJobs (state, getters): Job[] {
    return getters.jobs.filter((job: Job) => job.types.has(cc.PublishJob))
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

  async uploadCSVs (context, files) {
    const operation = context.state.csvMapping?.sourcesCollection.actions?.upload ?? null
    const uploads = files.map((file: File) => {
      const headers = {
        'content-type': 'text/csv',
        'content-disposition': `file; filename=${file.name}`,
      }
      return api.invokeSaveOperation(operation, file, headers)
    })

    return Promise.all(uploads)
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

    const collection = await api.fetchResource<DimensionMetadataCollection>(cubeMetadata.dimensionMetadata.id.value)
    context.commit('storeDimensionMetadataCollection', collection)

    return collection
  },
}

const mutations: MutationTree<ProjectState> = {
  storeProject (state, project) {
    state.project = Object.freeze(project)
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
}

export default {
  namespaced: true,
  state: initialState,
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
