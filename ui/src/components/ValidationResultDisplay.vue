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
import { defineComponent, PropType } from 'vue'
import { ValidationResult } from '@rdfine/shacl'
import PropertyDisplay from './PropertyDisplay.vue'

export default defineComponent({
  name: 'ValidationResultDisplay',
  components: { PropertyDisplay },
  props: {
    result: {
      type: Object as PropType<ValidationResult>,
      required: true,
    },
  },
})
</script>
