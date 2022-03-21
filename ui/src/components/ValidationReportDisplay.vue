<template>
  <ul>
    <validation-result-display
      tag="li"
      v-for="result in report.result"
      :key="result.clientPath"
      :result="result"
    />
  </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ValidationReport } from '@rdfine/shacl'
import ValidationResultDisplay from './ValidationResultDisplay.vue'

export default defineComponent({
  name: 'ValidationReportDisplay',
  components: { ValidationResultDisplay },
  props: {
    report: {
      type: Object as PropType<ValidationReport>,
      required: true,
    },
  },
})
</script>
