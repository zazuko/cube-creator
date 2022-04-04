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
          submit-button-variant="danger"
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
        <job-item v-for="job in jobs" :key="job.clientPath" :job="job" detail-view="PublicationJob" class="panel-block">
          <div class="is-flex-grow-1 is-flex gap-1">
            <span v-if="job.revision" class="tag">
              Version {{ job.revision }}
            </span>
            <span v-if="job.status" class="tag">
              <external-term :resource="job.status" />
            </span>
            <span v-if="job.publishedTo" class="tag">
              <external-term :resource="job.publishedTo" />
            </span>
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
import { defineComponent } from 'vue'
import { mapGetters, useStore } from 'vuex'

import { JobCollection } from '@cube-creator/model'

import ExternalTerm from '@/components/ExternalTerm.vue'
import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { usePolling } from '@/use-polling'

export default defineComponent({
  name: 'PublicationView',
  components: { ExternalTerm, LoadingBlock, JobForm, JobItem },

  setup () {
    const store = useStore()
    usePolling(() => store.dispatch('project/fetchJobCollection'))
  },

  computed: {
    ...mapGetters('project', {
      jobs: 'publicationJobs',
    }),

    language (): string[] {
      return this.$store.state.app.language
    },

    jobCollection (): JobCollection | null {
      return this.$store.state.project.jobCollection
    },
  },
})
</script>
