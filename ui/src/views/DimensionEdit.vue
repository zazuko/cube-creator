<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <b-field label="Dimension property">
      <property-display v-if="dimension.about" :term="dimension.about" />
    </b-field>
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update dimension metadata"
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
import { DimensionMetadata } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import PropertyDisplay from '@/components/PropertyDisplay.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm, PropertyDisplay },
})
export default class extends Vue {
  @projectNS.Getter('findDimension') findDimension!: (id: string) => DimensionMetadata

  resource: GraphPointer | null = null;
  shape: Shape | null = null;
  error: ErrorDetails | null = null;
  isSubmitting = false

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    this.resource = this.dimension.pointer
  }

  get dimension (): DimensionMetadata {
    return this.findDimension(this.$route.params.dimensionId)
  }

  get operation (): RuntimeOperation | null {
    return this.dimension.actions.edit
  }

  get title (): string {
    return this.operation?.title ?? 'Error: Missing operation'
  }

  async onSubmit (): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('project/fetchDimensionMetadataCollection')

      this.$buefy.toast.open({
        message: 'Dimension metadata was saved',
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
