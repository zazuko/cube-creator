<template>
  <div class="source-mapping columns">
    <div class="column">
      <div class="source panel">
        <div class="panel-heading">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                {{ source.name }}
              </div>
            </div>
            <div class="level-right">
              <b-button
                v-if="tableCollection.actions.create"
                :disabled="selectedColumns.length === 0"
                tag="router-link"
                :to="{ name: 'TableCreate', query: createTableQueryParams }"
                size="is-small"
                icon-left="plus"
              >
                Create table from selected columns
              </b-button>
              <div class="level-item">
                <b-dropdown position="is-bottom-left">
                  <button class="button is-text is-small" slot="trigger">
                    <b-icon icon="ellipsis-h" />
                  </button>
                  <b-dropdown-item v-if="source.actions.edit" has-link>
                    <router-link :to="{ name: 'SourceEdit', params: { sourceId: source.clientPath } }">
                      <b-icon icon="pencil-alt" />
                      {{ source.actions.edit.title }}
                    </router-link>
                  </b-dropdown-item>
                  <b-dropdown-item v-if="source.actions.replace" has-link>
                    <router-link :to="{ name: 'SourceReplaceCSV', params: { sourceId: source.clientPath } }">
                      <b-icon icon="upload" />
                      {{ source.actions.replace.title }}
                    </router-link>
                  </b-dropdown-item>
                  <b-dropdown-item v-if="source.actions.download" @click="downloadSource(source)">
                    <b-icon icon="download" />
                    {{ source.actions.download.title }}
                  </b-dropdown-item>
                  <b-dropdown-item v-if="source.actions.delete" @click="deleteSource(source)">
                    <b-icon icon="trash" />
                    {{ source.actions.delete.title }}
                  </b-dropdown-item>
                </b-dropdown>
              </div>
            </div>
          </div>
        </div>
        <b-message v-if="source.error" type="is-danger" class="content">
          <p>An error occurred while parsing the CSV file:</p>
          <pre>{{ source.error }}</pre>
          <div class="content" v-if="source.actions.delete || source.actions.edit">
            <p>To fix the issue, you can:</p>
            <ul>
              <li v-if="source.actions.edit">
                <router-link :to="{ name: 'SourceEdit', params: { sourceId: source.clientPath }}">
                  Adjust the CSV settings
                </router-link>
              </li>
              <li>or</li>
              <li v-if="source.actions.delete">
                <a @click="deleteSource(source)">Delete this file</a>, fix it and upload it again
              </li>
            </ul>
          </div>
        </b-message>
        <div
          v-for="column in source.columns"
          :key="column.id.value"
          class="source-column panel-block"
          @mouseenter="highlightArrows(column)"
          @mouseleave="unhighlightArrows(column)"
        >
          <b-checkbox :value="selectedColumnsMap[column.clientPath]" @input="selectedColumnsMap[column.clientPath] = $event">
            {{ column.name }}
            <span class="has-text-grey" v-if="column.samples.length > 0">
              &nbsp;({{ column.samples.slice(0, 3).join(", ") }})
            </span>
          </b-checkbox>
          <div>
            <b-tooltip
              v-for="{table, columnMapping} in getColumnMappings(column)"
              :key="columnMapping.id.value"
              class="source-column-mapping"
              :style="{ 'background-color': table.color }"
              :label="table.name + ' / ' + columnMapping.targetProperty.value"
              :data-arrow-target="columnMapping.id.value"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="column is-1" />
    <div class="column">
      <mapper-table
        v-for="table in sourceTables"
        :key="table.id.value"
        :table="table"
        @highlight-arrows="$emit('highlight-arrows', $event)"
        @unhighlight-arrows="$emit('unhighlight-arrows', $event)"
      />
      <div v-if="isFirstSource && tables.length === 0" class="content">
        <p>You haven't mapped any tables yet.</p>
        <p>The first step is to define which columns of your CSV will be dimensions of your cube:</p>
        <ol>
          <li>Select columns that will be dimensions of your cube on the CSV file (left column)</li>
          <li>Click "Create table from selected columns"</li>
          <li>Select the type "Observation table" in the form. The Observation table represents the structure of your cube.</li>
          <li>After submitting the form, you should already be able to see a first version of your cube in the "Cube Preview" (bottom of the screen).</li>
        </ol>
      </div>
      <div v-else-if="sourceTables.length === 0">
        <p>
          No tables mapped from this CSV file yet
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue, Watch } from 'vue-property-decorator'
import { CsvSource, Table, TableCollection, CsvColumn, ColumnMapping } from '@cube-creator/model'
import MapperTable from './MapperTable.vue'
import HydraOperationButton from './HydraOperationButton.vue'

@Component({
  components: {
    MapperTable,
    HydraOperationButton,
  },
})
export default class CsvSourceMapping extends Vue {
  @Prop({ default: false }) readonly isFirstSource!: boolean;
  @Prop() readonly source!: CsvSource;
  @Prop() readonly tables!: Table[];
  @Prop() readonly tableCollection!: TableCollection;

  selectedColumnsMap = this.prepareSelectedColumnsMap()

  get selectedColumns (): string[] {
    return Object.entries(this.selectedColumnsMap)
      .filter(([, isSelected]) => isSelected)
      .map(([columnId]) => columnId)
  }

  @Watch('$route')
  resetSelectedColumnsMap (): void {
    this.selectedColumnsMap = this.prepareSelectedColumnsMap()
  }

  prepareSelectedColumnsMap (): Record<string, boolean> {
    return this.source.columns
      .reduce((acc, { clientPath }) => ({ ...acc, [clientPath]: false }), {})
  }

  get sourceTables (): Table[] {
    return this.tables
      .filter(({ csvSource }) => csvSource?.id.equals(this.source.id))
      .sort(({ isObservationTable: o1 }, { isObservationTable: o2 }) => (o1 === o2) ? 0 : (o1 ? -1 : 1))
  }

  get createTableQueryParams (): Record<string, string | string[]> {
    return {
      source: this.source.clientPath,
      columns: this.selectedColumns,
    }
  }

  getColumnMappings (column: CsvColumn): {table: Table, columnMapping: ColumnMapping}[] {
    return this.tables
      .map((table) => {
        return (table.columnMappings as any[])
          .filter((columnMapping) => column.id.equals(columnMapping?.sourceColumn?.id))
          .map((columnMapping) => ({ table, columnMapping }))
      })
      .flat()
  }

  async deleteSource (source: CsvSource): Promise<void> {
    this.$buefy.dialog.confirm({
      title: source.actions.delete?.title,
      message: 'Are you sure you want to delete this CSV source?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: () => {
        this.$store.dispatch('api/invokeDeleteOperation', {
          operation: source.actions.delete,
          successMessage: 'CSV source deleted successfully',
          callbackAction: 'project/refreshSourcesCollection',
        })
      },
    })
  }

  async downloadSource (source: CsvSource): Promise<void> {
    const downloadLink = await this.$store.dispatch('project/downloadCSV', source)
  }

  highlightArrows (column: CsvColumn): void {
    const ids = this.getColumnMappings(column).map(({ columnMapping }) => columnMapping.id.value)
    this.$emit('highlight-arrows', ids)
  }

  unhighlightArrows (column: CsvColumn): void {
    const ids = this.getColumnMappings(column).map(({ columnMapping }) => columnMapping.id.value)
    this.$emit('unhighlight-arrows', ids)
  }
}
</script>

<style scoped>
.source-mapping:not(:last-child) {
  margin-bottom: 2rem;
}

.source-column {
  display: flex;
  justify-content: space-between;
}

.source-column-mapping {
  z-index: 10;
  width: 8px;
  height: 8px;
  border-radius: 8px;
}

.source-column-mapping:not(:last-child) {
  margin-right: 0.15rem;
}
</style>
