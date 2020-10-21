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
              <div class="level-item">
                <b-tooltip v-if="source.actions.delete" :label="source.actions.delete.title">
                  <b-button icon-left="trash" @click="deleteSource(source)" type="is-text" />
                </b-tooltip>
              </div>
            </div>
            <div class="level-right">
              <b-button
                :disabled="selectedColumns.length === 0"
                tag="router-link"
                :to="{ name: 'TableCreate', query: createTableQueryParams }"
                size="is-small"
                icon-left="plus"
              >
                Create table from selected columns
              </b-button>
            </div>
          </div>
        </div>
        <b-message v-if="source.error" type="is-danger" class="content">
          <p>An error occurred while parsing the CSV file:</p>
          <pre>{{ source.error }}</pre>
          <p v-if="source.actions.delete">
            Fix your file, <a @click="deleteSource(source)">delete this one</a> and upload your file again.
          </p>
        </b-message>
        <div
          v-for="column in source.columns"
          :key="column.id.value"
          class="source-column panel-block"
        >
          <b-checkbox v-model="selectedColumns" :native-value="column">
            {{ column.name }}
            <span class="has-text-grey" v-if="column.sampleValues.length > 0">
              &nbsp;({{ column.sampleValues.slice(0, 3).join(", ") }})
            </span>
          </b-checkbox>
          <div>
            <b-tooltip
              v-for="columnMapping in getColumnMappings(column)"
              :key="columnMapping.id.value"
              class="source-column-mapping"
              :style="{ 'background-color': columnMapping.table.color }"
              :label="columnMapping.table.title + ' -> ' + columnMapping.title"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="column is-1" />
    <div class="column">
      <div v-for="table in sourceTables" :key="table.id.value">
        {{ table.toJSON() }}
      </div>
      <div v-if="isFirstSource && sourceTables.length === 0" class="content">
        <p>You haven't mapped any table yet.</p>
        <p>The first step is to define which columns of your CSV will be dimensions of your cube:</p>
        <ol>
          <li>Select columns that will be dimensions of your cube on the CSV file (left column)</li>
          <li>Click "Create table from selected columns"</li>
          <li>Select the type "Observation table" in the form. The Observation table represents the structure of your cube.</li>
          <li>After submitting the form, you should already be able to see a first version of your cube in the "Cube Preview" (bottom of the screen).</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Source, Table, TableCollection } from '../types'

export default Vue.extend({
  name: 'CsvSourceMapping',

  props: {
    isFirstSource: { type: Boolean, default: false },
    source: { type: Object as () => Source, required: true },
    tables: { type: Array as () => Table[], required: true },
    tableCollection: { type: Object as () => TableCollection, required: true },
  },

  data () {
    return {
      selectedColumns: [],
    }
  },

  computed: {
    sourceTables () {
      return this.tables.filter(({ source }) => source.id.equals(this.source.id))
    },

    createTableQueryParams () {
      return {
        source: this.source.clientPath,
        columns: this.selectedColumns
          .map(({ clientPath }) => clientPath)
          .join(',')
      }
    },
  },

  methods: {
    getColumnMappings () {
      return []
    },

    async deleteSource (source: Source): Promise<void> {
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
            callbackAction: 'cubeProjects/refreshSourcesCollection',
          })
        },
      })
    },
  },
})
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
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 0.6rem;
}

.source-column-mapping:not(:last-child) {
  margin-right: 0.15rem;
}
</style>
