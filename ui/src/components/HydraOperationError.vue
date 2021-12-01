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
import { Vue, Component, Prop } from 'vue-property-decorator'
import type { Shape } from '@rdfine/shacl'
import { ErrorDetails } from '@/api/errors'
import HydraOperationErrorResult from './HydraOperationErrorResult.vue'

@Component({
  components: { HydraOperationErrorResult },
})
export default class extends Vue {
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: null }) shape!: Shape | null
}
</script>
