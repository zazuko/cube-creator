import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { Project, CSVMapping, SourcesCollection, TableCollection, Table, CubeMetadata } from '@/types'

export interface ProjectState {
  project: null | Project,
  csvMapping: null | CSVMapping,
  sourcesCollection: null | SourcesCollection,
  tableCollection: null | TableCollection,
  cubeMetadata: null | CubeMetadata,
}

const initialState = {
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  tableCollection: null,
  cubeMetadata: null,
}

const getters: GetterTree<ProjectState, RootState> = {
  sources (state) {
    return state.sourcesCollection?.member || []
  },

  tables (state) {
    return state.tableCollection?.member || []
  },

  findSource (_state, getters) {
    return (id: string) =>
      getters.sources.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  columnMappings (state, getters) {
    return getters.tables.map((table: Table) => table.columnMappings).flat()
  },

  findColumnMapping (_state, getters) {
    return (id: string) =>
      getters.columnMappings.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },
}

const actions: ActionTree<ProjectState, RootState> = {
  async fetchProject (context, id) {
    context.commit('storeProject', null)

    const project = await api.fetchResource(id)

    context.commit('storeProject', project)

    return project
  },

  async fetchCSVMapping (context, id) {
    context.commit('storeCSVMapping', null)
    context.commit('storeSourcesCollection', null)
    context.commit('storeTableCollection', null)

    const mapping = await api.fetchResource<CSVMapping>(id)
    context.commit('storeCSVMapping', mapping)

    const sourcesCollection = await api.fetchResource(mapping.sourcesCollection.id.value)
    context.commit('storeSourcesCollection', sourcesCollection)

    const tableCollection = await api.fetchResource(mapping.tableCollection.id.value)
    context.commit('storeTableCollection', tableCollection)

    return mapping
  },

  async refreshSourcesCollection (context) {
    const collection = context.state.sourcesCollection

    if (!collection) {
      throw new Error('Sources collection not loaded')
    }

    const freshCollection = await api.fetchResource<SourcesCollection>(collection.id.value)
    context.commit('storeSourcesCollection', freshCollection)

    return freshCollection
  },

  async refreshTableCollection (context) {
    const collection = context.state.tableCollection

    if (!collection) {
      throw new Error('Table collection not loaded')
    }

    const freshCollection = await api.fetchResource<TableCollection>(collection.id.value)
    context.commit('storeTableCollection', freshCollection)

    return freshCollection
  },

  async uploadCSVs (context, files) {
    const operation = context.state.csvMapping?.sourcesCollection.actions.upload ?? null
    const uploads = files.map((file: File) => {
      const headers = { 'content-disposition': `file; filename=${file.name}` }
      return api.invokeSaveOperation(operation, file, headers)
    })

    return Promise.all(uploads)
  },

  async fetchCubeMetadata (context) {
    const project = context.state.project

    if (!project) {
      throw new Error('Project not loaded')
    }

    if (!project.cubeMetadataId) {
      throw new Error('Project does not have a cc:dataset')
    }

    const cubeMetadata = await api.fetchResource<CubeMetadata>(project.cubeMetadataId)
    context.commit('storeCubeMetadata', cubeMetadata)

    return cubeMetadata
  },
}

const mutations: MutationTree<ProjectState> = {
  storeProject (state, project) {
    state.project = project
  },

  storeCSVMapping (state, mapping) {
    state.csvMapping = mapping
  },

  storeSourcesCollection (state, collection) {
    state.sourcesCollection = collection
  },

  storeTableCollection (state, collection) {
    state.tableCollection = collection
  },

  storeCubeMetadata (state, cubeMetadata) {
    state.cubeMetadata = cubeMetadata
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
