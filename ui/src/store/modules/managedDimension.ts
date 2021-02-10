import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { serializeManagedDimension } from '../serializers'

/* eslint-disable-next-line */
interface ManagedDimension {

}

export interface ManagedDimensionsState {
  dimension: null | ManagedDimension,
}

const initialState = {
  dimension: null,
}

const getters: GetterTree<ManagedDimensionsState, RootState> = {
}

const actions: ActionTree<ManagedDimensionsState, RootState> = {
  async fetchDimension (context, id) {
    context.commit('storeDimension', null)

    console.log(id)
    const dimension = await api.fetchResource(id)
    console.log(dimension)

    context.commit('storeDimension', dimension)

    return dimension
  },
}

const mutations: MutationTree<ManagedDimensionsState> = {
  storeDimension (state, dimension) {
    state.dimension = dimension ? serializeManagedDimension(dimension) : null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
