import { RdfResource } from 'alcaeus'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { dcat } from '@tpluscode/rdf-ns-builders'

export interface APIState {
  entrypoint: null | RdfResource
}

const initialState = {
  entrypoint: null,
}

const getters: GetterTree<APIState, RootState> = {
  publicQueryEndpoint (state) {
    return state.entrypoint?.pointer.out(dcat.endpointURL).value || null
  }
}

const actions: ActionTree<APIState, RootState> = {
  async fetchEntrypoint (context) {
    const entrypoint = await api.fetchResource('/')
    context.commit('storeEntrypoint', entrypoint)
    return entrypoint
  },

  async invokeDeleteOperation (context, { operation, successMessage, callbackAction, callbackParams = {} }): Promise<void> {
    context.commit('app/setLoading', true, { root: true })

    try {
      await api.invokeDeleteOperation(operation)

      context.dispatch('app/showMessage', {
        message: successMessage,
        variant: 'success',
      }, { root: true })

      if (callbackAction) {
        context.dispatch(callbackAction, callbackParams, { root: true })
      }
    } catch (e) {
      context.dispatch('app/showMessage', {
        title: 'An error occurred',
        message: `${e}`,
        variant: 'danger',
      }, { root: true })

      throw e
    } finally {
      context.commit('app/setLoading', false, { root: true })
    }
  },
}

const mutations: MutationTree<APIState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = Object.freeze(entrypoint)
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
