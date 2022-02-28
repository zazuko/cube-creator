<template>
  <router-link class="is-flex gap-3" :to="{ name: detailView, params: { jobId: job.clientPath } }" title="Details">
    <job-status :job="job" />
    <div class="is-flex-grow-1 is-flex is-align-items-center gap-4">
      <div>
        <span>{{ job.name }}</span><br>
        <span class="has-text-grey">{{ job.created | format-date }}</span>
      </div>
      <slot />
    </div>
    <o-icon icon="chevron-right" />
  </router-link>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Job } from '@cube-creator/model'
import JobStatus from './JobStatus.vue'

@Component({
  components: { JobStatus },
})
export default class extends Vue {
  @Prop() job!: Job
  @Prop({ default: 'Job' }) detailView!: string
}
</script>
