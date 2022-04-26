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
import { defineComponent, PropType, ref, toRefs } from 'vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import HydraRawRdfForm from '@/components/HydraRawRdfForm.vue'
import { GraphPointer } from 'clownface'
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
  },
  emits: ['submit', 'cancel'],

  setup (props) {
    const { resource } = toRefs(props)

    const isRawMode = ref(false)
    const internalResource = resource.value

    return {
      isRawMode,
      internalResource,
    }
  },

  watch: {
    async resource (resource) {
      if (this.internalResource?.term.equals(resource?.term)) {
        return
      }
      this.isRawMode = false
      this.internalResource = null as any
      await (this.$refs.form as any)?.updateComplete
      this.internalResource = resource
    }
  },

  methods: {
    async toggleMode () {
      if (this.isRawMode) {
        this.internalResource = (this.$refs.rdfEditor as any).value
      } else {
        this.internalResource = null as any
        await (this.$refs.form as any).updateComplete
        this.internalResource = (this.$refs.form as any).value
      }
      this.isRawMode = !this.isRawMode
    },
  },
})
</script>
