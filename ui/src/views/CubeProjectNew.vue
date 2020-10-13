<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <b-field label="Project name">
        <b-input v-model="project.label" />
      </b-field>

      <b-field label="Start project from:" :message="projectTypeMessage">
        <b-radio-button
          v-for="option in projectSourceKinds"
          :key="option.value"
          v-model="project.projectSourceKind"
          :native-value="option.value"
        >
          {{ option.label }}
        </b-radio-button>
      </b-field>

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
import SidePane from '@/components/SidePane.vue'

export default Vue.extend({
  name: 'CubeProjectNew',
  components: { SidePane },

  data () {
    return {
      project: {
        projectSourceKind: 'CSV',
        label: '',
      },
      error: null,
      projectSourceKinds: [
        { value: 'CSV', label: 'CSV file(s)' },
        { value: 'Existing Cube', label: 'Existing cube' },
      ],
    }
  },

  computed: {
    ...mapState({
      operation: (state) => state.cubeProjects.collection?.actions.create,
    }),

    title () {
      return this.operation?.title
    },

    projectTypeMessage () {
      if (this.project.projectSourceKind === 'CSV') {
        return 'Map CSV files to a new Cube'
      } else {
        return 'Add metadata to a Cube resulting of another pipeline'
      }
    },
  },

  methods: {
    async onSubmit () {
      this.error = null

      try {
        const project = await this.$store.dispatch('cubeProjects/create', this.project)
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
