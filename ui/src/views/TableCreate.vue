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

    <b-field label="Mapped columns" v-if="preselectedColumns.length > 0" class="content" :addons="false">
      <p class="help">
        The following columns will be mapped with default values.
        They can be edited once the table is created.
      </p>
      <ul>
        <li v-for="column in preselectedColumns" :key="column.id.value">
          {{ column.name }}
        </li>
      </ul>
    </b-field>
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
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
import { SourcesCollection, CsvSource, CsvColumn } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class TableCreateView extends Vue {
  @projectNS.State('sourcesCollection') sourcesCollection!: SourcesCollection
  @projectNS.State((state) => state.tableCollection.actions.create) operation!: RuntimeOperation | null
  @projectNS.Getter('findSource') findSource!: (id: string) => CsvSource | null

  resource: GraphPointer | null = clownface({ dataset: dataset() }).namedNode('')
  shape: Shape | null = null
  isSubmitting = false;
  error: ErrorDetails | null = null

  async mounted (): Promise<void> {
    this.resource = this.prepareResourceFromQueryParams()
    this.shape = await this.prepareShape()
  }

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
  }

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
  }

  get preselectedSource (): CsvSource | null {
    const sourceId = this.$route.query.source

    if (sourceId && !Array.isArray(sourceId)) {
      return this.findSource(sourceId)
    } else {
      return null
    }
  }

  get preselectedColumns (): CsvColumn[] {
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
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      const table = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.commit('project/storeTable', table)

      this.$buefy.toast.open({
        message: `Table ${table.name} was successfully created`,
        type: 'is-success',
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
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
