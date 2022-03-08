<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form-with-raw
      v-if="resource && operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update cube metadata"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import type { Shape } from '@rdfine/shacl'
import { GraphPointer } from 'clownface'
import SidePane from '@/components/SidePane.vue'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { cc, cube } from '@cube-creator/core/namespace'
import { conciseBoundedDescription } from '@/graph'
import { displayToast } from '@/use-toast'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'CubeMetadataEdit',
  components: { SidePane, HydraOperationFormWithRaw },

  data (): { resource: GraphPointer | null, shape: Shape | null, error: ErrorDetails | null, isSubmitting: boolean } {
    return {
      resource: null,
      shape: null,
      error: null,
      isSubmitting: false,
    }
  },

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    // Since the /dataset resource is loaded with a bunch on inlined data,
    // the form will only be populated with the concise description of cube metadata,
    // excluding dimension metadata, cube Shape and observations link resource
    const exclude = [
      cube.observationConstraint,
      cc.observations,
      cc.dimensionMetadata
    ]
    this.resource = Object.freeze(conciseBoundedDescription(this.cubeMetadata.pointer, exclude))
  },

  computed: {
    ...mapState('project', {
      cubeMetadata: 'cubeMetadata',
    }),

    operation (): RuntimeOperation | null {
      return this.cubeMetadata.actions.edit
    },

    title (): string {
      return this.operation?.title ?? 'Error: Missing operation'
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        this.$store.dispatch('project/fetchCubeMetadata')

        displayToast({
          message: 'Cube metadata was saved',
          variant: 'success',
        })

        this.$router.push({ name: 'CubeDesigner' })
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
      this.$router.push({ name: 'CubeDesigner' })
    },
  },
})
</script>
