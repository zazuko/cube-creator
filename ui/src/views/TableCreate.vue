<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <cc-form :resource.prop="resource" :shapes.prop="shapes" no-editor-switches />

      <b-field>
        <button type="submit" class="button is-primary">
          {{ operation.title }}
        </button>
        <b-button @click="onCancel">
          Cancel
        </b-button>
      </b-field>
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import clownface, { GraphPointer } from 'clownface'
import { RuntimeOperation, RdfResource } from 'alcaeus'
import { dataset } from '@rdf-esm/dataset'
import { csvw, sh } from '@tpluscode/rdf-ns-builders'
import { Shape } from '@rdfine/shacl'
import * as ns from '@cube-creator/core/namespace'
import SidePane from '@/components/SidePane.vue'
import { APIErrorValidation } from '@/api/errors'
import { SourcesCollection, Source } from '../types'

const projectNS = namespace('project')

@Component({
  components: { SidePane },
})
export default class TableCreateView extends Vue {
  @projectNS.State('sourcesCollection') sourcesCollection!: SourcesCollection
  @projectNS.State((state) => state.tableCollection.actions.create) operation!: RuntimeOperation | null
  @projectNS.Getter('findSource') findSource!: (id: string) => Source | null

  resource: GraphPointer | null = clownface({ dataset: dataset() }).namedNode('')
  shapes: GraphPointer | null = null
  error: string | null = null

  async mounted (): Promise<void> {
    this.resource = this.prepareResourceFromQueryParams()
    this.shapes = await this.prepareShapes()
  }

  prepareResourceFromQueryParams (): GraphPointer {
    const resource = clownface({ dataset: dataset() }).namedNode('')

    // Initialize data based on URL query params
    const sourceId = this.$router.currentRoute.query.source
    let columns = this.$router.currentRoute.query.columns || []
    if (!Array.isArray(columns)) {
      columns = [columns]
    }

    if (sourceId && !Array.isArray(sourceId)) {
      const source = this.findSource(sourceId)
      if (source) {
        resource.addOut(ns.cc.csvSource, source.id)

        columns.forEach((columnId) => {
          const column = source.columns.find((column) => column.clientPath === columnId)
          if (column) {
            resource.addOut(csvw.column, column.id)
          } else {
            console.error(`Column not found: ${columnId}`)
          }
        })
      } else {
        console.error(`Source not found: ${sourceId}`)
      }
    }

    return resource
  }

  async prepareShapes (): Promise<GraphPointer | null> {
    let shapes = null

    const expects: RdfResource | undefined = this.operation?.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    if (expects && expects.load) {
      const { representation } = await expects.load<Shape>()
      if (representation && representation.root) {
        const shape = representation.root
        const sourceProperty: any = shape.property.find(p => p.class?.equals(ns.cc.CSVSource))
        sourceProperty[ns.hashi.collection.value] = this.sourcesCollection

        shapes = shape.pointer
      }
    }

    return shapes
  }

  async onSubmit (): Promise<void> {
    this.error = null
    const loader = this.$buefy.loading.open({})

    try {
      const table = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('project/refreshTableCollection')

      this.$store.dispatch('app/showMessage', {
        message: `Table ${table.name} was successfully created`,
        type: 'is-success',
      })

      this.$router.push({ name: 'CSVMapping' })
    } catch (e) {
      if (e instanceof APIErrorValidation) {
        this.error = e.details?.title ?? e.toString()
      } else {
        console.error(e)
        this.error = e.toString()
      }
    } finally {
      loader.close()
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
