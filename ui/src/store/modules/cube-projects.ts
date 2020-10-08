import { Collection } from 'alcaeus'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'

export interface CubeProjectsState {
  collection: null | Collection,
}

const initialState = {
  collection: null,
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
  }
}

const mutations: MutationTree<CubeProjectsState> = {
  storeCollection (state, collection) {
    state.collection = collection
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
