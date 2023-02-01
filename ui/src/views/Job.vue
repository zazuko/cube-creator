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
      <b-message v-if="error.disambiguatingDescription" type="is-danger" class="mb-2">
        {{ error.disambiguatingDescription }}
      </b-message>
      <b-message v-for="comment in job.comments" :key="comment" type="is-warning" class="mb-2">
        <markdown-render :source="comment" />
      </b-message>
      <o-tooltip label="Only accessible for technical users" position="right">
        <a :disabled="!link" :href="link" target="_blank" rel="noopener noreferer" class="button is-small mb-1">
          <o-icon icon="book" />
          <span>View full log</span>
        </a>
      </o-tooltip>
      <pre v-if="error.description" class="has-background-danger-light">
        {{ error.description }}
      </pre>
      <b-message v-if="error.validationReport" type="is-danger">
        <template #header>
          <p>
            Validation error
            <a v-if="error.url" :href="error.url.value" target="_blank">
              Open in SHACL UI
              <o-icon icon="external-link-alt" />
            </a>
          </p>
        </template>
        <validation-report-display :report="error.validationReport" />
      </b-message>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import type { CreativeWork } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { computed, defineComponent, shallowRef } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import { api } from '@/api'
import BMessage from '@/components/BMessage.vue'
import ExternalTerm from '@/components/ExternalTerm.vue'
import JobStatus from '@/components/JobStatus.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import '@/customElements/MarkdownRender'
import ValidationReportDisplay from '@/components/ValidationReportDisplay.vue'
import { RootState } from '@/store/types'
import { usePolling } from '@/use-polling'

export default defineComponent({
  name: 'JobView',
  components: { BMessage, ExternalTerm, JobStatus, LoadingBlock, ValidationReportDisplay },

  setup () {
    const store = useStore<RootState>()
    const route = useRoute()

    const findJob = store.getters['project/findJob']
    const jobId = route.params.jobId as string
    const job = shallowRef(findJob(jobId))
    const link = computed(() => job.value?.link?.id.value)
    const createdDate = computed(() => job.value?.created.toLocaleString() ?? '')
    const error = computed(() => job.value?.errors[0] || {})

    usePolling(async () => {
      job.value = await api.fetchResource(jobId)
    })

    const language = store.state.app.language

    return {
      job,
      error,
      language,
      link,
      createdDate,
    }
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
