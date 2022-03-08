<template>
  <div v-if="job" class="is-flex is-flex-direction-column gap-4">
    <header class="">
      <h2 class="title is-5 mb-2 is-flex is-align-items-center gap-2">
        {{ job.name }}
        <job-status :job="job" :show-label="true" />
      </h2>
      <p class="has-text-grey-dark">
        Triggered at {{ createdDate }}
      </p>
    </header>
    <div class="is-flex gap-1">
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
    <div class="is-flex gap-1">
      <a v-if="job.query" :href="job.query" target="_blank" rel="noopener" class="button is-small">
        <span>Open in LINDAS</span>
        <o-icon icon="chevron-right" />
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
        <o-icon icon="external-link-alt" />
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
        <o-icon icon="book" />
        <span>View full log</span>
      </a>
      <pre v-if="job.error && job.error.description" class="has-background-danger-light">
        {{ job.error.description }}
      </pre>
      <b-message v-if="job.error && job.error.validationReport" type="is-danger" title="Validation error">
        <validation-report-display :report="job.error.validationReport" />
      </b-message>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { Job } from '@cube-creator/model'
import type { CreativeWork } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import VueMarkdown from 'vue-markdown/src/VueMarkdown'
import BMessage from '@/components/BMessage.vue'
import ExternalTerm from '@/components/ExternalTerm.vue'
import JobStatus from '../components/JobStatus.vue'
import LoadingBlock from '../components/LoadingBlock.vue'
import ValidationReportDisplay from '../components/ValidationReportDisplay.vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'JobView',
  components: { BMessage, ExternalTerm, JobStatus, LoadingBlock, ValidationReportDisplay, VueMarkdown },

  computed: {
    ...mapGetters('project', {
      findJob: 'findJob',
    }),

    language (): string[] {
      return this.$store.state.app.language
    },

    job (): Job | undefined {
      const jobId = this.$route.params.jobId
      return this.findJob(jobId)
    },

    link (): string | undefined {
      return this.job?.link?.id.value
    },

    createdDate (): string {
      return this.job?.created.toLocaleString() ?? ''
    },
  },

  methods: {
    workExampleLabel (workExample: CreativeWork): string {
      return workExample.pointer.out(schema.name, { language: this.language }).value || 'Example'
    },
  },
})
</script>

<style scoped>
  a[disabled] {
    cursor: not-allowed;
  }

  div:empty {
    display: none !important;
  }
</style>
