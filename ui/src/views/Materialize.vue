<template>
  <div v-if="jobCollection">
    <div class="container-narrow">
      <job-form v-if="operation" :operation="operation" class="box" />
    </div>

    <div class="mt-6">
      <div class="is-flex is-align-items-center mb-3">
        <h3 class="title is-5 mb-0">
          Previous jobs
        </h3>
      </div>
      <div v-if="jobs.length > 0" class="panel container-narrow">
        <job-item
          v-for="job in jobs"
          :key="job.clientPath"
          :job="job"
          detail-view="MaterializeJob"
          class="panel-block"
        />
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
import LoadingBlock from '@/components/LoadingBlock.vue'
import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import ExternalTerm from '@/components/ExternalTerm.vue'
import { ImportJob, JobCollection, TransformJob } from '@cube-creator/model'
import * as storeNs from '../store/namespace'
import { RuntimeOperation } from 'alcaeus/Resources/Operation'

@Component({
  components: { ExternalTerm, LoadingBlock, JobForm, JobItem },
})
export default class PublicationView extends Vue {
  @storeNs.project.Getter('hasCSVMapping') hasCSVMapping!: boolean
  @storeNs.project.State('jobCollection') jobCollection!: JobCollection
  @storeNs.project.Getter('transformJobs') jobs!: (TransformJob | ImportJob)[]

  get operation (): RuntimeOperation | null {
    return this.hasCSVMapping
      ? this.jobCollection.actions.createTransform
      : this.jobCollection.actions.createImport
  }
}
</script>
