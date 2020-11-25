<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <hydra-operation-form
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
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
import clownface, { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { dataset } from '@rdf-esm/dataset'
import { api } from '@/api'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.Getter('findColumnMapping') findColumnMapping!: (id: string) => ColumnMapping | null
  @projectNS.Getter('findTable') findTable!: (id: string) => Table
  @projectNS.Getter('findSource') findSource!: (id: string) => CsvSource
  @projectNS.Getter('sources') sources!: CsvSource[]

  resource: GraphPointer | null = null
  isSubmitting = false;
  error: ErrorDetails | null = null;
  shape: Shape | null = null;

  get columnMapping (): ColumnMapping | null {
    const columnMappingId = this.$router.currentRoute.params.columnMappingId
    return this.findColumnMapping(columnMappingId)
  }

  get table (): Table {
    const tableId = this.$router.currentRoute.params.tableId
    return this.findTable(tableId)
  }

  get source (): CsvSource | null {
    for (const source of this.sources) {
      if (source.columns.find((column) => column.id.value === this.columnMapping?.sourceColumn.id.value)) {
        return source
      }
    }

    return null
  }

  get operation (): RuntimeOperation | null {
    return this.columnMapping?.actions.edit ?? null
  }

  async mounted (): Promise<void> {
    if (this.operation) {
      const shape = await api.fetchOperationShape(this.operation)

      // Populate Column selector
      if (shape && this.source) {
        const source = this.source
        if (source) {
          source.columns.forEach((column) => {
            shape.pointer.node(column.id)
              .addOut(schema.name, column.name)
              .addOut(rdf.type, column.pointer.out(rdf.type))
          })
        }
      }

      this.resource = this.columnMapping?.pointer ?? null
      this.shape = shape
    }
  }

  async onSubmit (): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('project/refreshTableCollection')

      this.$store.dispatch('app/showMessage', {
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
