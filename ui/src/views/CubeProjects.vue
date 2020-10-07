<template>
  <div>
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <h2 class="title">
            Cube projects
          </h2>
        </div>
        <div v-if="projectsCollection" class="level-item">
          <router-link v-if="projectsCollection.actions.create" :to="{ name: 'CubeProjectNew' }" class="button">
            <b-icon icon="plus" />
            <span>{{ projectsCollection.actions.create.title }}</span>
          </router-link>
        </div>
      </div>
    </div>
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

    <router-view v-if="projectsCollection" />
  </div>
</template>

<script lang="ts">
import { Collection } from 'alcaeus'
import Vue from 'vue'
import { mapState } from 'vuex'

export default Vue.extend({
  name: 'CubeProjects',
  components: {},

  async mounted () {
    await this.$store.dispatch('cubeProjects/fetchCollection')
  },

  computed: {
    ...mapState({
      projectsCollection: (state: any): Collection => state.cubeProjects.collection
    }),

    projects () {
      if (!this.projectsCollection) return null

      return this.projectsCollection.member
    }
  }
})
</script>
