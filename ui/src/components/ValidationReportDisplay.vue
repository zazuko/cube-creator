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
import { ValidationReport } from '@rdfine/shacl'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ValidationResultDisplay from './ValidationResultDisplay.vue'

@Component({
  components: { ValidationResultDisplay },
})
export default class ValidationReportDisplay extends Vue {
  @Prop({ required: true }) report!: ValidationReport
}
</script>
