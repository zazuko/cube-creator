<template>
  <form @submit.prevent="$emit('submit', value)">
    <div v-if="!shape || !resource">
      <loading-block />
    </div>
    <div v-else>
      <cc-form :resource="value" :shapes="shapePointer" no-editor-switches />

      <hydra-operation-error :error="error" :shape="shape" class="mt-4" />

      <form-submit-cancel
        :submit-label="_submitLabel"
        :is-submitting="isSubmitting"
        :show-cancel="showCancel"
        :submit-button-variant="submitButtonVariant"
        :disabled="!shape"
        @cancel="$emit('cancel')"
      />
    </div>
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
      type: Object as PropType<GraphPointer | null>,
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

  data (): { value?: GraphPointer | null; shapePointer?: GraphPointer } {
    return {
      value: null,
      shapePointer: undefined
    }
  },

  mounted () {
    const { resource } = this

    this.value = this.clone(resource)
  },

  watch: {
    shape (shape) {
      if (!this.shapePointer) {
        this.shapePointer = Object.freeze(shape?.pointer)
      }
    },
    resource (resource) {
      this.value = this.clone(resource)
    }
  },

  computed: {
    _submitLabel (): string {
      return this.submitLabel ?? this.operation.title ?? 'Save'
    },
  },

  methods: {
    clone (resource: GraphPointer | undefined | null) {
      if (!resource) {
        return null
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
  },
})
</script>
