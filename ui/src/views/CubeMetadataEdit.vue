<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
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
import { namespace } from 'vuex-class'
import { Dataset } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeMetadataEdit extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: Dataset;

  resource: GraphPointer | null = null;
  shape: Shape | null = null;
  error: ErrorDetails | null = null;
  isSubmitting = false

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    this.resource = this.cubeMetadata.pointer
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

      this.$buefy.toast.open({
        message: 'Cube metadata was saved',
        type: 'is-success',
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
