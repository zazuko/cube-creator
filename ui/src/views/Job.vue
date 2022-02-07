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
      <b-message v-if="job.error && job.error.disambiguatingDescription" type="is-danger" class="mb-2">
        {{ job.error.disambiguatingDescription }}
      </b-message>
      <b-message v-for="comment in job.comments" :key="comment" type="is-warning" class="mb-2">
        <vue-markdown :source="comment" />
      </b-message>
      <a :disabled="!link" :href="link" target="_blank" rel="noopener noreferer" class="button is-small mb-1">
        <b-icon icon="book" />
        <span>View full log</span>
      </a>
      <pre v-if="job.error && job.error.description" class="has-background-danger-light">
        {{ job.error.description }}
      </pre>
      <b-message v-if="job.error && job.error.validationReport" type="is-danger" title="Validation error" :closable="false">
        <validation-report-display :report="job.error.validationReport" />
      </b-message>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Job } from '@cube-creator/model'
import type { CreativeWork } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Component, Vue } from 'vue-property-decorator'
import VueMarkdown from 'vue-markdown/src/VueMarkdown'
import ExternalTerm from '@/components/ExternalTerm.vue'
import JobStatus from '../components/JobStatus.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import ValidationReportDisplay from '../components/ValidationReportDisplay.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { ExternalTerm, JobStatus, LoadingBlock, ValidationReportDisplay, VueMarkdown },
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

  div:empty {
    display: none !important;
  }
</style>
