<template>
  <form @submit.prevent="$emit('submit')">
    <b-message v-if="error" type="is-danger" :title="error.title" class="error-message">
      <p v-if="error.detail">
        {{ error.detail }}
      </p>
      <ul v-if="error.report">
        <li v-for="(reportError, reportIndex) in error.report" :key="reportIndex">
          {{ shrink(reportError.path) }}
          <ul>
            <li v-for="(message, messageIndex) in reportError.message" :key="messageIndex">
              {{ message }}
            </li>
          </ul>
        </li>
      </ul>
    </b-message>

    <cc-form :resource.prop="resource" :shapes.prop="shapePointer" no-editor-switches />

    <form-submit-cancel
      :submit-label="_submitLabel"
      :is-submitting="isSubmitting"
      :show-cancel="showCancel"
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
import { ErrorDetails } from '@/api/errors'

@Component({
  components: { FormSubmitCancel },
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

  shrink (uri: string): string {
    return uri.split('#').slice(-1)[0]
  }
}
</script>

<style scoped>
.error-message ul {
  list-style: disc;
  padding-left: 1rem;
}
</style>
