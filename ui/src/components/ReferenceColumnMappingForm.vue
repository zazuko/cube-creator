<template>
  <form @submit.prevent="onSubmit">
    <hydra-operation-error :error="error" />

    <b-field label="Link to table">
      <b-select v-model="data.referencedTable" placeholder="Select a table">
        <option v-for="table in tables" :key="table.clientPath" :value="table">
          {{ table.name }}
        </option>
      </b-select>
    </b-field>

    <b-field label="Using the property">
      <property-input :value="data.targetProperty" :update="(value) => data.targetProperty = value" />
    </b-field>

    <b-field v-if="data.referencedTable" label="Identifier mapping" :addons="false">
      <div v-if="data.identifierMapping">
        <p v-if="data.identifierMapping">
          The identifier <code>{{ data.referencedTable.identifierTemplate }}</code> will take
          its values from the column{{ data.identifierMapping.length === 1 ? '' : 's' }}
        </p>
        <table class="table columns-table">
          <tbody>
            <tr v-for="mapping in data.identifierMapping" :key="mapping.referencedColumn.id.value">
              <td>
                <b-select v-model="mapping.sourceColumnId">
                  <option v-for="column in source.columns" :key="column.clientPath" :value="column.id.value">
                    {{ column.name }}
                  </option>
                </b-select>
              </td>
              <td>for <code>{{ '{' + getColumn(data.referencedTable.id, mapping.referencedColumn.id).name + '}' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <loading-block v-else />
    </b-field>

    <form-submit-cancel
      :submit-label="operation.title"
      :is-submitting="isSubmitting"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import clownface from 'clownface'
import { rdf } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdf-esm/dataset'
import { Term } from 'rdf-js'
import slugify from 'slugify'
import { ReferenceColumnMapping, CsvColumn, CsvSource, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationError from '@/components/HydraOperationError.vue'
import PropertyInput from '@/forms/PropertyInput.vue'
import { ErrorDetails } from '@/api/errors'
import { Link } from '@cube-creator/model/lib/Link'

const projectNS = namespace('project')

interface FormData {
  targetProperty: Term | null
  referencedTable: Table | null
  identifierMapping: null | {
    sourceColumnId: string | null
    referencedColumn: Link<CsvColumn>
  }[]
}

@Component({
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock, PropertyInput },
})
export default class extends Vue {
  @Prop({ required: true }) table!: Table
  @Prop({ required: true }) source!: CsvSource
  @Prop({ default: null }) columnMapping!: ReferenceColumnMapping
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean

  @projectNS.Getter('findTable') findTable!: (id: string) => Table
  @projectNS.Getter('getTable') getTable!: (id: Term) => Table
  @projectNS.Getter('getSource') getSource!: (id: Term) => CsvSource
  @projectNS.Getter('tables') tables!: Table[]

  data: FormData = {
    targetProperty: null,
    referencedTable: null,
    identifierMapping: null,
  }

  mounted (): void {
    if (this.columnMapping) {
      const referencedTable = this.getTable(this.columnMapping.referencedTable.id)

      this.data = {
        targetProperty: this.columnMapping.targetProperty,
        referencedTable,
        identifierMapping: this.columnMapping.identifierMapping.map((identifierMapping) => ({
          sourceColumnId: identifierMapping.sourceColumn.id.value,
          referencedColumn: identifierMapping.referencedColumn,
        })),
      }
    }

    // Setup watchers only after form data is populated
    this.$watch('data.referencedTable', this.populatePredicate)
    this.$watch('data.referencedTable', this.populateColumnMapping)
  }

  getColumn (tableId: Term, columnId: Term): CsvColumn {
    const table = this.getTable(tableId)
    if (!table.csvSource) throw new Error('Table does not have source')

    const source = this.getSource(table.csvSource.id)
    const column = source.columns.find(({ id }) => id.equals(columnId))

    if (!column) throw new Error(`Column not found: ${columnId}`)

    return column
  }

  populatePredicate (table: Table | null): void {
    if (!table) return

    if (!this.data.targetProperty) {
      this.data.targetProperty = $rdf.literal(slugify(table.name, { lower: true }))
    }
  }

  populateColumnMapping (table: Table | null): void {
    if (!table) return

    const partialReferencedSource = table.csvSource
    if (!partialReferencedSource) throw new Error('Table has no source')
    const referencedSource = this.getSource(partialReferencedSource.id)

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
  }

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

    this.$emit('submit', resource)
  }
}

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
