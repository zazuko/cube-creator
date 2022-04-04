<template>
  <side-pane :title="title" @close="onCancel">
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
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

import HydraOperationForm from '@/components/HydraOperationForm.vue'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'SharedDimensionCreateView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const collection = store.state.sharedDimensions.collection
    const operation = computed(() => collection?.actions.create ?? null)

    const form = useHydraForm(operation, {
      async afterSubmit (dimension: any) {
        await store.dispatch('sharedDimensions/fetchCollection')

        displayToast({
          message: `Shared dimension ${dimension.name} successfully created`,
          variant: 'success',
        })

        router.push({ name: 'SharedDimension', params: { id: dimension.clientPath } })
      },
    })

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'SharedDimensions' })
    },
  },
})
</script>
