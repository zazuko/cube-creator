<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update table"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { GraphPointer } from 'clownface'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import * as storeNs from '../store/namespace'

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class TableCreateView extends Vue {
  @storeNs.project.Getter('findTable') findTable!: (id: string) => Table | null

  resource: GraphPointer | null = null
  shape: Shape | null = null
  isSubmitting = false;
  error: ErrorDetails | null = null

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    // Fetch fresh table to avoid superfluous quads in the dataset
    if (this.table) {
      const table = await api.fetchResource<Table>(this.table.id.value)
      this.resource = table.pointer
        .addOut(cc.isObservationTable, table.isObservationTable)
    }
  }

  get table (): Table | null {
    const tableId = this.$route.params.tableId
    return this.findTable(tableId)
  }

  get operation (): RuntimeOperation | null {
    return this.table?.actions.edit ?? null
  }

  get title (): string {
    return this.operation?.title ?? 'Error: Missing operation'
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    if (!this.table) return

    this.error = null
    this.isSubmitting = true

    try {
      const { identifierTemplate } = this.table
      const table: Table = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.commit('project/storeTable', table)

      this.$buefy.toast.open({
        message: `Table ${table.name} was successfully created`,
        type: 'is-success',
      })

      if (table.identifierTemplate !== identifierTemplate) {
        this.$store.dispatch('project/fetchCSVMapping')
      }

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
