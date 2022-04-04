<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update CSV settings"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'
import { RootState } from '@/store/types'

export default defineComponent({
  name: 'CubeProjectEditView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const findSource = store.getters['project/findSource']
    const sourceId = route.params.sourceId as string
    const source = findSource(sourceId)
    const operation = computed(() => source.actions.edit)

    const form = useHydraForm(operation, {
      afterSubmit () {
        store.dispatch('project/refreshSourcesCollection')

        displayToast({
          message: 'Settings successfully saved',
          variant: 'success',
        })

        router.push({ name: 'CSVMapping' })
      },
    })

    form.resource.value = Object.freeze(source.pointer)

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
