import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { SharedDimension, SharedDimensionTerm, RootState } from '../types'
import { serializeSharedDimensionTerm } from '../serializers'
import { Collection } from 'alcaeus'

export interface SharedDimensionState {
  dimension: null | SharedDimension
  terms: null | SharedDimensionTerm[]
}

const initialState = {
  dimension: null,
  terms: null,
}

const getters: GetterTree<SharedDimensionState, RootState> = {
  findTerm (state) {
    return (id: string) =>
      state.terms?.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },
}

const actions: ActionTree<SharedDimensionState, RootState> = {
  async fetchDimension (context, id) {
    context.commit('storeDimension', null)
    context.commit('storeTerms', null)

    if (!context.rootState.sharedDimensions.collection) {
      await context.dispatch('sharedDimensions/fetchEntrypoint', {}, { root: true })
      await context.dispatch('sharedDimensions/fetchCollection', {}, { root: true })
    }

    const dimensions = context.rootGetters['sharedDimensions/dimensions']
    const dimension = dimensions.find(({ clientPath }: { clientPath: string}) => clientPath === id)

    if (!dimension) throw new Error(`Dimension not found ${id}`)

    context.commit('storeDimension', dimension)

    if (dimension.terms) {
      context.dispatch('fetchDimensionTerms', dimension)
    }

    return dimension
  },

  async fetchDimensionTerms (context, dimension) {
    const termsCollection = await api.fetchResource<Collection>(dimension.terms.value)
    const terms = termsCollection.member.map(serializeSharedDimensionTerm)
    context.commit('storeTerms', terms)
  },

  removeTerm (context, term) {
    context.commit('removeTerm', term)
  },
}

const mutations: MutationTree<SharedDimensionState> = {
  storeDimension (state, dimension) {
    state.dimension = dimension
  },

  storeTerms (state, terms) {
    state.terms = terms
  },

  storeTerm (state, term) {
    if (!state.terms) throw new Error('Terms not loaded')

    const serializedTerm = serializeSharedDimensionTerm(term)
    const index = state.terms.findIndex(({ clientPath }) => serializedTerm.clientPath === clientPath)

    if (index >= 0) {
      state.terms[index] = serializedTerm
    } else {
      state.terms?.push(serializedTerm)
    }
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
