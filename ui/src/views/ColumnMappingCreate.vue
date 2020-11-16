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
import clownface, { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import { CsvSource, Table } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { dataset } from '@rdf-esm/dataset'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.Getter('findTable') findTable!: (id: string) => Table
  @projectNS.Getter('findSource') findSource!: (id: string) => CsvSource

  resource: GraphPointer | null = clownface({ dataset: dataset() }).namedNode('')
  isSubmitting = false;
  error: ErrorDetails | null = null;
  shape: Shape | null = null;

  get table (): Table {
    const tableId = this.$router.currentRoute.params.tableId
    return this.findTable(tableId)
  }

  get operation (): RuntimeOperation | null {
    return this.table?.actions.createColumnMapping ?? null
  }

  async mounted (): Promise<void> {
    if (this.operation) {
      const shape = await api.fetchOperationShape(this.operation)

      // Populate Column selector
      if (shape && this.table.csvSource?.clientPath) {
        const source = this.findSource(this.table.csvSource.clientPath)
        const columnProperty: any = shape.property.find(p => p.class?.equals(csvw.Column))
        columnProperty.in = source.columns
        source.columns.forEach((column) => {
          shape.pointer.node(column.id).addOut(schema.name, column.name)
        })
      }

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
