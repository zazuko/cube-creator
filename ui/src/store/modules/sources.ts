// import { ActionTree, MutationTree, GetterTree } from 'vuex'
// import { RootState } from '@/store/types'
// import { HydraResource } from 'alcaeus'

// interface SourcesState {
//   // Sources are stored per-project, indexed by projectId
//   sources: Record<string, HydraResource>;
// }

// const initialState: SourcesState = {
//   sources: {},
// }

// const getters: GetterTree<SourcesState, RootState> = {
// }

// const actions: ActionTree<SourcesState, RootState> = {
//   async upload (context, { project, file }) {
//     const source = await context.rootState.api.projects.createSource(project, file)
//     context.commit('storeInProject', { project, source })
//   }
// }

// const mutations: MutationTree<SourcesState> = {
//   storeInProject (state, { project, source }) {
//     const projectSources = state.sources[project.id]

//     if (!projectSources.data) throw new Error('Project sources not loaded')

//     projectSources.data.push(source)
//   },
// }

// export default {
//   namespaced: true,
//   state: initialState,
//   getters,
//   actions,
//   mutations,
// }
