<template>
  <div v-if="project">
    <div class="tabs is-boxed mb-0 mt-2">
      <ul>
        <router-link :to="{ name: 'CubeProjectEdit' }" v-slot="{ href, isActive, navigate }" custom>
          <li :class="{ 'is-active': isActive }">
            <b-tooltip label="Project settings">
              <a :href="href" @click="navigate">
                <h2 class="project-title has-text-weight-bold truncate">
                  {{ project.title }}
                </h2>
                <b-icon icon="cog" class="ml-1" />
              </a>
            </b-tooltip>
          </li>
        </router-link>
        <router-link v-if="hasCSVMapping" :to="{ name: 'CSVMapping' }" v-slot="{ href, isActive, navigate }" custom>
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">1. CSV Mapping</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'CubeDesigner' }" v-slot="{ href, isActive, navigate }" custom>
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">2. Cube Designer</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'Publication' }" v-slot="{ href, isActive, navigate }" custom>
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">
              3. Publication
            </a>
          </li>
        </router-link>
        <li class="tab-right pr-4" v-if="jobCollection">
          <transform-job-button
            :has-csv-mapping="hasCSVMapping"
            :job-collection="jobCollection"
            :transform-jobs="transformJobs"
          />
        </li>
      </ul>
    </div>

    <page-content>
      <router-view />
    </page-content>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Job, JobCollection, Project } from '@cube-creator/model'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import TransformJobButton from '@/components/TransformJobButton.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { PageContent, LoadingBlock, TransformJobButton },
})
export default class CubeProjectView extends Vue {
  @storeNs.project.State('project') project!: Project | null;
  @storeNs.project.State('jobCollection') jobCollection!: JobCollection | null;
  @storeNs.project.Getter('transformJobs') transformJobs!: Job[];

  poller: number | null = null

  async mounted (): Promise<void> {
    const id = this.$route.params.id
    await this.$store.dispatch('project/fetchProject', id)

    // Poll jobs
    this.poller = window.setInterval(this.pollJobs, 3000)

    if (this.$route.name === 'CubeProject') {
      if (this.hasCSVMapping) {
        this.$router.push({ name: 'CSVMapping' })
      } else {
        this.$router.push({ name: 'CubeDesigner' })
      }
    }
  }

  beforeDestroy (): void {
    this.stopPolling()
  }

  async pollJobs (): Promise<void> {
    try {
      await this.$store.dispatch('project/fetchJobCollection')
    } catch (e) {
      this.stopPolling()
      throw e
    }
  }

  stopPolling (): void {
    if (this.poller) {
      clearInterval(this.poller)
    }
  }

  get hasCSVMapping (): boolean {
    return !!this.project?.csvMapping
  }
}
</script>

<style scoped>
.tabs {
  /* Fix dropdown displayed under page content */
  overflow: visible;
}

.tab-right {
  margin-left: auto;
}

.tab-right ~ .tab-right {
  margin-left: 0;
}

.project-title {
  max-width: 34rem;
}
</style>
