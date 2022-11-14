import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api, rootURL } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'
import { Project, ProjectsCollection } from '@cube-creator/model'
import { serializeProjectDetails, serializeProjectsCollection } from '../serializers'
import { RdfResource } from 'alcaeus'

export interface ProjectsState {
  collection: null | ProjectsCollection
  details: Record<string, RdfResource>
}

const initialState = {
  collection: null,
  details: {},
}

const getters: GetterTree<ProjectsState, RootState> = {
  getProjectDetails (state) {
    return (project: Project): RdfResource | null => {
      return state.details[project.id.value] ?? null
    }
  }
}

const actions: ActionTree<ProjectsState, RootState> = {
  async fetchCollection (context, query) {
    const entrypoint = context.rootState.api.entrypoint
    const collectionURI = entrypoint?.get(ns.cc.projects)?.id

    if (!collectionURI) throw new Error('Missing projects collection in entrypoint')

    let params: URLSearchParams
    if (query) {
      params = new URLSearchParams(query)
    } else {
      params = new URLSearchParams({
        author: `${rootURL}user/${context.rootState.auth.user.sub}`,
      })
    }

    const collection = await api.fetchResource(collectionURI.value + '?' + params.toString())
    context.commit('storeCollection', collection)
  },

  async fetchProjectDetails (context, project) {
    const details = await api.fetchResource(project.details.id.value)

    context.commit('storeProjectDetails', { project, details })

    return details
  },
}

const mutations: MutationTree<ProjectsState> = {
  storeCollection (state, collection) {
    state.collection = collection ? serializeProjectsCollection(collection) : null
  },

  storeProjectDetails (state, { project, details }) {
    state.details = {
      ...state.details,
      [project.id.value]: serializeProjectDetails(details),
    }
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
