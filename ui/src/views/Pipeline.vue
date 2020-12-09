<template>
  <div v-if="mapping && jobCollection">
    <div class="columns container-narrow">
      <div class="column">
        <job-form
          v-if="jobCollection.actions.createTransform"
          :operation="jobCollection.actions.createTransform"
          class="box"
        />
      </div>
      <div class="column">
        <job-form
          v-if="jobCollection.actions.createPublish"
          :operation="jobCollection.actions.createPublish"
          class="box"
        />
      </div>
    </div>

    <div class="jobs content">
      <div class="is-flex is-align-items-center mb-3">
        <h3 class="title is-5 mb-0">
          Previous jobs
        </h3>
        <b-tooltip label="Refresh">
          <b-button @click="fetchJobs" icon-left="sync" type="is-text" size="is-small" />
        </b-tooltip>
      </div>
      <div v-if="jobs.length > 0" class="panel container-narrow">
        <job-item v-for="job in jobs" :key="job.clientPath" :job="job" />
      </div>
      <p v-else class="has-text-grey">
        No jobs yet
      </p>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import LoadingBlock from '@/components/LoadingBlock.vue'
import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import { CsvMapping, JobCollection, Job } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { LoadingBlock, JobForm, JobItem },
})
export default class CubeDesignerView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping | null;
  @projectNS.State('jobCollection') jobCollection!: JobCollection | null;

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCSVMapping')
    this.fetchJobs()
  }

  get jobs (): Job[] {
    if (!this.jobCollection) return []

    const jobs = this.jobCollection.member
    return jobs.sort(({ created: created1 }, { created: created2 }) => created2.getTime() - created1.getTime())
  }

  fetchJobs (): void {
    this.$store.dispatch('project/fetchJobCollection')
  }
}
</script>

<style>
.jobs {
  margin-top: 2.5rem;
}
</style>
