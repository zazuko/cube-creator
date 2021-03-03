import { VuexOidcState } from 'vuex-oidc'
import { Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { ProjectsState } from '@/store/modules/projects'
import { ProjectState } from '@/store/modules/project'
import { Actions } from '@/api/mixins/ApiResource'
import { SharedDimensionsState } from './modules/sharedDimensions'
import { SharedDimensionState } from './modules/sharedDimension'

export interface RootState {
  app: AppState
  auth: VuexOidcState
  api: APIState
  projects: ProjectsState
  project: ProjectState
  sharedDimensions: SharedDimensionsState
  sharedDimension: SharedDimensionState
}

export interface Resource {
  clientPath: string
  actions: Actions
}

export interface SharedDimension extends Resource {
  name?: string
  terms?: Term
}

export interface SharedDimensionTerm extends Resource {
  name: Term[]
  identifiers: string[]
}
