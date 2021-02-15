<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
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
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'

const managedDimensionsNS = namespace('managedDimensions')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class extends Vue {
  @managedDimensionsNS.State('collection') managedDimensionsCollection!: any

  resource: GraphPointer | null = Object.freeze(clownface({ dataset: dataset() }).namedNode(''));
  error: ErrorDetails | null = null;
  isSubmitting = false;
  shape: Shape | null = null;
  shapes: GraphPointer | null = null;

  get operation (): RuntimeOperation | null {
    return this.managedDimensionsCollection.actions.create
  }

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
      const dimension = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$buefy.toast.open({
        message: `Managed dimension ${dimension.title} successfully created`,
        type: 'is-success',
      })

      this.$router.push({ name: 'ManagedDimension', params: { id: dimension.clientPath } })
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
    this.$router.push({ name: 'ManagedDimensions' })
  }
}
</script>
