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
import { RuntimeOperation } from 'alcaeus'
import { defineComponent } from 'vue'
import { mapGetters, useStore } from 'vuex'

import { JobCollection } from '@cube-creator/model'

import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { usePolling } from '@/use-polling'

export default defineComponent({
  name: 'PublicationView',
  components: { LoadingBlock, JobForm, JobItem },

  setup () {
    const store = useStore()
    usePolling(() => store.dispatch('project/fetchJobCollection'))
  },

  computed: {
    ...mapGetters('project', {
      hasCSVMapping: 'hasCSVMapping',
      jobs: 'transformJobs',
    }),

    jobCollection (): JobCollection | null {
      return this.$store.state.project.jobCollection
    },

    operation (): RuntimeOperation | null {
      if (!this.jobCollection) return null

      return this.hasCSVMapping
        ? this.jobCollection.actions.createTransform
        : this.jobCollection.actions.createImport
    },
  },
})
</script>
