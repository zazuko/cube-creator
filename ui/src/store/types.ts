import { VuexOidcState } from 'vuex-oidc'
import { DatasetCore, NamedNode, Quad, Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { ProjectsState } from '@/store/modules/projects'
import { ProjectState } from '@/store/modules/project'
import { Actions } from '@/api/mixins/ApiResource'
import { HierarchyState } from './modules/hierarchy'
import { HierarchiesState } from './modules/hierarchies'
import { SharedDimensionsState } from './modules/sharedDimensions'
import { SharedDimensionState } from './modules/sharedDimension'
import { GraphPointer } from 'clownface'
import { ResourceIdentifier } from 'alcaeus'
import { TypeCollection } from '@tpluscode/rdfine/lib/TypeCollection'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

export interface RootState {
  app: AppState
  auth: VuexOidcState
  api: APIState
  hierarchy: HierarchyState
  hierarchies: HierarchiesState
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

export interface Path extends RdfResourceCore {
  inversePath: NamedNode | undefined
}

export interface NextInHierarchy extends RdfResourceCore {
  name: string
  property: Path
  targetType: NamedNode[]
  nextInHierarchy: NextInHierarchy | undefined
}

export interface Hierarchy extends Resource {
  name: string
  dimension: NamedNode
  hierarchyRoot: NamedNode[]
  nextInHierarchy: NextInHierarchy
}

export interface SharedDimension extends Resource {
  name?: string
  abbreviation: Term[]
  terms?: Term
  validThrough?: Date
  export?: Resource
}

export interface SharedDimensionTerm extends Resource {
  name: Term[]
  identifiers: string[]
  validThrough?: Date
  canonical: Term | undefined
  newlyCreated?: boolean
}

export interface ProjectDetailPart {
  id: ResourceIdentifier
  name: string | undefined
  values: Term[]
}

export interface ProjectDetails extends Resource {
  parts: ProjectDetailPart[]
}
