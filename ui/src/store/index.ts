import Vue from 'vue'
import Vuex from 'vuex'
import { auth } from './modules/auth'
import api from './modules/api'
import { RootState } from './types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  modules: {
    auth: auth(),
    api,
  },
})
