<template>
  <form @submit.prevent="$emit('submit', clone)">
    <cc-form :resource="clone" :shapes="shapePointer" no-editor-switches />

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
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { defineComponent, PropType } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import FormSubmitCancel from './FormSubmitCancel.vue'
import HydraOperationError from './HydraOperationError.vue'
import { ErrorDetails } from '@/api/errors'
import LoadingBlock from './LoadingBlock.vue'

export default defineComponent({
  name: 'HydraOperationForm',
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock },
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    resource: {
      type: Object as PropType<GraphPointer>,
      default: null,
    },
    shape: {
      type: Object as PropType<Shape | null>,
      default: null,
    },
    error: {
      type: Object as PropType<ErrorDetails | null>,
      default: null,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    showCancel: {
      type: Boolean,
      default: false,
    },
    submitLabel: {
      type: String,
      default: undefined,
    },
    submitButtonVariant: {
      type: String as PropType<ColorsModifiers>,
      default: undefined,
    },
  },
  emits: ['submit', 'cancel'],

  data (): { __clone: GraphPointer | null } {
    return {
      // eslint-disable-next-line vue/no-reserved-keys
      __clone: null,
    }
  },

  computed: {
    clone (): GraphPointer | null {
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
    },

    shapePointer (): GraphPointer | null {
      return this.shape?.pointer ?? null
    },

    _submitLabel (): string {
      return this.submitLabel ?? this.operation.title ?? 'Save'
    },
  },

  watch: {
    resource (newResource: GraphPointer, oldResource: GraphPointer) {
      if (newResource !== oldResource) {
        this.__clone = null
      }
    },
  },
})
</script>
