import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { cc, md } from '@cube-creator/core/namespace'
import { Collection, RdfResource } from 'alcaeus'
import { serializeCollection } from '@/store/serializers'
import { schema } from '@tpluscode/rdf-ns-builders'

export interface SharedDimensionsState {
  entrypoint: null | RdfResource
  collection: null | Collection,
}

const initialState = {
  entrypoint: null,
  collection: null,
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

  async fetchCollection (context, query) {
    const entrypoint = context.state.entrypoint
    const collectionURI = entrypoint?.get(md.sharedDimensions)?.id

    let params = new URLSearchParams()
    if (query) {
      params = new URLSearchParams(query)
    } else if (location.search) {
      params = new URLSearchParams(location.search)
    }

    if (!collectionURI) throw new Error('Missing shared dimensions collection in entrypoint')

    const collectionUrl = new URL(collectionURI.value)
    for (const [key, value] of params) {
      collectionUrl.searchParams.set(key, value)
    }

    const collection = await api.fetchResource(collectionUrl.toString())
    context.commit('storeCollection', collection)
  },
}

const mutations: MutationTree<SharedDimensionsState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = Object.freeze(entrypoint)
  },

  storeCollection (state, collection) {
    state.collection = collection ? serializeCollection(collection, sortByName) : null
  },
}

function sortByName (l: RdfResource, r: RdfResource) {
  return l.pointer.out(schema.name).value?.localeCompare(r.pointer.out(schema.name).value || '') || 0
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
