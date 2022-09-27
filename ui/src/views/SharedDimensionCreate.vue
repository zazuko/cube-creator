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
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import '@/customElements/HydraOperationForm'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'
import { schema } from '@tpluscode/rdf-ns-builders'
import { getLocalizedLabel } from '@rdfjs-elements/lit-helpers'

export default defineComponent({
  name: 'SharedDimensionCreateView',
  components: { SidePane },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()

    const collection = store.state.sharedDimensions.collection
    const operation = computed(() => collection?.actions.create ?? null)

    const form = useHydraForm(operation, {
      async afterSubmit (dimension: any) {
        await store.dispatch('sharedDimensions/fetchCollection')

        displayToast({
          message: `Shared dimension ${getLocalizedLabel(dimension.pointer.out(schema.name))} successfully created`,
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
