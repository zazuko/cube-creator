<template>
  <div v-if="jobCollection">
    <div class="container-narrow columns">
      <div class="column">
        <job-form
          v-if="jobCollection.actions.createPublish"
          :operation="jobCollection.actions.createPublish"
          class="box"
        />
      </div>
      <div class="column">
        <job-form
          v-if="jobCollection.actions.createUnlist"
          :operation="jobCollection.actions.createUnlist"
          :confirm="true"
          confirmation-message="Are you sure you want to unlist this cube? This operation is not reversible."
          submit-button-type="is-danger"
          class="box"
        />
      </div>
    </div>

    <div class="mt-6">
      <div class="is-flex is-align-items-center mb-3">
        <h3 class="title is-5 mb-0">
          Previous publications
        </h3>
      </div>
      <div v-if="jobs.length > 0" class="panel container-narrow">
        <job-item v-for="job in jobs" :key="job.clientPath" :job="job" class="panel-block">
          <div class="is-flex-grow-1 is-flex gap-1">
            <b-tag v-if="job.revision">
              Version {{ job.revision }}
            </b-tag>
            <b-tag v-if="job.status">
              <ExternalTerm :resource="job.status" />
            </b-tag>
            <b-tag v-if="job.publishedTo">
              <ExternalTerm :resource="job.publishedTo" />
            </b-tag>
          </div>
        </job-item>
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
import { JobCollection, PublishJob, UnlistJob } from '@cube-creator/model'
import * as storeNs from '../store/namespace'

@Component({
  components: { ExternalTerm, LoadingBlock, JobForm, JobItem },
})
export default class PublicationView extends Vue {
  @storeNs.app.State('language') language!: string[]
  @storeNs.project.State('jobCollection') jobCollection!: JobCollection | null;
  @storeNs.project.Getter('publicationJobs') jobs!: (PublishJob | UnlistJob)[]
}
</script>
