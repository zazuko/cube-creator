<template>
  <page-content class="container-narrow">
    <div class="mb-4 is-flex is-align-items-center is-justify-content-space-between">
      <h2 class="title is-size-4 mb-0">
        Cube projects
      </h2>
      <div v-if="projectsCollection">
        <hydra-operation-button
          :operation="projectsCollection.actions.create"
          :to="{ name: 'CubeProjectCreate' }"
          variant="default"
          size="normal"
          :label="projectsCollection.actions.create.title"
        />
      </div>
    </div>
    <div v-if="projectsCollection">
      <div class="panel-tabs">
        <router-link :to="{ query: { creator: 'me' } }" v-if="user" v-slot="{ href, navigate, route }" custom>
          <a :href="href" @click="navigate" :class="{ 'is-active': isRouteActive(route, $route) }">Mine</a>
        </router-link>
        <router-link :to="{ query: { creator: 'all' } }" v-slot="{ href, navigate, route }" custom>
          <a :href="href" @click="navigate" :class="{ 'is-active': isRouteActive(route, $route) }">All</a>
        </router-link>
      </div>
      <div v-if="projects.length > 0" class="panel">
        <cube-projects-item
          v-for="project in projects"
          :key="project.id.value"
          :project="project"
          class="panel-block"
        />
      </div>
      <p v-else class="has-text-grey">
        No projects yet
      </p>
    </div>
    <loading-block v-else />

    <router-view v-if="projectsCollection" />
  </page-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Project } from '@cube-creator/model'
import CubeProjectsItem from '@/components/CubeProjectsItem.vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import { mapGetters, mapState } from 'vuex'
import { isRouteActive } from '@/router'

export default defineComponent({
  name: 'CubeProjectsView',
  components: { CubeProjectsItem, PageContent, LoadingBlock, HydraOperationButton },

  async mounted (): Promise<void> {
    await this.$store.dispatch('projects/fetchCollection')

    // Default to filter "my" projects
    if (!this.$route.query.creator && this.user) {
      this.$router.replace({ query: { creator: 'me' } })
    }
  },

  computed: {
    ...mapState('projects', {
      projectsCollection: 'collection',
    }),
    ...mapGetters('auth', {
      user: 'oidcUser',
    }),

    projects (): Project[] {
      const projects: Project[] = this.projectsCollection?.member ?? []

      if (this.$route.query.creator === 'all' || !this.user) {
        return projects
      } else {
        return projects.filter(({ creator }) => creator.name === this.user.name)
      }
    },
  },

  methods: {
    isRouteActive,
  },
})
</script>
