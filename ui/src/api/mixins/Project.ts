import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { Project, CSVMapping } from '@/types'
import { commonActions } from '../common'

export default function Mixin<Base extends Constructor<Resource>> (base: Base) {
  return class extends base implements Project {
    get actions () {
      return commonActions(this)
    }

    get csvMapping (): CSVMapping | null {
      return this.get<CSVMapping>(ns.cc.csvMapping)
    }
  }
}

Mixin.appliesTo = ns.cc.CubeProject
