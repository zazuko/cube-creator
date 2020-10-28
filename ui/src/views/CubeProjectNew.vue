<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>
    <form @submit.prevent="onSubmit">
      <cc-form :resource.prop="resource" :shapes.prop="shapes" no-editor-switches />
      <b-field>
        <button type="submit" class="button is-primary">
          Create project
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
import { mapState } from 'vuex'
import clownface from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import { quad } from '@rdf-esm/data-model'
import SidePane from '@/components/SidePane.vue'
import { sh } from '@tpluscode/rdf-ns-builders'

export default Vue.extend({
  name: 'CubeProjectNew',
  components: { SidePane },

  data () {
    return {
      resource: Object.freeze(clownface({ dataset: dataset() }).namedNode('')),
      shapes: null,
      error: null
    }
  },

  computed: {
    ...mapState({
      operation: (state) => state.cubeProjects.collection?.actions.create,
    }),

    title () {
      return this.operation?.title
    },
  },

  async mounted () {
    const expects = this.operation?.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    if (expects) {
      const { representation } = await expects.load()
      const { root: shape } = representation
      if (shape) {
        this.shapes = shape.pointer
      }
    }
  },

  methods: {
    async onSubmit () {
      this.error = null

      try {
        const project = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource: this.resource,
        })
        this.$router.push({ name: 'CubeProject', params: { id: project.clientPath } })
      } catch (e) {
        console.error(e)
        // TODO: Improve error display
        this.error = e
      }
    },

    onCancel () {
      this.$router.push({ name: 'CubeProjects' })
    },
  },
})
</script>
