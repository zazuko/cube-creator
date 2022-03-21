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
import { defineComponent, ref, Ref } from 'vue'
import { GraphPointer } from 'clownface'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { displayToast } from '@/use-toast'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'TableEditView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const resource: Ref<GraphPointer | null> = ref(null)
    const error: Ref<ErrorDetails | null> = ref(null)
    const isSubmitting = ref(false)
    const shape: Ref<Shape | null> = ref(null)

    return {
      resource,
      error,
      isSubmitting,
      shape,
    }
  },

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
  },

  computed: {
    ...mapGetters('project', {
      findTable: 'findTable',
    }),

    table (): Table | null {
      const tableId = this.$route.params.tableId
      return this.findTable(tableId)
    },

    operation (): RuntimeOperation | null {
      return this.table?.actions.edit ?? null
    },

    title (): string {
      return this.operation?.title ?? 'Error: Missing operation'
    },
  },

  methods: {
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

        displayToast({
          message: `Table ${table.name} was successfully created`,
          variant: 'success',
        })

        if (table.identifierTemplate !== identifierTemplate) {
          this.$store.dispatch('project/fetchCSVMapping')
        }

        this.$router.push({ name: 'CSVMapping' })
      } catch (e: any) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
