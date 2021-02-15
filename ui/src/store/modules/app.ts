import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { loadCommonProperties } from '@/rdf-properties'
import { RootState } from '../types'

export interface Message {
  title: string
  message: string
  type: 'is-info' | 'is-success' | 'is-danger'
}

export interface AppState {
  language: string
  messages: Message[]
  loading: boolean
  commonRDFProperties: string[]
}

const initialState = {
  language: 'en',
  messages: [],
  loading: false,
  commonRDFProperties: [],
}

const getters: GetterTree<AppState, RootState> = {
}

const actions: ActionTree<AppState, RootState> = {
  dismissMessage (context, message) {
    context.commit('removeMessage', message)
  },

  showMessage (context, message) {
    context.commit('pushMessage', message)
  },

  async loadCommonRDFProperties (context) {
    const properties = await loadCommonProperties()
    context.commit('storeCommonRDFProperties', properties)
  },
}

const mutations: MutationTree<AppState> = {
  pushMessage (state, message) {
    state.messages = [...state.messages, message]
  },

  removeMessage (state, message) {
    state.messages = state.messages.filter((m) => m !== message)
  },

  setLoading (state, isLoading) {
    state.loading = isLoading
  },

  storeCommonRDFProperties (state, properties) {
    state.commonRDFProperties = properties
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
