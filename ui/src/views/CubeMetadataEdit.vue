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
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

import { cc, cube } from '@cube-creator/core/namespace'

import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import SidePane from '@/components/SidePane.vue'
import { conciseBoundedDescription } from '@/graph'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'CubeMetadataEdit',
  components: { SidePane, HydraOperationFormWithRaw },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const cubeMetadata = store.state.project.cubeMetadata
    if (!cubeMetadata) throw new Error('Cube metadata not loaded')
    const operation = computed(() => cubeMetadata?.actions?.edit ?? null)

    const form = useHydraForm(operation, {
      afterSubmit () {
        store.dispatch('project/fetchCubeMetadata')

        displayToast({
          message: 'Cube metadata was saved',
          variant: 'success',
        })

        router.push({ name: 'CubeDesigner' })
      }
    })

    // Since the /dataset resource is loaded with a bunch on inlined data,
    // the form will only be populated with the concise description of cube metadata,
    // excluding dimension metadata, cube Shape and observations link resource
    const exclude = [
      cube.observationConstraint,
      cc.observations,
      cc.dimensionMetadata
    ]
    form.resource.value = Object.freeze(conciseBoundedDescription(cubeMetadata.pointer, exclude))

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CubeDesigner' })
    },
  },
})
</script>
