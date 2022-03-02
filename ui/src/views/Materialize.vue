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
import { defineComponent } from '@vue/composition-api'
import LoadingBlock from '@/components/LoadingBlock.vue'
import JobForm from '@/components/JobForm.vue'
import JobItem from '@/components/JobItem.vue'
import { JobCollection } from '@cube-creator/model'
import { RuntimeOperation } from 'alcaeus/Resources/Operation'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'PublicationView',
  components: { LoadingBlock, JobForm, JobItem },

  computed: {
    ...mapGetters('project', {
      hasCSVMapping: 'hasCSVMapping',
      jobs: 'transformJobs',
    }),

    jobCollection (): JobCollection {
      return this.$store.state.project.jobCollection
    },

    operation (): RuntimeOperation | null {
      return this.hasCSVMapping
        ? this.jobCollection.actions.createTransform
        : this.jobCollection.actions.createImport
    },
  },
})
</script>
