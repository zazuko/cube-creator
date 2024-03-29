<template>
  <side-pane :title="title" @close="onCancel">
    <cc-hydra-operation-form
      v-if="operation && resource"
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
      @cancel="onCancel"
      @submit="onSubmit"
    >
      <o-field :addons="false">
        <div class="control">
          <o-button v-if="batchMappingOperation" variant="default" icon-left="magic" @click="importTerms">
            Auto-fill from Shared Dimension
          </o-button>
        </div>
      </o-field>
    </cc-hydra-operation-form>
  </side-pane>
</template>

<script lang="ts">
import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { computed, defineComponent, onMounted, ref, Ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api'
import SidePane from '@/components/SidePane.vue'
import '@/customElements/HydraOperationForm'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'
import { cc } from '@cube-creator/core/namespace'

export default defineComponent({
  name: 'DimensionMappingView',
  components: { SidePane },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const findDimension = store.getters['project/findDimension']
    const dimension = findDimension(route.params.dimensionId)

    const mappings: Ref<RdfResource | null> = ref(null)

    const operation = computed(() => mappings.value?.actions.replace ?? null)
    const batchMappingOperation = computed(() =>
      mappings.value?.get(cc.batchMapping, { strict: false })?.findOperations({
        bySupportedOperation: cc.BatchMappingAction
      }).shift())

    const form = useHydraForm(operation, {
      afterSubmit () {
        store.dispatch('project/fetchDimensionMetadataCollection')

        displayToast({
          message: 'Mapping to shared dimension was saved',
          variant: 'success',
        })

        router.push({ name: 'CubeDesigner' })
      },
    })

    onMounted(async () => {
      const fetchedMappings = await api.fetchResource(dimension.mappings.value)
      mappings.value = Object.freeze(fetchedMappings)

      form.resource.value = fetchedMappings.pointer
    })

    return {
      ...form,
      mappings,
      batchMappingOperation
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CubeDesigner' })
    },

    importTerms () {
      this.$router.push({
        name: 'DimensionMappingImport',
        params: {
          dimensionId: this.$router.currentRoute.value.params.dimensionId
        }
      })
    }
  },
})
</script>
