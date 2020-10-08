import { Resource } from 'alcaeus'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'

export interface APIState {
  entrypoint: null | Resource,
}

const initialState = {
  entrypoint: null,
}

const getters: GetterTree<APIState, RootState> = {
}

const actions: ActionTree<APIState, RootState> = {
  async fetchEntrypoint (context) {
    const entrypoint = await api.fetchResource('/')
    context.commit('storeEntrypoint', entrypoint)
    return entrypoint
  }
}

const mutations: MutationTree<APIState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = entrypoint
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
