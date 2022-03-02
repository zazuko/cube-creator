<template>
  <form @submit.prevent="$emit('submit', clone)">
    <cc-form :resource.prop="clone" :shapes.prop="shapePointer" no-editor-switches />

    <loading-block v-if="!shape" />

    <hydra-operation-error :error="error" :shape="shape" class="mt-4" />

    <form-submit-cancel
      :submit-label="_submitLabel"
      :is-submitting="isSubmitting"
      :show-cancel="showCancel"
      :submit-button-variant="submitButtonVariant"
      :disabled="!shape"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import FormSubmitCancel from './FormSubmitCancel.vue'
import HydraOperationError from './HydraOperationError.vue'
import { ErrorDetails } from '@/api/errors'
import LoadingBlock from './LoadingBlock.vue'

@Component({
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock },
})
export default class HydraOperationForm extends Vue {
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ required: true }) resource!: GraphPointer
  @Prop({ required: true }) shape!: Shape | null
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() showCancel?: boolean
  @Prop() submitLabel?: string
  @Prop() submitButtonVariant?: string

  __clone: GraphPointer | null = null

  @Watch('resource')
  private resourceChanged (newResource: GraphPointer, oldResource: GraphPointer) {
    if (newResource !== oldResource) {
      this.__clone = null
    }
  }

  get clone (): GraphPointer | null {
    const { __clone, resource } = this

    if (__clone) {
      return __clone
    }

    if (!resource) {
      return resource
    }

    const { graph } = resource._context[0]

    const clone = $rdf.dataset([
      ...resource.dataset.match(null, null, null, graph)
    ])

    return clownface({
      dataset: clone,
      term: resource.term,
      graph,
    })
  }

  get shapePointer (): GraphPointer | null {
    return this.shape?.pointer ?? null
  }

  get _submitLabel (): string {
    return this.submitLabel ?? this.operation.title ?? 'Save'
  }
}
</script>
