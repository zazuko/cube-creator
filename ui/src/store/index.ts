import Vue from 'vue'
import Vuex from 'vuex'
import { auth } from './modules/auth'
import app from './modules/app'
import api from './modules/api'
import projects from './modules/projects'
import project from './modules/project'
import sharedDimensions from './modules/sharedDimensions'
import sharedDimension from './modules/sharedDimension'
import { RootState } from './types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  modules: {
    app,
    auth: auth(),
    api,
    projects,
    project,
    sharedDimensions,
    sharedDimension,
  },
})
