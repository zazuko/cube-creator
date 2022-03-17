import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { Hierarchy, RootState } from '../types'
import { cc, md } from '@cube-creator/core/namespace'
import { serializeSharedDimensionCollection } from '../serializers'
import { Collection, RdfResource } from 'alcaeus'

export interface SharedDimensionsState {
  entrypoint: null | RdfResource
  collection: null | Collection,
  hierarchies: null | Collection,
  hierarchy: null | Hierarchy,
}

const initialState = {
  entrypoint: null,
  collection: null,
  hierarchies: null,
  hierarchy: null,
}

const getters: GetterTree<SharedDimensionsState, RootState> = {
  dimensions (state) {
    return state.collection?.member ?? []
  },
}

const actions: ActionTree<SharedDimensionsState, RootState> = {
  async fetchEntrypoint (context) {
    const rootEntrypoint = context.rootState.api.entrypoint
    const entrypointURI = rootEntrypoint?.get(cc.sharedDimensions)?.id

    if (!entrypointURI) throw new Error('Shared dimensions entrypoint URI not found')

    const entrypoint = await api.fetchResource(entrypointURI.value)
    context.commit('storeEntrypoint', entrypoint)

    return entrypoint
  },

  async fetchCollection (context) {
    const entrypoint = context.state.entrypoint
    const collectionURI = entrypoint?.get(md.sharedDimensions)?.id

    if (!collectionURI) throw new Error('Missing shared dimensions collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)
    context.commit('storeCollection', collection)
  },

  async fetchHierarchies (context) {
    const entrypoint = context.state.entrypoint
    const collectionURI = entrypoint?.get(md.hierarchies)?.id

    if (!collectionURI) throw new Error('Missing hierarchies collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.value)

    context.commit('storeHierarchies', collection)
  },

  async fetchHierarchy (context, id) {
    context.commit('storeHierarchy', await api.fetchResource(id))
  },
}

const mutations: MutationTree<SharedDimensionsState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = Object.freeze(entrypoint)
  },

  storeCollection (state, collection) {
    state.collection = collection ? serializeSharedDimensionCollection(collection) : null
  },

  storeHierarchies (state, collection) {
    state.hierarchies = collection || null
  },

  storeHierarchy (state, hierarchy) {
    state.hierarchy = hierarchy || null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
