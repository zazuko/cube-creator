<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update table"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import { cc } from '@cube-creator/core/namespace'
import { Table } from '@cube-creator/model'

import { api } from '@/api'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'TableEditView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const findTable = store.getters['project/findTable']

    const tableId = route.params.tableId as string
    const table = findTable(tableId)
    const operation = computed(() => table?.actions.edit ?? null)

    const form = useHydraForm(operation, {
      afterSubmit (savedTable: any) {
        store.commit('project/storeTable', savedTable)

        displayToast({
          message: `Table ${savedTable.name} was successfully created`,
          variant: 'success',
        })

        if (savedTable.identifierTemplate !== table.identifierTemplate) {
          store.dispatch('project/fetchCSVMapping')
        }

        router.push({ name: 'CSVMapping' })
      },
    })

    const fetchResource = async () => {
      // Fetch fresh table to avoid superfluous quads in the dataset
      if (table) {
        const fetchedTable = await api.fetchResource<Table>(table.id.value)
        form.resource.value = fetchedTable.pointer
          .addOut(cc.isObservationTable, table.isObservationTable)
      }
    }
    onMounted(fetchResource)

    return form
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
