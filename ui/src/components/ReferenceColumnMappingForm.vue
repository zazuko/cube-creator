<template>
  <form @submit.prevent="onSubmit">
    <o-field label="Link to table">
      <o-select v-model="data.referencedTable" placeholder="Select a table">
        <option v-for="optionTable in tables" :key="optionTable.clientPath" :value="optionTable">
          {{ optionTable.name }}
        </option>
      </o-select>
    </o-field>

    <o-field label="Using the property">
      <property-input :value="data.targetProperty" :update="(value) => data.targetProperty = value" />
    </o-field>

    <o-field v-if="data.referencedTable" label="Identifier mapping" :addons="false">
      <div v-if="data.identifierMapping">
        <p v-if="data.identifierMapping">
          The identifier <code>{{ data.referencedTable.identifierTemplate }}</code> will take
          its values from the column{{ data.identifierMapping.length === 1 ? '' : 's' }}
        </p>
        <table class="table columns-table">
          <tbody>
            <tr v-for="mapping in data.identifierMapping" :key="mapping.referencedColumn.id.value">
              <td>
                <o-select v-model="mapping.sourceColumnId">
                  <option v-for="column in source.columns" :key="column.clientPath" :value="column.id.value">
                    {{ column.name }}
                  </option>
                </o-select>
              </td>
              <td>for <code>{{ '{' + getColumn(data.referencedTable.id, mapping.referencedColumn.id).name + '}' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <loading-block v-else />
    </o-field>

    <o-field label="Dimension type">
      <radio-buttons
        class="has-addons"
        :options="dimensionTypes"
        :model-value="data.dimensionType"
        :update:modelValue="(value) => data.dimensionType = value"
      />
    </o-field>

    <hydra-operation-error :error="error" class="mt-4" />

    <form-submit-cancel
      :submit-label="submitLabel"
      :is-submitting="isSubmitting"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import clownface, { AnyPointer } from 'clownface'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdf-esm/dataset'
import { Term } from 'rdf-js'
import slugify from 'slugify'
import { ReferenceColumnMapping, CsvColumn, CsvSource, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationError from '@/components/HydraOperationError.vue'
import PropertyInput from '@/forms/editors/PropertyInput.vue'
import RadioButtons from '@/forms/editors/RadioButtons.vue'
import { ErrorDetails } from '@/api/errors'
import { Link } from '@cube-creator/model/lib/Link'
import { api } from '@/api'
import { Shape } from '@rdfine/shacl'
import { mapGetters } from 'vuex'

interface FormData {
  targetProperty: Term | null
  referencedTable: Table | null
  identifierMapping: null | {
    sourceColumnId: string | null | undefined
    referencedColumn: Link<CsvColumn>
  }[]
  dimensionType?: Term | null
}

export default defineComponent({
  name: 'ReferenceColumnMappingForm',
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock, PropertyInput, RadioButtons },
  props: {
    table: {
      type: Object as PropType<Table>,
      required: true,
    },
    source: {
      type: Object as PropType<CsvSource>,
      required: true
    },
    columnMapping: {
      type: Object as PropType<ReferenceColumnMapping | null>,
      default: null,
    },
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    error: {
      type: Object as PropType<ErrorDetails | null>,
      default: null,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    submitLabel: {
      type: String,
      default: undefined,
    },
  },

  data (): { shape: Shape | null, data: FormData } {
    return {
      shape: null,
      data: {
        targetProperty: null,
        referencedTable: null,
        identifierMapping: null,
        dimensionType: null,
      },
    }
  },

  async mounted (): Promise<void> {
    if (this.columnMapping) {
      const referencedTable = this.getTable(this.columnMapping.referencedTable.id)

      this.data = {
        targetProperty: this.columnMapping.targetProperty,
        referencedTable,
        identifierMapping: this.columnMapping.identifierMapping.map((identifierMapping) => ({
          sourceColumnId: identifierMapping.sourceColumn?.id.value,
          referencedColumn: identifierMapping.referencedColumn,
        })),
        dimensionType: this.columnMapping.dimensionType,
      }
    }

    // Setup watchers only after form data is populated
    this.$watch('data.referencedTable', this.populatePredicate)
    this.$watch('data.referencedTable', this.populateColumnMapping)

    this.shape = await api.fetchOperationShape(this.operation)
  },

  computed: {
    ...mapGetters('project', {
      findTable: 'findTable',
      getTable: 'getTable',
      getSource: 'getSource',
      tables: 'tables',
    }),

    dimensionTypes (): AnyPointer {
      const emptyPointer = clownface({ dataset: $rdf.dataset() })

      if (!this.shape) return emptyPointer

      const nodes = this.shape.pointer.out(sh.property).has(sh.path, [cc.dimensionType]).out(sh.in).list()

      if (!nodes) return emptyPointer

      return this.shape.pointer.node(nodes)
    },
  },

  methods: {
    getColumn (tableId: Term, columnId: Term): CsvColumn {
      const table = this.getTable(tableId)
      if (!table.csvSource) throw new Error('Table does not have source')

      const source: CsvSource = this.getSource(table.csvSource.id)
      const column = source.columns.find(({ id }) => id.equals(columnId))

      if (!column) throw new Error(`Column not found: ${columnId}`)

      return column
    },

    populatePredicate (table: Table | null): void {
      if (!table) return

      if (!this.data.targetProperty) {
        this.data.targetProperty = $rdf.literal(slugify(table.name, { lower: true }))
      }
    },

    populateColumnMapping (table: Table | null): void {
      if (!table) return

      const partialReferencedSource = table.csvSource
      if (!partialReferencedSource) throw new Error('Table has no source')
      const referencedSource: CsvSource = this.getSource(partialReferencedSource.id)

      // TODO: Get from API
      const template = table.identifierTemplate
      const matches = template.match(/\{[^{}]*\}/g) || []
      const identifierColumns = matches
        .map((columnNameWithBrackets) => {
          const columnName = columnNameWithBrackets.replace('{', '').replace('}', '')
          return referencedSource.columns.find(({ name }) => name === columnName)
        })
        .filter((column): column is CsvColumn => !!column)

      this.data.identifierMapping = identifierColumns.map((column) => ({
        sourceColumnId: guessMappedColumn(column, referencedSource, this.source),
        referencedColumn: column,
      }))
    },

    onSubmit (): void {
      const data = this.data

      const id = this.columnMapping?.id ?? $rdf.namedNode('')
      const resource = clownface({ dataset: $rdf.dataset() })
        .node(id)
        .addOut(rdf.type, cc.ReferenceColumnMapping)

      if (data.targetProperty) {
        resource.addOut(cc.targetProperty, data.targetProperty)
      }

      if (data.referencedTable) {
        resource.addOut(cc.referencedTable, data.referencedTable.id)
      }

      if (data.identifierMapping) {
        data.identifierMapping.forEach(({ sourceColumnId, referencedColumn }) => {
          resource.addOut(cc.identifierMapping, $rdf.blankNode(), (identifierMapping) => {
            identifierMapping.addOut(cc.referencedColumn, referencedColumn.id)

            if (sourceColumnId) {
              identifierMapping.addOut(cc.sourceColumn, $rdf.namedNode(sourceColumnId))
            }
          })
        })
      }

      if (data.dimensionType) {
        resource.addOut(cc.dimensionType, data.dimensionType)
      }

      this.$emit('submit', resource)
    },
  },
})

function guessMappedColumn (referencedColumn: CsvColumn, referencedSource: CsvSource, tableSource: CsvSource): string | null {
  if (tableSource.clientPath === referencedSource.clientPath) {
    return referencedColumn.id.value
  } else {
    const guess = tableSource.columns.find((c) => c.name === referencedColumn.name)
    return guess?.id.value ?? null
  }
}
</script>

<style scoped>
.columns-table > tbody > tr > td {
  padding: 0;
}

.columns-table > tbody > tr > td:first-child {
  padding-right: 0.4em;
}

.columns-table > tbody > tr > td:last-child {
  line-height: 2em;
}
</style>
