import type { RdfineEnvironment } from '@tpluscode/rdfine/environment'
import type { Factory } from '@tpluscode/rdfine/factory'
import * as CubeCreator from './index.js'

declare module '@tpluscode/rdfine/environment' {
  interface Rdfine {
    cc: {
      Table: Factory<CubeCreator.Table>
      Project: Factory<CubeCreator.Project>
      Organization: Factory<CubeCreator.Organization>
    }
  }
}

export default class {
  init(this: RdfineEnvironment) {
    this.rdfine.cc = this._initVocabulary(CubeCreator)
  }
}
