<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Create term"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'SHaredDimensionTermCreateView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const dimension = store.state.sharedDimension.dimension
    if (!dimension) throw new Error('Dimension not loaded')

    const operation = computed(() => dimension.actions.create)

    const form = useHydraForm(operation, {
      fetchShapeParams: { targetClass: dimension.id },
      saveHeaders: { Prefer: `target-class=${dimension.id.value}` },

      afterSubmit (term: any) {
        store.dispatch('sharedDimension/addTerm', term)

        displayToast({
          message: 'Shared dimension term successfully created',
          variant: 'success',
        })

        router.push({ name: 'SharedDimension', params: { id: dimension.clientPath } })
      },
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
