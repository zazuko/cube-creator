import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'
import { Project, ProjectsCollection, CSVMapping, SourcesCollection } from '@/types'

export interface CubeProjectsState {
  collection: null | ProjectsCollection,
  project: null | Project,
  csvMapping: null | CSVMapping,
  sourcesCollection: null | SourcesCollection,
}

const initialState = {
  collection: null,
  project: null,
  csvMapping: null,
  sourcesCollection: null,
}

const getters: GetterTree<CubeProjectsState, RootState> = {
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

    const mapping = await api.fetchResource(id)

    context.commit('storeCSVMapping', mapping)

    return mapping
  },

  async fetchSourcesCollection (context, id) {
    context.commit('storeSourcesCollection', null)

    const collection = await api.fetchResource(id)

    context.commit('storeSourcesCollection', collection)

    return collection
  },

  async uploadCSVs (context, files) {
    const operation = context.state.csvMapping?.sourcesCollection.actions.upload ?? null
    const uploads = files.map((file: File) => {
      const headers = { 'content-disposition': `file; filename=${file.name}` }
      return api.invokeSaveOperation(operation, file, headers)
    })

    return Promise.all(uploads)
  },

  async deleteSource (context, source) {
    const operation = source.actions.delete
    await api.invokeDeleteOperation(operation)
    await context.dispatch('fetchSourcesCollection')
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
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
