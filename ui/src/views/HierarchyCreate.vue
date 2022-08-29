<template>
  <side-pane :title="title" @close="onCancel">
    <cc-hydra-operation-form
      v-if="operation"
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
      :submit-label="operation.title"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import '@/customElements/HydraOperationForm'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'HierarchyCreateView',
  components: { SidePane },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const collection = store.state.hierarchies.collection
    const operation = shallowRef(collection?.actions.create ?? null)

    const form = useHydraForm(operation, {
      async afterSubmit (hierarchy: any) {
        store.dispatch('hierarchies/fetchCollection')

        displayToast({
          message: `Hierarchy ${hierarchy.name} successfully created`,
          variant: 'success',
        })

        router.push({ name: 'Hierarchy', params: { id: hierarchy.clientPath } })
      },
    })

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'Hierarchies' })
    },
  },
})
</script>
