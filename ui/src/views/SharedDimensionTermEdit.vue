<template>
  <side-pane :title="title" @close="onCancel">
    <o-field label="URI" v-if="termUri">
      <a class="form-input" :href="termUri" target="_blank" rel="noopener noreferer">
        <span>{{ termUri }}</span>
        <o-icon icon="external-link-alt" />
      </a>
    </o-field>
    <hydra-operation-form-with-raw
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Save term"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import SidePane from '@/components/SidePane.vue'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { serializeSharedDimensionTerm } from '../store/serializers'
import { SharedDimensionTerm } from '../store/types'
import { displayToast } from '@/use-toast'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'SharedDimensionTermEditView',
  components: { SidePane, HydraOperationFormWithRaw },

  data (): {
    resource: GraphPointer | null,
    term: SharedDimensionTerm | null,
    operation: RuntimeOperation | null,
    error: ErrorDetails | null,
    isSubmitting: boolean,
    shape: Shape | null,
    shapes: GraphPointer | null,
    } {
    return {
      resource: null,
      term: null,
      operation: null,
      error: null,
      isSubmitting: false,
      shape: null,
      shapes: null,
    }
  },

  mounted (): void {
    this.prepareForm()
  },

  computed: {
    ...mapState('sharedDimension', {
      dimension: 'dimension',
    }),

    title (): string {
      return this.operation?.title ?? ''
    },

    termUri (): string | null {
      return this.term?.canonical?.value || this.term?.id?.value || null
    },
  },

  methods: {
    async prepareForm (): Promise<void> {
      this.resource = null
      this.operation = null
      this.shape = null

      const termId = this.$route.params.termId as string
      const term = await api.fetchResource(termId)

      this.term = serializeSharedDimensionTerm(term)
      this.resource = Object.freeze(term.pointer)
      this.operation = term.actions.replace ?? null

      if (this.operation) {
        this.shape = await api.fetchOperationShape(this.operation, {
          targetClass: this.dimension.id,
        })
      }
    },

    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        const term = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
          headers: { Prefer: `target-class=${this.dimension.id.value}` },
        })

        this.$store.dispatch('sharedDimension/updateTerm', term)

        displayToast(this, {
          message: 'Shared dimension term successfully saved',
          variant: 'success',
        })

        this.$router.push({ name: 'SharedDimension', params: { id: this.dimension.clientPath } })
      } catch (e: any) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    onCancel (): void {
      this.$router.push({ name: 'SharedDimension', params: { id: this.dimension.clientPath } })
    },
  },

  watch: {
    $route () {
      this.prepareForm()
    }
  },
})
</script>
