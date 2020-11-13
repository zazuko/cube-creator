<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { GraphPointer } from 'clownface'
import { namespace } from 'vuex-class'
import { Dataset } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeMetadataEdit extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: Dataset;

  resource: GraphPointer | null = null;
  shape: Shape | null = null;
  error: string | null = null;
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

  async onSubmit (): Promise<void> {
    this.isSubmitting = true

    try {
      // TODO
      console.log(this.cubeMetadata.toJSON())
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeDesigner' })
  }
}
</script>
