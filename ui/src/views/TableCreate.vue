<template>
  <side-pane :title="operation.title" @close="onCancel">
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
import { defineComponent } from '@vue/composition-api'
import clownface, { GraphPointer } from 'clownface'
import { RuntimeOperation } from 'alcaeus'
import { dataset } from '@rdf-esm/dataset'
import { csvw, hydra } from '@tpluscode/rdf-ns-builders'
import type { Shape } from '@rdfine/shacl'
import * as ns from '@cube-creator/core/namespace'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { CsvSource, CsvColumn } from '@cube-creator/model'
import { displayToast } from '@/use-toast'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'TableCreateView',
  components: { SidePane, HydraOperationForm },

  data (): {
    resource: GraphPointer | null,
    error: ErrorDetails | null,
    isSubmitting: boolean,
    shape: Shape | null,
    } {
    return {
      resource: clownface({ dataset: dataset() }).namedNode(''),
      error: null,
      isSubmitting: false,
      shape: null,
    }
  },

  async mounted (): Promise<void> {
    this.resource = this.prepareResourceFromQueryParams()
    this.shape = await this.prepareShape()
  },

  computed: {
    ...mapState('project', {
      sourcesCollection: 'sourcesCollection',
    }),
    ...mapGetters('project', {
      findSource: 'findSource',
    }),

    operation (): RuntimeOperation | null {
      return this.$store.state.project.tableCollection.actions.create
    },

    preselectedSource (): CsvSource | null {
      const sourceId = this.$route.query.source

      if (sourceId && !Array.isArray(sourceId)) {
        return this.findSource(sourceId)
      } else {
        return null
      }
    },

    preselectedColumns (): CsvColumn[] {
      const source = this.preselectedSource

      if (!source) return []

      let columnIds = this.$route.query.columns || []
      if (!Array.isArray(columnIds)) {
        columnIds = [columnIds]
      }

      return columnIds
        .map((columnId) => {
          const column = source.columns.find((column) => column.clientPath === columnId)
          if (column) {
            return column
          } else {
            console.error(`Column not found: ${columnId}`)
            return null
          }
        })
        .filter((column): column is CsvColumn => column !== null)
    },
  },

  methods: {
    prepareResourceFromQueryParams (): GraphPointer {
      const resource = clownface({ dataset: dataset() }).namedNode('')

      // Initialize data based on URL query params
      const source = this.preselectedSource
      if (source) {
        resource.addOut(ns.cc.csvSource, source.id)
      }

      this.preselectedColumns.forEach((column) => {
        resource.addOut(csvw.column, column.id)
      })

      return resource
    },

    async prepareShape (): Promise<Shape | null> {
      if (!this.operation) {
        return null
      }

      const shape = await api.fetchOperationShape(this.operation)

      if (shape) {
        const sourceProperty: any = shape.property.find(p => p.class?.equals(ns.cc.CSVSource))
        sourceProperty[hydra.collection.value] = this.sourcesCollection
      }

      return shape
    },

    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        const table = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        this.$store.commit('project/storeTable', table)

        displayToast(this, {
          message: `Table ${table.name} was successfully created`,
          variant: 'success',
        })

        this.$router.push({ name: 'CSVMapping' })
      } catch (e) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
