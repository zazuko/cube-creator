<template>
  <side-pane :title="title" @close="onCancel">
    <o-field label="Column mapping type">
      <radio-button v-model="columnMappingType" native-value="literal">
        Literal value
      </radio-button>
      <radio-button v-model="columnMappingType" native-value="reference">
        Link to another table
      </radio-button>
    </o-field>

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
import { defineComponent } from 'vue'
import { ResourceIdentifier, RuntimeOperation } from 'alcaeus'
import type { GraphPointer } from 'clownface'
import { mapGetters } from 'vuex'
import { CsvSource, Table } from '@cube-creator/model'
import RadioButton from '@/components/RadioButton.vue'
import SidePane from '@/components/SidePane.vue'
import ReferenceColumnMappingForm from '@/components/ReferenceColumnMappingForm.vue'
import LiteralColumnMappingForm from '@/components/LiteralColumnMappingForm.vue'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { displayToast } from '@/use-toast'
import { api } from '@/api'

type ColumnMappingType = 'literal' | 'reference'

export default defineComponent({
  name: 'ColumnMappingCreateView',
  components: { RadioButton, SidePane, LiteralColumnMappingForm, ReferenceColumnMappingForm },

  data (): { columnMappingType: ColumnMappingType, isSubmitting: boolean, error: ErrorDetails | null } {
    return {
      columnMappingType: 'literal',
      isSubmitting: false,
      error: null,
    }
  },

  computed: {
    ...mapGetters('project', {
      findTable: 'findTable',
      getSource: 'getSource',
    }),

    table (): Table {
      const tableId = this.$route.params.tableId
      return this.findTable(tableId)
    },

    source (): CsvSource {
      const source = this.table.csvSource && this.getSource(this.table.csvSource.id)

      if (!source) throw new Error('Source not found')

      return source
    },

    operation (): RuntimeOperation | null {
      return this.columnMappingType === 'literal'
        ? this.table?.actions.createLiteralColumnMapping ?? null
        : this.table?.actions.createReferenceColumnMapping ?? null
    },

    title (): string {
      return this.operation?.title ?? '...'
    },
  },

  methods: {
    async onSubmit (arg: GraphPointer<ResourceIdentifier> | CustomEvent): Promise<void> {
      const resource = 'dataset' in arg ? arg : arg.detail.value

      this.error = null
      this.isSubmitting = true

      try {
        const columnMapping = await api.invokeSaveOperation(this.operation, resource)

        this.$store.commit('project/storeNewColumnMapping', { table: this.table, columnMapping })

        displayToast({
          message: 'Column mapping was successfully created',
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

  watch: {
    columnMappingType () {
      this.error = null
    }
  },
})
</script>
