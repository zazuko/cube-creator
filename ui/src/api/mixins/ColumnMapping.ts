import { Resource } from 'alcaeus'
import { Term } from 'rdf-js'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { ColumnMapping, CSVColumn } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements ColumnMapping {
    get actions () {
      return commonActions(this)
    }

    get sourceColumn (): CSVColumn {
      return this.get<CSVColumn>(ns.cc.sourceColumn)
    }

    get targetProperty (): Term {
      return this.get(ns.cc.targetProperty).id
    }

    get datatype (): Term {
      return this.get(ns.cc.datatype).id
    }

    get language (): string {
      return this.getString(ns.cc.language)
    }
  }
}

mixin.appliesTo = ns.cc.ColumnMapping
