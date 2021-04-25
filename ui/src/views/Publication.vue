<template>
  <div v-if="jobCollection">
    <div class="container-narrow">
      <job-form
        v-if="jobCollection.actions.createPublish"
        :operation="jobCollection.actions.createPublish"
        class="box"
      />
    </div>

    <div class="jobs content">
      <div class="is-flex is-align-items-center mb-3">
        <h3 class="title is-5 mb-0">
          Previous publications
        </h3>
      </div>
      <div v-if="jobs.length > 0" class="panel container-narrow">
        <job-item v-for="job in jobs" :key="job.clientPath" :job="job">
          <div>
            <p class="heading">
              Version
            </p>
            <p>
              {{ job.revision }}
            </p>
          </div>
          <div>
            <p class="heading">
              Status
            </p>
            <ExternalResource :resource-id="job.status" />
          </div>
          <div>
            <p class="heading">
              Published To
            </p>
            <p>
              <ExternalResource :resource-id="job.publishedTo" />
            </p>
          </div>
          <div>
            <a v-if="job.query" :href="job.query" target="_blank" class="has-text-grey">
              Open in LINDAS
            </a>
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
import { namespace } from 'vuex-class'
import LoadingBlock from '@/components/LoadingBlock.vue'
import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import ExternalResource from '@/components/ExternalResource.vue'
import { JobCollection, PublishJob } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { LoadingBlock, JobForm, JobItem, ExternalResource },
})
export default class PublicationView extends Vue {
  @projectNS.State('jobCollection') jobCollection!: JobCollection | null;
  @projectNS.Getter('publishJobs') jobs!: PublishJob[]
}
</script>

<style>
.jobs {
  margin-top: 2.5rem;
}
</style>
