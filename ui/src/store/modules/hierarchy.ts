import { ActionTree, GetterTree, MutationTree } from 'vuex'
import { api } from '@/api'
import { Hierarchy, RootState } from '../types'

export interface HierarchyState {
  hierarchy: null | Hierarchy
}

const getInitialState = () => ({
  dimension: null,
})

const getters: GetterTree<HierarchyState, RootState> = {}

const actions: ActionTree<HierarchyState, RootState> = {
  async fetchHierarchy (context, id) {
    if (!context.rootState.hierarchies.collection) {
      await context.dispatch('sharedDimensions/fetchEntrypoint', {}, { root: true })
      await context.dispatch('hierarchies/fetchCollection', {}, { root: true })
    }

    context.commit('storeHierarchy', await api.fetchResource(id.replaceAll('!!', '/')))
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
