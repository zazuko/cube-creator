import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState, Hierarchy } from '../types'

export interface HierarchyState {
  hierarchy: null | Hierarchy
}

const getInitialState = () => ({
  dimension: null,
})

const getters: GetterTree<HierarchyState, RootState> = {}

const actions: ActionTree<HierarchyState, RootState> = {
  async fetchHierarchy (context, id) {
    context.commit('storeHierarchy', await api.fetchResource(id))
  },

  reset (context) {
    context.commit('reset')
  },
}

const mutations: MutationTree<HierarchyState> = {
  storeHierarchy (state, hierarchy) {
    state.hierarchy = hierarchy || null
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
