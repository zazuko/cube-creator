<template>
  <page-content>
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
    <div v-if="projects && projects.length > 0" class="panel container-narrow">
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
    <loading-block v-else />

    <router-view v-if="projectsCollection" />
  </page-content>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { ProjectsCollection, Project } from '../types'

@Component({
  components: { PageContent, LoadingBlock },
})
export default class CubeProjectsView extends Vue {
  @State('collection', { namespace: 'projects' }) projectsCollection!: ProjectsCollection | null;

  async mounted (): Promise<void> {
    await this.$store.dispatch('projects/fetchCollection')
  }

  get projects (): Project[] | null {
    if (!this.projectsCollection) return null

    return this.projectsCollection.member
  }
}
</script>
