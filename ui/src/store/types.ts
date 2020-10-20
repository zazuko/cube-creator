import { VuexOidcState } from 'vuex-oidc'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { CubeProjectsState } from '@/store/modules/cube-projects'

export interface RootState {
  app: AppState,
  auth: VuexOidcState,
  api: APIState,
  cubeProjects: CubeProjectsState,
}
