<template>
  <side-pane :title="title" @close="onCancel">
    <cc-hydra-operation-form-with-raw
      v-if="resource && operation"
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
      submit-label="Save hierarchy"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { RdfResource } from 'alcaeus'
import { computed, defineComponent, shallowRef, ShallowRef, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import '@/customElements/HydraOperationFormWithRaw'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'HierarchyEditView',
  components: { SidePane },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const hierarchy: ShallowRef<RdfResource | null> = shallowRef(null)

    watch(route, async (newRoute, oldRoute) => {
      if ((!oldRoute || newRoute.name === oldRoute.name) && newRoute.params.id) {
        const hierarchyId = newRoute.params.id as string
        hierarchy.value = await api.fetchResource<RdfResource>(hierarchyId)
      }
    }, { immediate: true })

    const operation = computed(() => hierarchy.value?.actions.replace ?? null)

    const form = useHydraForm(operation, {
      afterSubmit () {
        displayToast({
          message: 'Hierarchy successfully saved',
          variant: 'success',
        })

        store.dispatch('hierarchy/fetchHierarchy', route.params.id)
        router.push({ name: 'Hierarchy', params: { id: route.params.id } })
      },
    })

    watch(hierarchy, () => {
      if (hierarchy.value) {
        form.resource.value = Object.freeze(hierarchy.value.pointer)
      } else {
        form.resource.value = null
      }
    })

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'Hierarchy', params: { id: this.$route.params.id } })
    },
  },
})
</script>
