import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { Project, CsvMapping, JobCollection, SourcesCollection, TableCollection, Table } from '@cube-creator/model'

export interface ProjectState {
  project: null | Project,
  csvMapping: null | CsvMapping,
  sourcesCollection: null | SourcesCollection,
  tableCollection: null | TableCollection,
  jobCollection: null | JobCollection,
}

const initialState = {
  project: null,
  csvMapping: null,
  sourcesCollection: null,
  tableCollection: null,
  jobCollection: null,
}

const getters: GetterTree<ProjectState, RootState> = {
  sources (state) {
    return state.sourcesCollection?.member || []
  },

  tables (state) {
    return state.tableCollection?.member || []
  },

  jobs (state) {
    const jobs = state.jobCollection?.member || []

    return jobs.sort(({ created: created1 }, { created: created2 }) => created2.getTime() - created1.getTime())
  },

  findSource (_state, getters) {
    return (id: string) =>
      getters.sources.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  findTable (_state, getters) {
    return (id: string) =>
      getters.tables.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },

  columnMappings (state, getters) {
    return getters.tables.map((table: Table) => table.columnMappings).flat()
  },

  findColumnMapping (_state, getters) {
    return (id: string) =>
      getters.columnMappings.find(({ clientPath }: { clientPath: string}) => clientPath === id)
  },
}

const actions: ActionTree<ProjectState, RootState> = {
  async fetchProject (context, id) {
    context.commit('storeProject', null)

    const project = await api.fetchResource(id)

    context.commit('storeProject', project)

    return project
  },

  async fetchCSVMapping (context) {
    const project = context.state.project

    if (!project) {
      throw new Error('Project not loaded')
    }

    const mappingId = project.csvMapping?.id.value

    if (!mappingId) {
      throw new Error('Project does not have a csvMapping')
    }

    context.commit('storeCSVMapping', null)
    context.commit('storeSourcesCollection', null)
    context.commit('storeTableCollection', null)

    const mapping = await api.fetchResource<CsvMapping>(mappingId)
    context.commit('storeCSVMapping', mapping)

    const sourcesCollection = await api.fetchResource(mapping.sourcesCollection.id.value)
    context.commit('storeSourcesCollection', sourcesCollection)

    const tableCollection = await api.fetchResource(mapping.tableCollection.id.value)
    context.commit('storeTableCollection', tableCollection)

    return mapping
  },

  async fetchJobCollection (context) {
    if (!context.state.project) {
      throw new Error('Project not loaded')
    }

    const id = context.state.project.jobCollection?.id.value

    if (!id) {
      throw new Error('Project does not have a jobCollection')
    }

    const collection = await api.fetchResource<JobCollection>(id)
    context.commit('storeJobCollection', collection)

    return collection
  },

  async refreshSourcesCollection (context) {
    const collection = context.state.sourcesCollection

    if (!collection) {
      throw new Error('Sources collection not loaded')
    }

    const freshCollection = await api.fetchResource<SourcesCollection>(collection.id.value)
    context.commit('storeSourcesCollection', freshCollection)

    return freshCollection
  },

  async refreshTableCollection (context) {
    const collection = context.state.tableCollection

    if (!collection) {
      throw new Error('Table collection not loaded')
    }

    const freshCollection = await api.fetchResource<TableCollection>(collection.id.value)
    context.commit('storeTableCollection', freshCollection)

    return freshCollection
  },

  async uploadCSVs (context, files) {
    const operation = context.state.csvMapping?.sourcesCollection.actions?.upload ?? null
    const uploads = files.map((file: File) => {
      const headers = {
        'content-type': 'text/csv',
        'content-disposition': `file; filename=${file.name}`,
      }
      return api.invokeSaveOperation(operation, file, headers)
    })

    return Promise.all(uploads)
  },

}

const mutations: MutationTree<ProjectState> = {
  storeProject (state, project) {
    state.project = project
  },

  storeCSVMapping (state, mapping) {
    state.csvMapping = mapping
  },

  storeSourcesCollection (state, collection) {
    state.sourcesCollection = collection
  },

  storeTableCollection (state, collection) {
    state.tableCollection = collection
  },

  storeJobCollection (state, collection) {
    state.jobCollection = collection
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
