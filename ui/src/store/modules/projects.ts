import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import * as ns from '@cube-creator/core/namespace'
import { CubeProject, Project, ProjectsCollection } from '@cube-creator/model'
import { serializeProjectDetails, serializeCollection } from '../serializers'
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

    let params = new URLSearchParams()
    if (query) {
      params = new URLSearchParams(query)
    } else if (location.search) {
      params = new URLSearchParams(location.search)
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
    state.collection = collection ? serializeCollection(collection, sortProject) : null
  },

  storeProjectDetails (state, { project, details }) {
    state.details = {
      ...state.details,
      [project.id.value]: serializeProjectDetails(details),
    }
  },
}

function sortProject (a: CubeProject, b: CubeProject) {
  const aPlannedUpdate = a.plannedNextUpdate?.toISOString()
  if (!aPlannedUpdate) {
    return 1
  }

  const bPlannedUpdate = b.plannedNextUpdate?.toISOString()
  if (!bPlannedUpdate) {
    return -1
  }

  return aPlannedUpdate.localeCompare(bPlannedUpdate) || a.label.localeCompare(b.label)
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
