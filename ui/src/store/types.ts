import { VuexOidcState } from 'vuex-oidc'
import { Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { ProjectsState } from '@/store/modules/projects'
import { ProjectState } from '@/store/modules/project'
import { Actions } from '@/api/mixins/ApiResource'
import { ManagedDimensionsState } from './modules/managedDimensions'
import { ManagedDimensionState } from './modules/managedDimension'

export interface RootState {
  app: AppState
  auth: VuexOidcState
  api: APIState
  projects: ProjectsState
  project: ProjectState
  managedDimensions: ManagedDimensionsState
  managedDimension: ManagedDimensionState
}

export interface Resource {
  clientPath: string
  actions: Actions
}

export interface ManagedDimension extends Resource {
  name: Term[]
  terms?: Term
}

export interface ManagedTerm extends Resource {
  name: Term[]
  identifiers: string[]
}
