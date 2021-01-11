<template>
  <span class="field" :class="{ 'has-addons': transformJobs.length > 0 }">
    <b-button v-if="jobCollection.actions.createTransform" class="control" icon-left="play" size="is-small" @click="transform" :loading="isTransforming">
      Transform
    </b-button>
    <b-dropdown v-if="transformJobs.length > 0" position="is-bottom-left" class="control">
      <b-tooltip label="Previous jobs" slot="trigger" position="is-left">
        <button class="button is-small">
          <job-icon :job="transformJobs[0]" />
        </button>
      </b-tooltip>
      <b-dropdown-item :focusable="false" custom paddingless>
        <job-item v-for="job in transformJobs" :key="job.clientPath" :job="job" />
      </b-dropdown-item>
    </b-dropdown>
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Job, JobCollection } from '@cube-creator/model'
import JobItem from './JobItem.vue'
import JobIcon from './JobIcon.vue'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import clownface from 'clownface'
import { dataset } from '@rdf-esm/dataset'

@Component({
  components: { JobItem, JobIcon },
})
export default class TransformJobButton extends Vue {
  @Prop({ required: true }) jobCollection!: JobCollection
  @Prop({ required: true }) transformJobs!: Job[]

  isTransforming = false

  async transform (): Promise<void> {
    // Artifically disable the button for a while
    // Not using the latest job status to avoid preventing starting new jobs
    // if a job stays blocked in "running" state
    this.isTransforming = true
    setTimeout(() => { this.isTransforming = false }, 3000)

    const operation = this.jobCollection.actions.createTransform
    if (!operation) throw new Error('Transform operation not found')

    const resourceType = operation.expects.find((expect: any) => !expect.types.has(sh.Shape))
    if (!resourceType) throw new Error('Operation expected type not found')

    const resource = clownface({ dataset: dataset() })
      .namedNode('')
      .addOut(rdf.type, resourceType.id)

    try {
      await this.$store.dispatch('api/invokeSaveOperation', { operation, resource })

      this.$buefy.toast.open({
        message: 'Transformation was started',
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
