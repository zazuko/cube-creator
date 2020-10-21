import Vue from 'vue'
import Vuex from 'vuex'
import { auth } from './modules/auth'
import app from './modules/app'
import api from './modules/api'
import cubeProjects from './modules/cube-projects'
import { RootState } from './types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  modules: {
    app,
    auth: auth(),
    api,
    cubeProjects,
  },
})
