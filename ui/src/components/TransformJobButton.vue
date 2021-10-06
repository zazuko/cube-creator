<template>
  <span class="field" :class="{ 'has-addons': transformJobs.length > 0 }">
    <b-button
      v-if="operation"
      class="control"
      icon-left="play"
      size="is-small"
      @click="startJob"
      :loading="isStartingJob"
    >
      {{ operationLabel }}
    </b-button>
    <b-dropdown
      v-if="transformJobs.length > 0"
      position="is-bottom-left"
      class="control"
      scrollable
      max-height="400"
      trap-focus
    >
      <b-tooltip label="Previous jobs" slot="trigger" position="is-left">
        <button class="button is-small">
          <job-status :job="transformJobs[0]" />
        </button>
      </b-tooltip>
      <b-dropdown-item v-for="job in transformJobs" :key="job.clientPath" has-link paddingless class="is-flex">
        <job-item :job="job" class="px-3" />
      </b-dropdown-item>
    </b-dropdown>
  </span>
</template>

<script lang="ts">
import { Job, JobCollection } from '@cube-creator/model'
import { dataset } from '@rdf-esm/dataset'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { RdfResource, RuntimeOperation } from 'alcaeus'
import clownface from 'clownface'
import { Vue, Component, Prop } from 'vue-property-decorator'
import JobItem from './JobItem.vue'
import JobStatus from './JobStatus.vue'

@Component({
  components: { JobItem, JobStatus },
})
export default class TransformJobButton extends Vue {
  @Prop({ required: true }) jobCollection!: JobCollection
  @Prop({ required: true }) transformJobs!: Job[]
  @Prop({ required: true }) hasCsvMapping!: boolean

  isStartingJob = false

  get operation (): RuntimeOperation | null {
    return this.hasCsvMapping
      ? this.jobCollection.actions.createTransform
      : this.jobCollection.actions.createImport
  }

  get operationLabel (): string {
    return this.hasCsvMapping
      ? 'Transform'
      : 'Import'
  }

  async startJob (): Promise<void> {
    const operation = this.operation

    if (!operation) return

    // Artifically disable the button for a while
    // Not using the latest job status to avoid preventing starting new jobs
    // if a job stays blocked in "running" state
    this.isStartingJob = true
    setTimeout(() => { this.isStartingJob = false }, 3000)

    const resourceType = operation.expects.find((expect: RdfResource) => !expect.types.has(sh.Shape))
    if (!resourceType) throw new Error('Operation expected type not found')

    const resource = clownface({ dataset: dataset() })
      .namedNode('')
      .addOut(rdf.type, resourceType.id)

    try {
      await this.$store.dispatch('api/invokeSaveOperation', { operation, resource })

      this.$buefy.toast.open({
        message: `${this.operationLabel} was started`,
        type: 'is-success',
      })

      this.$store.dispatch('project/fetchJobCollection')
    } catch (e) {
      this.$store.dispatch('app/showMessage', {
        title: 'An error occurred',
        message: e.toString(),
        type: 'is-danger',
      })
    }
  }
}
</script>
