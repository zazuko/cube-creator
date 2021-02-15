import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { md } from '@cube-creator/core/namespace'
import { serializeManagedDimensionCollection } from '../serializers'
import { RdfResource } from 'alcaeus'

/* eslint-disable-next-line */
interface ManagedDimensionCollection {

}

export interface ManagedDimensionsState {
  entrypoint: null | RdfResource
  collection: null | ManagedDimensionCollection,
}

const initialState = {
  entrypoint: null,
  collection: null,
}

const getters: GetterTree<ManagedDimensionsState, RootState> = {
}

const actions: ActionTree<ManagedDimensionsState, RootState> = {
  async fetchEntrypoint (context) {
    const entrypoint = await api.fetchResource('/managed-dimensions/')
    context.commit('storeEntrypoint', entrypoint)
    return entrypoint
  },

  async fetchCollection (context) {
    const entrypoint = context.state.entrypoint
    const collectionURI = entrypoint?.get(md.managedDimensions)?.id

    if (!collectionURI) throw new Error('Missing managed dimensions collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)
    context.commit('storeCollection', collection)
  },
}

const mutations: MutationTree<ManagedDimensionsState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = Object.freeze(entrypoint)
  },

  storeCollection (state, collection) {
    state.collection = collection ? serializeManagedDimensionCollection(collection) : null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
