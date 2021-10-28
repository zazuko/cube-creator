<template>
  <div v-if="job" class="is-flex is-flex-direction-column gap-4">
    <header class="">
      <h2 class="title is-5 mb-2 is-flex is-align-items-center gap-2">
        {{ job.name }}
        <job-status :job="job" :show-label="true" />
      </h2>
      <p class="has-text-grey-dark">
        Triggered at {{ job.created | format-date }}
      </p>
      <p v-if="job.error && job.error.disambiguatingDescription" class="has-background-danger-light">
        {{ job.error.disambiguatingDescription }}
      </p>
    </header>
    <div class="is-flex gap-1">
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
    <div class="is-flex gap-1">
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
        <b-icon icon="external-link-alt" />
      </a>
    </div>
    <div>
      <a :disabled="!link" :href="link" target="_blank" rel="noopener noreferer" class="button is-small mb-1">
        <b-icon icon="book" />
        <span>View full log</span>
      </a>
      <pre v-if="error" v-show="error" class="has-background-danger-light">
        {{ error.description }}
      </pre>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Job } from '@cube-creator/model'
import type { CreativeWork, Thing } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Component, Vue } from 'vue-property-decorator'
import ExternalTerm from '@/components/ExternalTerm.vue'
import JobStatus from '../components/JobStatus.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { ExternalTerm, JobStatus, LoadingBlock },
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

  get error (): Thing | undefined {
    return this.job?.error
  }
}
</script>

<style scoped>
  a[disabled] {
    cursor: not-allowed;
  }

  div:empty {
    display: none !important;
  }
</style>
