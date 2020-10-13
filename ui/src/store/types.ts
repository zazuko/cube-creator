import { VuexOidcState } from 'vuex-oidc'
import { APIState } from './modules/api'
import { CubeProjectsState } from '@/store/modules/cube-projects'

export interface RootState {
  auth: VuexOidcState,
  api: APIState,
  cubeProjects: CubeProjectsState,
}
