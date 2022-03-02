<template>
  <div v-if="isRawMode">
    <hydra-raw-rdf-form
      ref="rdfEditor"
      :operation="operation"
      :resource="internalResource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      :submit-label="submitLabel"
      :show-cancel="showCancel"
      @submit="$emit('submit', $event)"
      @cancel="$emit('cancel', $event)"
    />
    <div class="mt-4 has-text-right">
      <o-button @click="toggleMode" icon-left="chevron-left">
        Back to form (basic)
      </o-button>
    </div>
  </div>
  <div v-else>
    <hydra-operation-form
      ref="form"
      :operation="operation"
      :resource="internalResource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      :submit-label="submitLabel"
      :show-cancel="showCancel"
      @submit="$emit('submit', $event)"
      @cancel="$emit('cancel', $event)"
    />
    <div class="mt-4 has-text-right">
      <o-button icon-right="exclamation-triangle" @click="toggleMode" variant="text">
        Edit raw RDF (advanced)
      </o-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import HydraRawRdfForm from '@/components/HydraRawRdfForm.vue'
import clownface, { GraphPointer } from 'clownface'
import $rdf from '@rdf-esm/dataset'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { ErrorDetails } from '@/api/errors'

export default defineComponent({
  name: 'HydraOperationFormWithRaw',
  components: { HydraOperationForm, HydraRawRdfForm },
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    resource: {
      type: Object as PropType<GraphPointer>,
      required: true,
    },
    shape: {
      type: Object as PropType<Shape | null>,
      required: true,
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
  },

  data (): { isRawMode: boolean, internalResource: GraphPointer | null} {
    return {
      isRawMode: false,
      internalResource: this.resource,
    }
  },

  methods: {
    async toggleMode (): Promise<void> {
      await this.syncResource()
      this.isRawMode = !this.isRawMode
    },

    async syncResource (): Promise<void> {
      if (!this.internalResource) return

      if (this.isRawMode) {
        const rdfEditor = this.$refs.rdfEditor as any
        await rdfEditor.waitParsing()
        this.internalResource = Object.freeze(clownface({
          dataset: $rdf.dataset(rdfEditor.editorQuads || []),
          term: this.internalResource.term,
        }))
      } else {
        const form = this.$refs.form as any
        this.internalResource = Object.freeze(form.clone)
      }
    },
  },
})
</script>
