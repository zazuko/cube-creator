import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import { Project, ProjectsCollection } from '@/types'

export interface CubeProjectsState {
  collection: null | ProjectsCollection,
  project: null | Project,
}

const initialState = {
  collection: null,
  project: null,
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

  async create (context, formData) {
    const operation = context.state.collection?.actions?.create ?? null
    // TODO: Move this close to the resource definition
    const data = {
      '@context': {
        '@vocab': 'https://cube-creator.zazuko.com/vocab#',
      },
      '@type': 'CubeProject',
      // Must pass this ID for now because of a bug in rdfjs/express-handler
      '@id': '',
      [rdfs.label.value]: formData.label,
      projectSourceKind: formData.projectSourceKind,
    }

    return api.invokeSaveOperation(operation, data)
  },
}

const mutations: MutationTree<CubeProjectsState> = {
  storeCollection (state, collection) {
    state.collection = collection
  },

  storeProject (state, project) {
    state.project = project
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
