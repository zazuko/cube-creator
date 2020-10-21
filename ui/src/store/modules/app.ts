import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { RootState } from '../types'

export interface Message {
  title: string;
  message: string;
  type: 'is-info' | 'is-success' | 'is-danger';
}

export interface AppState {
  messages: Message[];
  loading: boolean;
}

const initialState = {
  messages: [],
  loading: false,
}

const getters: GetterTree<AppState, RootState> = {
}

const actions: ActionTree<AppState, RootState> = {
  dismissMessage (context, message) {
    context.commit('removeMessage', message)
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
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
