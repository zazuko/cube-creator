<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <literal-column-mapping-form
      v-if="isLiteral"
      :operation="operation"
      :column-mapping="columnMapping"
      :table="table"
      :source="source"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update column mapping"
      @submit="onSubmit"
      @cancel="onCancel"
    />
    <reference-column-mapping-form
      v-else
      :column-mapping="columnMapping"
      :table="table"
      :source="source"
      :operation="operation"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update link"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import { ColumnMapping, Table, CsvSource } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import SidePane from '@/components/SidePane.vue'
import ReferenceColumnMappingForm from '@/components/ReferenceColumnMappingForm.vue'
import LiteralColumnMappingForm from '@/components/LiteralColumnMappingForm.vue'
import { Term } from 'rdf-js'

const projectNS = namespace('project')

@Component({
  components: { SidePane, LiteralColumnMappingForm, ReferenceColumnMappingForm },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.Getter('findColumnMapping') findColumnMapping!: (id: string) => ColumnMapping | null
  @projectNS.Getter('getSource') getSource!: (uri: Term) => CsvSource
  @projectNS.Getter('tables') tables!: Table[]

  isSubmitting = false;
  error: ErrorDetails | null = null;

  get columnMapping (): ColumnMapping | null {
    const columnMappingId = this.$router.currentRoute.params.columnMappingId
    return this.findColumnMapping(columnMappingId)
  }

  get isLiteral (): boolean {
    return this.columnMapping?.types.has(cc.LiteralColumnMapping) ?? false
  }

  get table (): Table {
    const table = this.tables.find((table) =>
      table.columnMappings.some((columnMapping) => columnMapping.clientPath === this.columnMapping?.clientPath))

    if (!table) throw new Error('Table not found')

    return table
  }

  get source (): CsvSource | null {
    return this.table.csvSource ? this.getSource(this.table.csvSource.id) : null
  }

  get operation (): RuntimeOperation | null {
    return this.columnMapping?.actions.edit ?? null
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.dispatch('project/refreshTableCollection')

      this.$buefy.toast.open({
        message: 'Column mapping was successfully updated',
        type: 'is-success',
      })

      this.$router.push({ name: 'CSVMapping' })
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
