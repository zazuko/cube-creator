import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { ManagedDimension, ManagedTerm, RootState } from '../types'
import { serializeManagedDimension, serializeManagedTerm } from '../serializers'
import { Collection } from 'alcaeus'

export interface ManagedDimensionsState {
  dimension: null | ManagedDimension
  terms: null | ManagedTerm[]
}

const initialState = {
  dimension: null,
  terms: null,
}

const getters: GetterTree<ManagedDimensionsState, RootState> = {
}

const actions: ActionTree<ManagedDimensionsState, RootState> = {
  async fetchDimension (context, id) {
    context.commit('storeDimension', null)
    context.commit('storeTerms', null)

    const dimensionResource = await api.fetchResource(id)
    const dimension = serializeManagedDimension(dimensionResource)

    context.commit('storeDimension', dimension)

    if (dimension.terms) {
      context.dispatch('fetchDimensionTerms', dimension)
    }

    return dimension
  },

  async fetchDimensionTerms (context, dimension) {
    const termsCollection = await api.fetchResource<Collection>(dimension.terms.value)
    const terms = termsCollection.member.map(serializeManagedTerm)
    context.commit('storeTerms', terms)
  },

  removeTerm (context, term) {
    context.commit('removeTerm', term)
  },
}

const mutations: MutationTree<ManagedDimensionsState> = {
  storeDimension (state, dimension) {
    state.dimension = dimension
  },

  storeTerms (state, terms) {
    state.terms = terms
  },

  storeNewTerm (state, term) {
    state.terms?.push(serializeManagedTerm(term))
  },

  removeTerm (state, term) {
    state.terms = state.terms?.filter(({ clientPath }) => term.clientPath !== clientPath) ?? null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
