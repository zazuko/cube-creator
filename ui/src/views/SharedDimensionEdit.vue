<template>
  <side-pane :title="title" @close="onCancel">
    <cc-hydra-operation-form-with-raw
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
      submit-label="Save dimension"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import SidePane from '@/components/SidePane.vue'
import '@/customElements/HydraOperationFormWithRaw'
import { displayToast } from '@/use-toast'
import { useHydraForm } from '@/use-hydra-form'
import { RootState } from '@/store/types'

export default defineComponent({
  name: 'SharedDimensionEditView',
  components: { SidePane },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const dimension = store.state.sharedDimension.dimension
    if (!dimension) throw new Error('Dimension not loaded')

    const operation = computed(() => dimension.actions.replace)

    const form = useHydraForm(operation, {
      afterSubmit (dimension: any) {
        store.dispatch('sharedDimensions/fetchCollection').then(() =>
          store.dispatch('sharedDimension/fetchDimension', dimension.clientPath)
        )

        displayToast({
          message: 'Shared dimension successfully saved',
          variant: 'success',
        })

        router.push({ name: 'SharedDimension', params: { id: dimension.clientPath } })
      },
    })

    onMounted(async () => {
      const dimensionId = route.params.id as string
      const resource = await api.fetchResource(dimensionId)
      form.resource.value = resource.pointer
    })

    return {
      ...form,
      dimension,
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'SharedDimension', params: { id: this.dimension.clientPath } })
    },
  },
})
</script>
