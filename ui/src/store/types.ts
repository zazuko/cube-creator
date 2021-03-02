import { VuexOidcState } from 'vuex-oidc'
import { Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { ProjectsState } from '@/store/modules/projects'
import { ProjectState } from '@/store/modules/project'

export interface RootState {
  app: AppState
  auth: VuexOidcState
  api: APIState
  projects: ProjectsState
  project: ProjectState
}

export interface ManagedDimension {
  name: Term[]
  terms?: Term
}

export interface ManagedTerm {
  name: Term[]
  identifiers: string[]
}
