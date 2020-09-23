<template>
  <div>
    <h2 class="title">
      Cube projects
    </h2>
    <div v-if="projects && projects.length > 0" class="panel">
      <router-link
        v-for="project in projects"
        :key="project.id.value"
        :to="{ name: 'CubeProject', params: { id: project.clientPath } }"
        class="panel-block"
      >
        {{ project.title }}
      </router-link>
    </div>
    <p v-else-if="projects && projects.length === 0" class="has-text-grey">
      No projects yet
    </p>
    <b-loading v-else active :is-full-page="false" />
  </div>
</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'

export default Vue.extend({
  name: 'CubeProjects',

  async mounted () {
    await this.$store.dispatch('cubeProjects/fetchCollection')
  },

  computed: {
    ...mapState({
      projectsCollection: (state) => state.cubeProjects.collection
    }),

    projects () {
      if (!this.projectsCollection) return null

      return this.projectsCollection.members
    }
  }
})
</script>
