<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form-with-raw
      v-if="resource && operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
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
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import { displayToast } from '@/use-toast'
import { useHydraForm } from '@/use-hydra-form'
import { RootState } from '@/store/types'

export default defineComponent({
  name: 'SharedDimensionEditView',
  components: { SidePane, HydraOperationFormWithRaw },

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
      form.resource.value = Object.freeze(resource.pointer)
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
