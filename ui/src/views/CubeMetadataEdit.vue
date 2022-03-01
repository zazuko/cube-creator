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
import { Component, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import type { Shape } from '@rdfine/shacl'
import { GraphPointer } from 'clownface'
import { Dataset } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { cc, cube } from '@cube-creator/core/namespace'
import { conciseBoundedDescription } from '@/graph'
import * as storeNs from '../store/namespace'
import { displayToast } from '@/use-toast'

@Component({
  components: { SidePane, HydraOperationFormWithRaw },
})
export default class CubeMetadataEdit extends Vue {
  @storeNs.project.State('cubeMetadata') cubeMetadata!: Dataset

  resource: GraphPointer | null = null
  shape: Shape | null = null
  error: ErrorDetails | null = null
  isSubmitting = false

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
  }

  get operation (): RuntimeOperation | null {
    return this.cubeMetadata.actions.edit
  }

  get title (): string {
    return this.operation?.title ?? 'Error: Missing operation'
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.dispatch('project/fetchCubeMetadata')

      displayToast(this, {
        message: 'Cube metadata was saved',
        variant: 'success',
      })

      this.$router.push({ name: 'CubeDesigner' })
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeDesigner' })
  }
}
</script>
