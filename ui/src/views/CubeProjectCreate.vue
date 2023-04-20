<template>
  <side-pane :title="title" @close="onCancel">
    <cc-hydra-operation-form
      v-if="operation"
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
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
import '@/customElements/HydraOperationForm'
import { displayToast } from '@/use-toast'
import { useHydraForm } from '@/use-hydra-form'
import { RootState } from '@/store/types'

export default defineComponent({
  name: 'CubeProjectCreateView',
  components: { SidePane },

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
      this.$router.push({ name: 'CubeProjects', query: this.$route.query })
    },
  },
})
</script>
