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
      <h3 class="title is-5">
        Previous jobs
      </h3>
      <ul v-if="jobs.length > 0">
        <li v-for="job in jobs" :key="job.clientPath">
          <a v-if="job.link" :href="job.link" target="_blank">
            {{ job.created | format-date }} ({{ job.name }})
          </a>
          <span v-else>
            {{ job.created | format-date }} ({{ job.name }})
          </span>
        </li>
      </ul>
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
import { CsvMapping, JobCollection, Job } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { LoadingBlock, JobForm },
})
export default class CubeDesignerView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping | null;
  @projectNS.State('jobCollection') jobCollection!: JobCollection | null;
  @projectNS.Getter('jobs') jobs!: Job[];

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCSVMapping')
    const jobCollection = await this.$store.dispatch('project/fetchJobCollection')
    console.log(jobCollection)
    console.log(jobCollection.toJSON())
  }
}
</script>

<style>
.jobs {
  margin-top: 2.5rem;
}
</style>
