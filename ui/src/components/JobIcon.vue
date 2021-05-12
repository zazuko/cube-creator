<template>
  <span class="job-icon">
    <b-icon :icon="icon" :class="color" />
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Job } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

@Component
export default class extends Vue {
  @Prop({ required: true }) job!: Job

  get icon (): string {
    if (this.job.types.has(cc.PublishJob)) {
      return 'upload'
    } else if (this.job.types.has(cc.TransformJob)) {
      return 'random'
    } else if (this.job.types.has(cc.ImportJob)) {
      return 'file-import'
    } else {
      return 'circle'
    }
  }

  get color (): string {
    const status = this.job.actionStatus?.value ?? 'unknown'

    return {
      [schema.CompletedActionStatus.value]: 'has-text-success',
      [schema.PotentialActionStatus.value]: 'has-text-grey-light',
      [schema.ActiveActionStatus.value]: 'has-text-info blink',
      [schema.FailedActionStatus.value]: 'has-text-danger',
      unknown: 'has-text-dark',
    }[status]
  }
}
</script>

<style scoped>
.blink {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
