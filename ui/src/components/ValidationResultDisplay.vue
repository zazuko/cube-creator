<template>
  <li>
    <strong>{{ property }}:</strong>&nbsp;
    <span>{{ result.resultMessage }}</span>
    <ul v-if="result.detail && result.detail.length > 0" class="pl-4">
      <validation-result-display
        v-for="(detail, detailIndex) in result.detail"
        :key="detailIndex"
        :result="detail"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { ValidationResult } from '@rdfine/shacl'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({
  // Define `name` to allow recursive call
  name: 'validation-result-display',
})
export default class ValidationResultDisplay extends Vue {
  @Prop({ required: true }) result!: ValidationResult

  get property (): string | undefined {
    return this.result.resultPath?.id.value
  }
}
</script>
