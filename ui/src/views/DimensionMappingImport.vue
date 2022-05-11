<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation && resource"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @cancel="onCancel"
      @submit="onSubmit"
    />
  </side-pane>
</template>

<script lang="ts">
import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { computed, defineComponent, onMounted, ref, Ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { serializeResource } from '@/store/serializers'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'
import { cc } from '@cube-creator/core/namespace'

export default defineComponent({
  name: 'DimensionMappingImportView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const findDimension = store.getters['project/findDimension']
    const dimension = findDimension(route.params.dimensionId)

    const mappings: Ref<RdfResource | null> = ref(null)

    const operation = computed(() =>
      mappings.value?.get(cc.batchMapping).findOperations({
        bySupportedOperation: cc.BatchMappingAction
      }).shift())

    const form = useHydraForm(operation, {
      afterSubmit () {
        displayToast({
          message: 'Mappings updated',
          variant: 'success',
        })

        router.push({
          name: 'DimensionMapping',
          params: {
            dimensionId: router.currentRoute.value.params.dimensionId
          }
        })
      },
    })

    onMounted(async () => {
      const fetchedMappings = await api.fetchResource(dimension.mappings.value)
      mappings.value = Object.freeze(fetchedMappings)
    })

    return {
      ...form,
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({
        name: 'DimensionMapping',
        params: {
          dimensionId: this.$router.currentRoute.value.params.dimensionId
        }
      })
    },
  },
})
</script>
