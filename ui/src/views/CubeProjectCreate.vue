<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Create project"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { displayToast } from '@/use-toast'
import { useHydraForm } from '@/use-hydra-form'
import { RootState } from '@/store/types'

export default defineComponent({
  name: 'CubeProjectCreateView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const operation = shallowRef(store.state.projects.collection?.actions.create ?? null)

    const form = useHydraForm(operation, {
      afterSubmit (savedResource: any) {
        displayToast({
          message: `Project ${savedResource.title} successfully created`,
          variant: 'success',
        })

        router.push({ name: 'CubeProject', params: { id: savedResource.clientPath } })
      },
    })

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CubeProjects' })
    },
  },
})
</script>
