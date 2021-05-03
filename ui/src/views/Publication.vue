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
          <div class="is-flex-grow-1 is-flex gap-1">
            <b-tag v-if="job.revision">
              Version {{ job.revision }}
            </b-tag>
            <b-tag v-if="job.status">
              <TermDisplay :term="job.status" />
            </b-tag>
            <b-tag v-if="job.publishedTo">
              <TermDisplay :term="job.publishedTo" />
            </b-tag>
          </div>

          <template #actions>
            <a v-if="job.query" :href="job.query" target="_blank" rel="noopener" class="button is-small">
              <span>Open in LINDAS</span>
              <b-icon icon="chevron-right" />
            </a>
          </template>
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
import TermDisplay from '@/components/TermDisplay.vue'
import { JobCollection, PublishJob } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { LoadingBlock, JobForm, JobItem, TermDisplay },
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
