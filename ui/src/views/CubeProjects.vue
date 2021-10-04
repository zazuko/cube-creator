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
        <router-link
          v-for="project in projects"
          :key="project.id.value"
          :to="{ name: 'CubeProject', params: { id: project.clientPath } }"
          class="panel-block"
        >
          <div class="is-flex-grow-1 is-flex is-justify-content-space-between">
            <div>
              <p class="has-text-weight-bold">
                {{ project.label }}
              </p>
              <p class="is-size-7" title="Cube identifier">
                {{ project.cubeIdentifier || (project.sourceCube && project.sourceCube.value) }}
              </p>
            </div>
            <div v-if="project.maintainer" class="is-flex is-flex-direction-column is-align-items-flex-end">
              <p class="tag">
                {{ project.maintainer.displayLabel }}
              </p>
              <p class="is-size-7 pr-2" v-if="project.creator && project.creator.name">
                {{ project.creator.name }}
              </p>
            </div>
          </div>
        </router-link>
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
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { PageContent, LoadingBlock, HydraOperationButton },
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
