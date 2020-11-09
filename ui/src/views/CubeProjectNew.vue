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
import { State } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeProjectNewView extends Vue {
  @State((state) => state.projects.collection.actions.create)
  operation!: RuntimeOperation | null;

  resource: GraphPointer | null = Object.freeze(clownface({ dataset: dataset() }).namedNode(''));
  error: string | null = null;
  isSubmitting = false;
  shape: Shape | null = null;
  shapes: GraphPointer | null = null;

  get title (): string {
    return this.operation?.title ?? ''
  }

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  async onSubmit (): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      const project = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('app/showMessage', {
        message: `Project ${project.title} successfully created`,
        type: 'is-success',
      })

      this.$router.push({ name: 'CubeProject', params: { id: project.clientPath } })
    } catch (e) {
      console.error(e)
      // TODO: Improve error display
      this.error = e
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeProjects' })
  }
}
</script>
