import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { loadCommonProperties } from '@/rdf-properties'
import { RootState } from '../types'

export interface Message {
  title?: string
  message: string
  variant: ColorsModifiers
}

export interface AppState {
  language: string[]
  messages: Message[]
  loading: boolean
  commonRDFProperties: string[]
  selectedLanguage: string
}

const initialState = {
  language: ['en', '*'],
  messages: [],
  loading: false,
  commonRDFProperties: [],
  selectedLanguage: 'en',
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

  selectLanguage (context, language) {
    context.commit('storeSelectedLanguage', language)
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

  storeSelectedLanguage (state, language) {
    state.selectedLanguage = language
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
