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
          type="is-default"
          size=""
        >
          {{ projectsCollection.actions.create.title }}
        </hydra-operation-button>
      </div>
    </div>
    <div v-if="projectsCollection">
      <div v-if="projects.length > 0" class="panel">
        <CubeProjectsItem
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
import { Component, Vue } from 'vue-property-decorator'
import { ProjectsCollection, Project } from '@cube-creator/model'
import CubeProjectsItem from '@/components/CubeProjectsItem.vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { CubeProjectsItem, PageContent, LoadingBlock, HydraOperationButton },
})
export default class CubeProjectsView extends Vue {
  @storeNs.projects.State('collection') projectsCollection!: ProjectsCollection | null;

  async mounted (): Promise<void> {
    await this.$store.dispatch('projects/fetchCollection')
  }

  get projects (): Project[] {
    return this.projectsCollection?.member ?? []
  }
}
</script>
