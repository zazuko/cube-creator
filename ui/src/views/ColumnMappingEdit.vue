<template>
  <side-pane :title="title" @close="onCancel">
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
import { defineComponent } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import { ColumnMapping, Table, CsvSource } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import SidePane from '@/components/SidePane.vue'
import ReferenceColumnMappingForm from '@/components/ReferenceColumnMappingForm.vue'
import LiteralColumnMappingForm from '@/components/LiteralColumnMappingForm.vue'
import { displayToast } from '@/use-toast'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'ColumnMappingEditView',
  components: { SidePane, LiteralColumnMappingForm, ReferenceColumnMappingForm },

  data (): { isSubmitting: boolean, error: ErrorDetails | null } {
    return {
      isSubmitting: false,
      error: null,
    }
  },

  computed: {
    ...mapGetters('project', {
      findColumnMapping: 'findColumnMapping',
      getSource: 'getSource',
      tables: 'tables',
    }),

    columnMapping (): ColumnMapping | null {
      const columnMappingId = this.$route.params.columnMappingId
      return this.findColumnMapping(columnMappingId)
    },

    isLiteral (): boolean {
      return this.columnMapping?.types.has(cc.LiteralColumnMapping) ?? false
    },

    table (): Table {
      const table = this.tables.find((table: Table) =>
        table.columnMappings.some((columnMapping) => columnMapping.clientPath === this.columnMapping?.clientPath))

      if (!table) throw new Error('Table not found')

      return table
    },

    source (): CsvSource | null {
      return this.table.csvSource ? this.getSource(this.table.csvSource.id) : null
    },

    operation (): RuntimeOperation | null {
      return this.columnMapping?.actions.edit ?? null
    },

    title (): string {
      return this.operation?.title ?? '...'
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        const columnMapping = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        this.$store.commit('project/storeUpdatedColumnMapping', { table: this.table, columnMapping })

        displayToast({
          message: 'Column mapping was successfully updated',
          variant: 'success',
        })

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
