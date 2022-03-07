<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      :submit-label="operation.title"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { displayToast } from '@/use-toast'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'HierarchyCreateView',
  components: { SidePane, HydraOperationForm },

  data (): {
    resource: GraphPointer | null,
    error: ErrorDetails | null,
    isSubmitting: boolean,
    shape: Shape | null,
    shapes: GraphPointer | null,
    } {
    return {
      resource: Object.freeze(clownface({ dataset: dataset() }).namedNode('')),
      error: null,
      isSubmitting: false,
      shape: null,
      shapes: null,
    }
  },

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  },

  computed: {
    ...mapState('sharedDimensions', {
      collection: 'hierarchies',
    }),

    operation (): RuntimeOperation | null {
      return this.collection.actions.create
    },

    title (): string {
      return this.operation?.title ?? ''
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        const dimension = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        await this.$store.dispatch('sharedDimensions/fetchCollection')

        displayToast(this, {
          message: `Shared dimension ${dimension.name} successfully created`,
          variant: 'success',
        })

        this.$router.push({ name: 'SharedDimension', params: { id: dimension.clientPath } })
      } catch (e) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    onCancel (): void {
      this.$router.push({ name: 'Hierarchies' })
    },
  },
})
</script>
