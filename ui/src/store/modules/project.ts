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
} from '@cube-creator/model'
import {
  serializeDimensionMetadataCollection,
  serializeJobCollection,
  serializeSourcesCollection,
  serializeTableCollection,
} from '../serializers'

export interface ProjectState {
  project: null | Project,
  csvMapping: null | CsvMapping,
  sourcesCollection: null | SourcesCollection,
  tableCollection: null | TableCollection,
  cubeMetadata: null | Dataset,
  dimensionMetadataCollection: null | DimensionMetadataCollection,
  jobCollection: null | JobCollection,
}

const initialState = {
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  tableCollection: null,
  cubeMetadata: null,
  dimensionMetadataCollection: null,
  jobCollection: null,
}

const getters: GetterTree<ProjectState, RootState> = {
  sources (state) {
    return state.sourcesCollection?.member || []
  },

  tables (state) {
    return state.tableCollection?.member || []
  },

  dimensions (state) {
    return state.dimensionMetadataCollection?.hasPart || []
  },

  jobs (state) {
    const jobs = state.jobCollection?.member || []

    return jobs.sort(({ created: created1 }, { created: created2 }) => created2.getTime() - created1.getTime())
  },

  findSource (_state, getters) {
    return (id: string) =>
      getters.sources.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  findTable (_state, getters) {
    return (id: string) =>
      getters.tables.find(({ clientPath }: { clientPath: string}) => clientPath === id)
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
}

const actions: ActionTree<ProjectState, RootState> = {
  async fetchProject (context, id) {
    context.commit('storeProject', null)

    const project = await api.fetchResource(id)

    context.commit('storeProject', project)

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

    context.commit('storeJobCollection', null)

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
  },

  storeTableCollection (state, collection) {
    state.tableCollection = collection ? serializeTableCollection(collection) : null
  },

  storeCubeMetadata (state, cubeMetadata) {
    state.cubeMetadata = Object.freeze(cubeMetadata)
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
