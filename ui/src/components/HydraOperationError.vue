<template>
  <b-message v-if="error" type="is-danger" :title="error.title" class="error-message">
    <p v-if="error.detail && !error.report">
      {{ error.detail }}
    </p>
    <ul v-if="error.report">
      <hydra-operation-error-result
        v-for="(result, resultIndex) in error.report"
        :key="resultIndex"
        :result="result"
        :shape="shape"
      />
    </ul>
  </b-message>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import type { Shape } from '@rdfine/shacl'
import { ErrorDetails } from '@/api/errors'
import BMessage from './BMessage.vue'
import HydraOperationErrorResult from './HydraOperationErrorResult.vue'

export default defineComponent({
  name: 'HydraOperationError',
  components: { BMessage, HydraOperationErrorResult },
  props: {
    error: {
      type: Object as PropType<ErrorDetails | null>,
      default: null,
    },
    shape: {
      type: Object as PropType<Shape | null>,
      default: null,
    },
  },
})
</script>
