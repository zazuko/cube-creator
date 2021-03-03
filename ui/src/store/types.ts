import { VuexOidcState } from 'vuex-oidc'
import { DatasetCore, Quad, Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { ProjectsState } from '@/store/modules/projects'
import { ProjectState } from '@/store/modules/project'
import { Actions } from '@/api/mixins/ApiResource'
import { SharedDimensionsState } from './modules/sharedDimensions'
import { SharedDimensionState } from './modules/sharedDimension'
import { GraphPointer } from 'clownface'
import { ResourceIdentifier } from 'alcaeus'
import { TypeCollection } from '@tpluscode/rdfine/lib/TypeCollection'

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
  id: ResourceIdentifier
  clientPath: string
  actions: Actions
  pointer: GraphPointer
  types: TypeCollection<DatasetCore<Quad, Quad>>
}

export interface SharedDimension extends Resource {
  name?: string
  terms?: Term
}

export interface SharedDimensionTerm extends Resource {
  name: Term[]
  identifiers: string[]
}
