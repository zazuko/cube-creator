<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation && resource"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @cancel="onCancel"
      @submit="onSubmit"
    />
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { GraphPointer } from 'clownface'
import { namespace } from 'vuex-class'
import { Dataset, DimensionMetadata } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { serializeResource } from '@/store/serializers'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm, TermDisplay },
})
export default class extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: Dataset | null
  @projectNS.Getter('findDimension') findDimension!: (id: string) => DimensionMetadata

  mappings: RdfResource | null = null
  resource: GraphPointer | null = null;
  shape: Shape | null = null;
  error: ErrorDetails | null = null;
  isSubmitting = false

  async mounted (): Promise<void> {
    if (this.dimension.mappings) {
      const mappings = await api.fetchResource(this.dimension.mappings.value)
      this.mappings = serializeResource(mappings)
    }

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    this.resource = this.mappings?.pointer ?? null
  }

  get dimension (): DimensionMetadata {
    return this.findDimension(this.$route.params.dimensionId)
  }

  get operation (): RuntimeOperation | null {
    return this.mappings?.actions.replace ?? null
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
        message: 'Mapping to shared dimension was saved',
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
