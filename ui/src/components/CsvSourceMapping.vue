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
        <div
          v-for="column in source.columns"
          :key="column.id.value"
          class="source-column panel-block"
        >
          <b-checkbox v-model="selectedColumns" :native-value="column.id.value">
            {{ column.title }}
            <span class="has-text-grey"> ({{ column.data.join(", ") }}) </span>
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
import { Source } from '@/types'

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
