<template>
  <div class="source-mapping columns">
    <div class="column is-6">
      <div class="source panel">
        <div class="panel-heading is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-wrap">
          <h4 class="has-text-weight-bold">
            {{ source.name }}
          </h4>
          <div class="is-flex gap-1">
            <o-button
              v-if="tableCollection.actions.create"
              :disabled="selectedColumns.length === 0"
              tag="router-link"
              :to="{ name: 'TableCreate', query: createTableQueryParams }"
              size="small"
              icon-left="plus"
            >
              Create table from selected columns
            </o-button>
            <o-dropdown position="bottom-left" class="has-text-weight-normal" aria-role="list">
              <template #trigger>
                <button class="button is-text is-small">
                  <o-icon icon="ellipsis-h" />
                </button>
              </template>
              <o-dropdown-item tag="div" item-class="p" clickable v-if="source.actions.edit">
                <router-link class="dropdown-item" :to="{ name: 'SourceEdit', params: { sourceId: source.clientPath } }">
                  <o-icon icon="pencil-alt" />
                  {{ source.actions.edit.title }}
                </router-link>
              </o-dropdown-item>
              <o-dropdown-item tag="div" item-class="p" v-if="source.actions.replace">
                <router-link class="dropdown-item" :to="{ name: 'SourceReplaceCSV', params: { sourceId: source.clientPath } }">
                  <o-icon icon="upload" />
                  {{ source.actions.replace.title }}
                </router-link>
              </o-dropdown-item>
              <o-dropdown-item v-if="source.actions.download" @click="downloadSource(source)">
                <o-icon icon="download" />
                {{ source.actions.download.title }}
              </o-dropdown-item>
              <o-dropdown-item v-if="source.actions.delete" @click="deleteSource(source)">
                <o-icon icon="trash" />
                {{ source.actions.delete.title }}
              </o-dropdown-item>
            </o-dropdown>
          </div>
        </div>
        <b-message v-if="source.errorMessages.length" type="is-danger" class="content mb-0">
          <p>An error occurred while parsing the CSV file:</p>
          <pre v-for="error in source.errorMessages" :key="error">{{ error }}</pre>
          <div class="content" v-if="source.actions.delete || source.actions.edit">
            <p>To fix the issue, you can:</p>
            <ul>
              <li v-if="source.actions.edit">
                <router-link :to="{ name: 'SourceEdit', params: { sourceId: source.clientPath } }">
                  Adjust the CSV settings
                </router-link>
              </li>
              <li v-if="source.actions.replace">
                <router-link :to="{ name: 'SourceReplaceCSV', params: { sourceId: source.clientPath } }">
                  Replace this file with a valid one
                </router-link>
              </li>
              <li v-if="source.actions.delete">
                <a @click="deleteSource(source)">Delete this file</a>, fix it and upload it again
              </li>
            </ul>
          </div>
        </b-message>
        <div
          v-for="column in source.columns"
          :key="column.id.value"
          class="panel-block is-flex is-justify-content-space-between"
          @mouseenter="highlightArrows(column)"
          @mouseleave="unhighlightArrows(column)"
        >
          <o-checkbox
            :model-value="selectedColumnsMap[column.clientPath]"
            @update:modelValue="selectedColumnsMap[column.clientPath] = $event"
            class="source-column-name"
          >
            {{ column.name }}
            <span class="has-text-grey" v-if="column.samples.length > 0">
              &nbsp;({{ column.samples.slice(0, 3).join(", ") }})
            </span>
          </o-checkbox>
          <div>
            <o-tooltip
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
    <div class="column is-5">
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
          <li>Select the type "Cube table" in the form. The Cube table represents the structure of your cube.</li>
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
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'
import { CsvSource, Table, TableCollection, CsvColumn, ColumnMapping } from '@cube-creator/model'
import { isLiteralColumnMapping } from '@cube-creator/model/ColumnMapping'
import BMessage from './BMessage.vue'
import MapperTable from './MapperTable.vue'
import { api } from '../api'
import { confirmDialog } from '../use-dialog'

export default defineComponent({
  name: 'CsvSourceMapping',
  components: { BMessage, MapperTable },
  props: {
    isFirstSource: {
      type: Boolean,
      default: false,
    },
    source: {
      type: Object as PropType<CsvSource>,
      required: true,
    },
    tables: {
      type: Array as PropType<Table[]>,
      required: true,
    },
    tableCollection: {
      type: Object as PropType<TableCollection>,
      required: true,
    }
  },
  emits: ['highlight-arrows', 'unhighlight-arrows'],

  data () {
    const selectedColumnsMap = prepareSelectedColumnsMap(this.source)

    return {
      selectedColumnsMap,
    }
  },

  computed: {
    ...mapGetters({
      getSourceTables: 'project/getSourceTables',
    }),

    selectedColumns (): string[] {
      return Object.entries(this.selectedColumnsMap)
        .filter(([, isSelected]) => isSelected)
        .map(([columnId]) => columnId)
    },

    sourceTables (): Table[] {
      return this.getSourceTables(this.source)
    },

    createTableQueryParams (): Record<string, string | string[]> {
      return {
        source: this.source.clientPath,
        columns: this.selectedColumns,
      }
    },
  },

  watch: {
    $route (): void {
      this.selectedColumnsMap = prepareSelectedColumnsMap(this.source)
    }
  },

  methods: {

    getColumnMappings (column: CsvColumn): {table: Table; columnMapping: ColumnMapping}[] {
      return this.tables
        .map((table) => {
          return (table.columnMappings)
            .filter((columnMapping) => isLiteralColumnMapping(columnMapping) && column.id.equals(columnMapping.sourceColumn.id))
            .map((columnMapping) => ({ table, columnMapping }))
        })
        .flat()
    },

    async deleteSource (source: CsvSource): Promise<void> {
      confirmDialog({
        title: source.actions.delete?.title,
        message: 'Are you sure you want to delete this CSV source?',
        confirmText: 'Delete',
        onConfirm: () => {
          this.$store.dispatch('api/invokeDeleteOperation', {
            operation: source.actions.delete,
            successMessage: 'CSV source deleted successfully',
            callbackAction: 'project/refreshSourcesCollection',
          })
        },
      })
    },

    async downloadSource (source: CsvSource): Promise<void> {
      const headers = { accept: 'text/csv' }
      const response = await api.invokeDownloadOperation(source.actions.download, headers)
      const downloadLink = response.xhr.headers.get('Location')

      if (downloadLink) {
        window.open(downloadLink)
      }
    },

    highlightArrows (column: CsvColumn): void {
      const ids = this.getColumnMappings(column).map(({ columnMapping }) => columnMapping.id.value)
      this.$emit('highlight-arrows', ids)
    },

    unhighlightArrows (column: CsvColumn): void {
      const ids = this.getColumnMappings(column).map(({ columnMapping }) => columnMapping.id.value)
      this.$emit('unhighlight-arrows', ids)
    },
  },
})

function prepareSelectedColumnsMap (source: CsvSource): Record<string, boolean> {
  return source.columns
    .reduce((acc, { clientPath }) => ({ ...acc, [clientPath]: false }), {})
}
</script>

<style scoped>
.source-mapping:not(:last-child) {
  margin-bottom: 2rem;
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

.source-column-name {
  word-break: break-word;
}
</style>
