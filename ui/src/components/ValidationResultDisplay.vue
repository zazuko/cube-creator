<template>
  <li class="mb-2">
    <property-display v-if="result.resultPath" :term="result.resultPath.id" class="has-text-weight-semibold" />
    <p v-else-if="result.sourceConstraintComponent">
      <span class="has-text-weight-semibold">Constraint: </span>
      <property-display :term="result.sourceConstraintComponent.id" />
    </p>
    <p v-if="result.resultMessage">
      {{ result.resultMessage }}
    </p>
    <ul v-if="result.detail && result.detail.length > 0" class="mt-2 pl-5">
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
import PropertyDisplay from './PropertyDisplay.vue'

@Component({
  // Define `name` to allow recursive call
  name: 'validation-result-display',
  components: { PropertyDisplay },
})
export default class ValidationResultDisplay extends Vue {
  @Prop({ required: true }) result!: ValidationResult
}
</script>
