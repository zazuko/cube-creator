import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'
import { ProjectsCollection } from '@cube-creator/model'
import { serializeProjectsCollection } from '../serializers'

export interface ProjectsState {
  collection: null | ProjectsCollection,
}

const initialState = {
  collection: null,
}

const getters: GetterTree<ProjectsState, RootState> = {
}

const actions: ActionTree<ProjectsState, RootState> = {
  async fetchCollection (context) {
    const entrypoint = context.rootState.api.entrypoint
    const collectionURI = entrypoint?.get(ns.cc.projects)?.id

    if (!collectionURI) throw new Error('Missing projects collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)
    context.commit('storeCollection', collection)
  },
}

const mutations: MutationTree<ProjectsState> = {
  storeCollection (state, collection) {
    state.collection = collection ? serializeProjectsCollection(collection) : null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
