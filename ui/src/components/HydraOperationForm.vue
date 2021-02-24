<template>
  <form @submit.prevent="$emit('submit')">
    <cc-form :resource.prop="resource" :shapes.prop="shapePointer" no-editor-switches />

    <loading-block v-if="!shape" />

    <hydra-operation-error :error="error" :shape="shape" class="mt-4" />

    <form-submit-cancel
      :submit-label="_submitLabel"
      :is-submitting="isSubmitting"
      :show-cancel="showCancel"
      :disabled="!shape"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import FormSubmitCancel from './FormSubmitCancel.vue'
import HydraOperationError from './HydraOperationError.vue'
import { ErrorDetails } from '@/api/errors'
import LoadingBlock from './LoadingBlock.vue'

@Component({
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock },
})
export default class HydraOperationButton extends Vue {
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ required: true }) resource!: GraphPointer
  @Prop({ required: true }) shape!: Shape | null
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() showCancel?: boolean
  @Prop() submitLabel?: string

  get shapePointer (): GraphPointer | null {
    return this.shape?.pointer ?? null
  }

  get _submitLabel (): string {
    return this.submitLabel ?? this.operation.title ?? 'Save'
  }
}
</script>

<style scoped>
.error-message ul {
  list-style: disc;
  padding-left: 1rem;
}
</style>
