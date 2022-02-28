import { RdfResource, RuntimeOperation } from 'alcaeus'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { GraphPointer } from 'clownface'
import RdfResourceImpl, { ResourceIdentifier } from '@tpluscode/rdfine'
import { ToastProgrammatic as Toast } from 'buefy'
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

  async invokeSaveOperation (context, { operation, resource, headers }: {operation: RuntimeOperation; resource: RdfResource | GraphPointer<ResourceIdentifier>; headers?: HeadersInit}) {
    const data = 'toJSON' in resource ? resource : RdfResourceImpl.factory.createEntity(resource) as RdfResource

    return api.invokeSaveOperation(operation, data, headers)
  },

  async invokeDeleteOperation (context, { operation, successMessage, callbackAction, callbackParams = {} }): Promise<void> {
    context.commit('app/setLoading', true, { root: true })

    try {
      await api.invokeDeleteOperation(operation)

      Toast.open({
        message: successMessage,
        type: 'is-success',
      })

      if (callbackAction) {
        context.dispatch(callbackAction, callbackParams, { root: true })
      }
    } catch (e) {
      context.commit('app/pushMessage', {
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
