<template>
  <div class="source-mapping columns">
    <div class="column">
      <div class="source panel">
        <div class="panel-heading">
          <div class="level">
            <div class="level-left">
              {{ source.name }}
            </div>
            <div class="level-right">
              <b-button :disabled="selectedColumns.length === 0">
                Create resource from selected columns
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
          <b-checkbox v-model="selectedColumns" :native-value="column.id.value">
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
      -- The tables --
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Source } from '../types'

export default Vue.extend({
  name: 'CsvSourceMapping',

  props: {
    source: { type: Object as () => Source, required: true },
  },

  data () {
    return {
      selectedColumns: [],
    }
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
        onConfirm: async () => {
          const loading = this.$buefy.loading.open({})
          try {
            await this.$store.dispatch('cubeProjects/deleteSource', source)
          } finally {
            loading.close()
          }
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
