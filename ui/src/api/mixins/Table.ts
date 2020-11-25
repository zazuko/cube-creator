import { Constructor, property } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, Table } from '@cube-creator/model'
import { AdditionalActions } from '@/api/mixins/ApiResource'

declare module '@cube-creator/model' {
  export interface Table {
    columnMappings: ColumnMapping[]
  }
}

export default function mixin<Base extends Constructor> (base: Base): Mixin {
  class Impl extends base implements Partial<Table>, AdditionalActions {
    get _additionalActions () {
      return {
        createLiteralColumnMapping: cc.CreateLiteralColumnMappingAction,
        createReferenceColumnMapping: cc.CreateReferenceColumnMappingAction,
      }
    }

    @property.resource({ values: 'array', path: cc.columnMapping })
    columnMappings!: Array<ColumnMapping>
  }

  return Impl
}

mixin.appliesTo = cc.Table
