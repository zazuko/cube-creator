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
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import { meta } from '@cube-creator/core/namespace'
import { DimensionMetadata } from '@cube-creator/model'

import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import SidePane from '@/components/SidePane.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import { conciseBoundedDescription } from '@/graph'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'DimensionEditView',
  components: { SidePane, HydraOperationFormWithRaw, TermDisplay },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const cubeMetadata = store.state.project.cubeMetadata
    const cubeUri = computed(() => cubeMetadata?.hasPart[0]?.id.value)

    const findDimension = store.getters['project/findDimension']
    const dimensions = store.getters['project/dimensions']

    const dimension = findDimension(route.params.dimensionId)
    const operation = shallowRef(dimension.actions.edit)

    const form = useHydraForm(operation, {
      afterSubmit () {
        store.dispatch('project/refreshDimensionMetadataCollection')

        displayToast({
          message: 'Dimension metadata was saved',
          variant: 'success',
        })

        router.push({ name: 'CubeDesigner' })
      },
    })

    // Populate dimensions selector
    watch(form.shape, () => {
      const shape = form.shape.value
      if (!shape) return

      // Manually build the dimensions list because `addList` causes a blank node clash
      const dimensionsList = shape.pointer.blankNode('_dimensions-0')
      let position: GraphPointer<any> = dimensionsList
      dimensions.forEach((d: DimensionMetadata, index: number) => {
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
    })

    if (dimension) {
      form.resource.value = conciseBoundedDescription(dimension.pointer)
    }

    return {
      ...form,
      dimension,
      cubeMetadata,
      cubeUri,
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CubeDesigner' })
    },
  },
})
</script>
