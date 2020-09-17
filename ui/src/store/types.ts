import { VuexOidcState } from 'vuex-oidc'
import { APIState } from './modules/api'

export interface RootState {
  auth: VuexOidcState,
  api: APIState,
}
