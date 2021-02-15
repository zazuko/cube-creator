import Vue from 'vue'
import Vuex from 'vuex'
import { auth } from './modules/auth'
import app from './modules/app'
import api from './modules/api'
import projects from './modules/projects'
import project from './modules/project'
import managedDimensions from './modules/managedDimensions'
import managedDimension from './modules/managedDimension'
import { RootState } from './types'

Vue.use(Vuex)

export default new Vuex.Store<RootState>({
  modules: {
    app,
    auth: auth(),
    api,
    projects,
    project,
    managedDimensions,
    managedDimension,
  },
})
