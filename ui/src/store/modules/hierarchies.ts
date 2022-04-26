import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { md } from '@cube-creator/core/namespace'
import { Collection } from 'alcaeus'

export interface HierarchiesState {
  collection: null | Collection,
}

const initialState = {
  collection: null,
}

const getters: GetterTree<HierarchiesState, RootState> = {}

const actions: ActionTree<HierarchiesState, RootState> = {
  async fetchCollection (context) {
    const entrypoint = context.rootState.sharedDimensions.entrypoint
    const collectionURI = entrypoint?.get(md.hierarchies)?.id

    if (!collectionURI) throw new Error('Missing hierarchies collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)

    context.commit('storeCollection', collection)
  },
}

const mutations: MutationTree<HierarchiesState> = {
  storeCollection (state, collection) {
    state.collection = collection || null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
