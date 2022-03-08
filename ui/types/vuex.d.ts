import { Store } from 'vuex'
import { RootState } from '../src/store/types'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}
