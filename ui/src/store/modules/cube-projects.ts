import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'
import { Project, ProjectsCollection, CSVMapping, SourcesCollection, TableCollection } from '@/types'

export interface CubeProjectsState {
  collection: null | ProjectsCollection,
  project: null | Project,
  csvMapping: null | CSVMapping,
  sourcesCollection: null | SourcesCollection,
  tableCollection: null | TableCollection,
}

const initialState = {
  collection: null,
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  tableCollection: null,
}

const getters: GetterTree<CubeProjectsState, RootState> = {
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
}

const actions: ActionTree<CubeProjectsState, RootState> = {
  async fetchCollection (context) {
    const entrypoint = context.rootState.api.entrypoint
    const collectionURI = entrypoint?.get(ns.cc.projects)?.id

    if (!collectionURI) throw new Error('Missing projects collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)
    context.commit('storeCollection', collection)
  },

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

    const sourcesCollection = await api.fetchResource(collection.id.value)
    context.commit('storeSourcesCollection', sourcesCollection)

    return sourcesCollection
  },

  async uploadCSVs (context, files) {
    const operation = context.state.csvMapping?.sourcesCollection.actions.upload ?? null
    const uploads = files.map((file: File) => {
      const headers = { 'content-disposition': `file; filename=${file.name}` }
      return api.invokeSaveOperation(operation, file, headers)
    })

    return Promise.all(uploads)
  },

}

const mutations: MutationTree<CubeProjectsState> = {
  storeCollection (state, collection) {
    state.collection = collection
  },

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
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
