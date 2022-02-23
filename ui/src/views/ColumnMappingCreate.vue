<template>
  <side-pane :title="operation.title" @close="onCancel">
    <b-field label="Column mapping type">
      <b-radio-button v-model="columnMappingType" native-value="literal">
        Literal value
      </b-radio-button>
      <b-radio-button v-model="columnMappingType" native-value="reference">
        Link to another table
      </b-radio-button>
    </b-field>

    <literal-column-mapping-form
      v-if="columnMappingType === 'literal'"
      :operation="operation"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Create column mapping"
      :table="table"
      :source="source"
      @submit="onSubmit"
      @cancel="onCancel"
    />

    <reference-column-mapping-form
      v-else-if="columnMappingType === 'reference'"
      :operation="operation"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Create link"
      :table="table"
      :source="source"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import { Term } from 'rdf-js'
import { CsvSource, Table } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import ReferenceColumnMappingForm from '@/components/ReferenceColumnMappingForm.vue'
import LiteralColumnMappingForm from '@/components/LiteralColumnMappingForm.vue'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import * as storeNs from '../store/namespace'

type ColumnMappingType = 'literal' | 'reference'

@Component({
  components: { SidePane, LiteralColumnMappingForm, ReferenceColumnMappingForm },
})
export default class CubeProjectEditView extends Vue {
  @storeNs.project.Getter('findTable') findTable!: (id: string) => Table
  @storeNs.project.Getter('getSource') getSource!: (uri: Term) => CsvSource

  columnMappingType: ColumnMappingType = 'literal'
  isSubmitting = false
  error: ErrorDetails | null = null

  get table (): Table {
    const tableId = this.$route.params.tableId
    return this.findTable(tableId)
  }

  get source (): CsvSource {
    const source = this.table.csvSource && this.getSource(this.table.csvSource.id)

    if (!source) throw new Error('Source not found')

    return source
  }

  get operation (): RuntimeOperation | null {
    return this.columnMappingType === 'literal'
      ? this.table?.actions.createLiteralColumnMapping ?? null
      : this.table?.actions.createReferenceColumnMapping ?? null
  }

  @Watch('columnMappingType')
  resetError (): void {
    this.error = null
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      const columnMapping = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.commit('project/storeNewColumnMapping', { table: this.table, columnMapping })

      this.$buefy.toast.open({
        message: 'Column mapping was successfully created',
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
