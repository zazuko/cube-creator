import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { ManagedDimension, ManagedTerm, RootState } from '../types'
import { serializeManagedDimension, serializeManagedTerm } from '../serializers'
import { Collection } from 'alcaeus'

export interface ManagedDimensionState {
  dimension: null | ManagedDimension
  terms: null | ManagedTerm[]
}

const initialState = {
  dimension: null,
  terms: null,
}

const getters: GetterTree<ManagedDimensionState, RootState> = {
}

const actions: ActionTree<ManagedDimensionState, RootState> = {
  async fetchDimension (context, id) {
    context.commit('storeDimension', null)
    context.commit('storeTerms', null)

    if (!context.rootState.managedDimensions.collection) {
      await context.dispatch('managedDimensions/fetchEntrypoint', {}, { root: true })
      await context.dispatch('managedDimensions/fetchCollection', {}, { root: true })
    }

    const dimensions = context.rootGetters['managedDimensions/dimensions']
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
    const terms = termsCollection.member.map(serializeManagedTerm)
    context.commit('storeTerms', terms)
  },

  removeTerm (context, term) {
    context.commit('removeTerm', term)
  },
}

const mutations: MutationTree<ManagedDimensionState> = {
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
