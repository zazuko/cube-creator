<template>
  <div v-if="job" class="is-flex is-flex-direction-column gap-4">
    <header>
      <h2 class="title is-5">
        <job-icon :job="job" :show-label="true" />
        {{ job.name }}
        <span class="has-text-weight-normal"> - {{ job.created | format-date }}</span>
      </h2>
      <job-status :job="job" :show-label="true" />
    </header>
    <div class="is-flex gap-1">
      <a :disabled="!link" :href="link" target="_blank" class="button is-small">
        <span>Logs</span>
        <b-icon icon="chevron-right" />
      </a>
      <!-- Support for legacy job.query -->
      <a v-if="job.query" :href="job.query" target="_blank" rel="noopener" class="button is-small">
        <span>Open in LINDAS</span>
        <b-icon icon="chevron-right" />
      </a>
      <a
        v-for="workExample in job.workExamples"
        :key="workExample.id.value"
        :href="workExample.url.value"
        target="_blank"
        rel="noopener"
        class="button is-small"
      >
        <span>{{ workExampleLabel(workExample) }}</span>
        <b-icon icon="chevron-right" />
      </a>
    </div>
    <div v-show="job.error" class="section has-background-danger-light">
      {{ job.error }}
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Job } from '@cube-creator/model'
import { CreativeWork } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Component, Vue } from 'vue-property-decorator'
import JobIcon from '../components/JobIcon.vue'
import JobStatus from '../components/JobStatus.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { JobIcon, JobStatus, LoadingBlock },
})
export default class JobView extends Vue {
  @storeNs.app.State('language') language!: string[]
  @storeNs.project.Getter('findJob') findJob!: (id: string) => Job

  get job (): Job | undefined {
    const jobId = this.$route.params.jobId
    return this.findJob(jobId)
  }

  workExampleLabel (workExample: CreativeWork): string {
    return workExample.pointer.out(schema.name, { language: this.language }).value || 'Example'
  }

  get link (): string | undefined {
    return this.job?.link?.id.value
  }
}
</script>

<style scoped>
  a[disabled] {
    cursor: not-allowed;
  }
</style>
