<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @submit="onSubmit"
      @cancel="onCancel"
    />

    <o-field label="Mapped columns" v-if="preselectedColumns.length > 0" class="content" :addons="false">
      <p class="help">
        The following columns will be mapped with default values.
        They can be edited once the table is created.
      </p>
      <ul>
        <li v-for="column in preselectedColumns" :key="column.id.value">
          {{ column.name }}
        </li>
      </ul>
    </o-field>
  </side-pane>
</template>

<script lang="ts">
import { csvw, hydra } from '@tpluscode/rdf-ns-builders'
import { computed, defineComponent, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

import * as ns from '@cube-creator/core/namespace'
import { CsvColumn } from '@cube-creator/model'

import HydraOperationForm from '@/components/HydraOperationForm.vue'
import SidePane from '@/components/SidePane.vue'
import { RootState } from '@/store/types'
import { displayToast } from '@/use-toast'
import { useHydraForm } from '@/use-hydra-form'

export default defineComponent({
  name: 'TableCreateView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const sourcesCollection = store.state.project.sourcesCollection
    const tableCollection = store.state.project.tableCollection
    const findSource = store.getters['project/findSource']
    const operation = computed(() => tableCollection?.actions.create ?? null)

    const form = useHydraForm(operation, {
      afterSubmit (table: any) {
        store.commit('project/storeTable', table)

        displayToast({
          message: `Table ${table.name} was successfully created`,
          variant: 'success',
        })

        router.push({ name: 'CSVMapping' })
      },
    })

    watch(form.shape, (shape) => {
      if (shape) {
        const sourceProperty: any = shape.property.find(p => p.class?.equals(ns.cc.CSVSource))
        sourceProperty[hydra.collection.value] = sourcesCollection
      }
    })

    const preselectedSource = computed(() => {
      const sourceId = route.query.source

      if (sourceId && !Array.isArray(sourceId)) {
        return findSource(sourceId)
      } else {
        return null
      }
    })

    const preselectedColumns = computed(() => {
      const source = preselectedSource.value

      if (!source) return []

      let columnIds = route.query.columns || []
      if (!Array.isArray(columnIds)) {
        columnIds = [columnIds]
      }

      return columnIds
        .map((columnId) => {
          const column = source.columns.find((column: any) => column.clientPath === columnId)
          if (column) {
            return column
          } else {
            console.error(`Column not found: ${columnId}`)
            return null
          }
        })
        .filter((column): column is CsvColumn => column !== null)
    })

    const prepareResourceFromQueryParams = () => {
      const resource = form.resource.value

      if (!resource) return

      // Initialize data based on URL query params
      const source = preselectedSource.value
      if (source) {
        resource.addOut(ns.cc.csvSource, source.id)
      }

      preselectedColumns.value.forEach((column) => {
        resource.addOut(csvw.column, column.id)
      })

      return resource
    }
    onMounted(prepareResourceFromQueryParams)

    return {
      ...form,
      preselectedColumns,
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
