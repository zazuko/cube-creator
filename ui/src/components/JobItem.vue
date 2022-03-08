<template>
  <router-link class="is-flex gap-3" :to="{ name: detailView, params: { jobId: job.clientPath } }" title="Details">
    <job-status :job="job" />
    <div class="is-flex-grow-1 is-flex is-align-items-center gap-4">
      <div>
        <span>{{ job.name }}</span><br>
        <span class="has-text-grey">{{ createdDate }}</span>
      </div>
      <slot />
    </div>
    <o-icon icon="chevron-right" />
  </router-link>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Job } from '@cube-creator/model'
import JobStatus from './JobStatus.vue'

export default defineComponent({
  name: 'JobItem',
  components: { JobStatus },
  props: {
    job: {
      type: Object as PropType<Job>,
      required: true,
    },
    detailView: {
      type: String,
      default: 'Job',
    },
  },

  computed: {
    createdDate (): string {
      return this.job.created.toLocaleString()
    },
  },
})
</script>
