<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form-with-raw
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Save dimension"
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
import { displayToast } from '@/use-toast'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'SharedDimensionEditView',
  components: { SidePane, HydraOperationFormWithRaw },

  data (): {
    resource: GraphPointer | null,
    operation: RuntimeOperation | null,
    error: ErrorDetails | null,
    isSubmitting: boolean,
    shape: Shape | null,
    shapes: GraphPointer | null,
    } {
    return {
      resource: null,
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
  },

  methods: {
    async prepareForm (): Promise<void> {
      this.resource = null
      this.operation = null
      this.shape = null

      const dimensionId = this.$route.params.id
      const dimension = await api.fetchResource(dimensionId)

      this.resource = Object.freeze(dimension.pointer)
      this.operation = dimension.actions.replace ?? null

      if (this.operation) {
        this.shape = await api.fetchOperationShape(this.operation)
      }
    },

    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        this.$store.dispatch('sharedDimensions/fetchCollection')

        displayToast(this, {
          message: 'Shared dimension successfully saved',
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
