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
          class="panel-block"
        >
          <b-checkbox v-model="selectedColumns" :native-value="column.id.value">
            {{ column.title }}
            <span class="has-text-grey"> ({{ column.data.join(", ") }}) </span>
          </b-checkbox>
          <div class="column-mapped-attributes">
            <b-tooltip
              v-for="attribute in getMappedAttributes(column)"
              :key="attribute.uri"
              class="column-mapped-attribute"
              :style="{ 'background-color': attribute.table.color }"
              :label="getLabel(attribute.table) + ' -> ' + getLabel(attribute)"
              type="is-light"
              :delay="200"
              size="is-small"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="column is-1"></div>
    <div class="column"></div>
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
})
</script>
