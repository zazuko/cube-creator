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

<script>
import Vue from 'vue'
import clownface from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import { sh } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import SidePane from '@/components/SidePane.vue'
import { APIErrorValidation } from '@/api/errors'
import { mapGetters, mapState } from 'vuex'
import $rdf from '@rdfjs/data-model'

export default Vue.extend({
  name: 'TableCreate',
  components: { SidePane },

  data () {
    const resource = clownface({ dataset: dataset() }).namedNode('')

    // Initialize data based on URL query params
    const sourceId = this.$router.currentRoute.query.source
    let columns = this.$router.currentRoute.query.columns || []
    if (!Array.isArray(columns)) {
      columns = [columns]
    }

    if (sourceId) {
      const source = this.findSource()(sourceId)
      if (source) {
        resource.addOut(ns.cc.csvSource, source.id)

        columns.forEach((columnId) => {
          const column = source.columns.find((column) => column.clientPath === columnId)
          if (column) {
            resource.addOut(ns.cc.columnMapping, $rdf.blankNode(), (columnMapping) => {
              columnMapping.addOut(ns.cc.column, column.id)
            })
          } else {
            console.error(`Column not found: ${columnId}`)
          }
        })
      } else {
        console.error(`Source not found: ${sourceId}`)
      }
    }

    return {
      resource: Object.freeze(resource),
      shapes: null,
      error: null,
    }
  },

  async mounted () {
    const expects = this.operation?.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    if (expects) {
      const { representation } = await expects.load()
      const { root: shape } = representation
      if (shape) {
        const sourceProperty = shape.property.find(p => p.class?.equals(ns.cc.CSVSource))
        sourceProperty[ns.hashi.collection.value] = this.sourcesCollection

        this.shapes = shape.pointer
      }
    }
  },

  computed: {
    ...mapState({
      sourcesCollection: (state) => state.cubeProjects.sourcesCollection,
      operation: (state) => state.cubeProjects.tableCollection?.actions.create,
    }),
  },

  methods: {
    ...mapGetters({
      findSource: 'cubeProjects/findSource',
    }),

    async onSubmit () {
      this.error = null
      const loader = this.$buefy.loading.open({})

      try {
        const table = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource: this.resource,
        })

        this.$store.dispatch('cubeProjects/refreshTableCollection')

        this.$store.dispatch('app/showMessage', {
          message: `Table ${table.name} was successfully created`,
          type: 'is-success',
        })

        this.$router.push({ name: 'CSVMapping' })
      } catch (e) {
        if (e instanceof APIErrorValidation) {
          this.error = e.details.title
        } else {
          console.error(e)
          this.error = e.toString()
        }
      } finally {
        loader.close()
      }
    },

    onCancel () {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
