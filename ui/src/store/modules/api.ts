import { RdfResource, Resource, RuntimeOperation } from 'alcaeus'
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { GraphPointer } from 'clownface'
import RdfResourceImpl, { ResourceIdentifier } from '@tpluscode/rdfine'

export interface APIState {
  entrypoint: null | Resource,
}

const initialState = {
  entrypoint: null,
}

const getters: GetterTree<APIState, RootState> = {
}

const actions: ActionTree<APIState, RootState> = {
  async fetchEntrypoint (context) {
    const entrypoint = await api.fetchResource('/')
    context.commit('storeEntrypoint', entrypoint)
    return entrypoint
  },
  async invokeSaveOperation (context, { operation, resource }: {operation: RuntimeOperation; resource: RdfResource | GraphPointer<ResourceIdentifier>}) {
    const data = 'toJSON' in resource ? resource : RdfResourceImpl.factory.createEntity(resource) as RdfResource

    return api.invokeSaveOperation(operation, data)
  }
}

const mutations: MutationTree<APIState> = {
  storeEntrypoint (state, entrypoint) {
    state.entrypoint = entrypoint
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
