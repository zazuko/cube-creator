<template>
  <side-pane :title="title" @close="onCancel">
    <o-field label="Dimension property">
      <term-display v-if="dimension.about" :term="dimension.about" :base="cubeUri" />
    </o-field>
    <hydra-operation-form-with-raw
      v-if="resource && operation"
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
import { Dataset, DimensionMetadata } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { conciseBoundedDescription } from '@/graph'
import * as storeNs from '../store/namespace'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { meta } from '@cube-creator/core/namespace'
import { displayToast } from '@/use-toast'

@Component({
  components: { SidePane, HydraOperationFormWithRaw, TermDisplay },
})
export default class extends Vue {
  @storeNs.project.State('cubeMetadata') cubeMetadata!: Dataset | null
  @storeNs.project.Getter('dimensions') dimensions!: DimensionMetadata[]
  @storeNs.project.Getter('findDimension') findDimension!: (id: string) => DimensionMetadata

  resource: GraphPointer | null = null
  shape: Shape | null = null
  error: ErrorDetails | null = null
  isSubmitting = false

  async mounted (): Promise<void> {
    if (this.operation) {
      const shape = await api.fetchOperationShape(this.operation)

      if (!shape) throw new Error('Shape not found')

      // Manually build the dimensions list because `addList` causes a blank
      // node clash
      const dimensionsList = shape.pointer.blankNode('_dimensions-0')
      let position: GraphPointer<any> = dimensionsList
      this.dimensions.forEach((d, index) => {
        position
          .addOut(rdf.first, d.about, dimPtr => {
            dimPtr.addOut(schema.name, d.name)
          })
          .addOut(rdf.rest, position.blankNode(`_dimensions-${index + 1}`))

        position = position.out(rdf.rest)
      })
      position.in(rdf.rest).deleteOut(rdf.rest).addOut(rdf.rest, rdf.nil)

      shape.pointer
        .out(sh.property).has(sh.path, meta.dimensionRelation)
        .out(sh.node)
        .out(sh.property).has(sh.path, meta.relatesTo)
        // .addList(sh.in, this.dimensions.map(({ about }) => about))
        .addOut(sh.in, dimensionsList)

      this.shape = shape
    }

    this.resource = conciseBoundedDescription(this.dimension.pointer)
  }

  get cubeUri (): string | undefined {
    return this.cubeMetadata?.hasPart[0]?.id.value
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

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.dispatch('project/refreshDimensionMetadataCollection')

      displayToast(this, {
        message: 'Dimension metadata was saved',
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
