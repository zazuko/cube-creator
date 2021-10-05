<template>
  <b-icon :icon="icon" />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Job } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'

@Component
export default class JobIcon extends Vue {
  @Prop({ required: true }) job!: Job
  @Prop({ default: false }) showLabel!: boolean

  get icon (): string {
    if (this.job.types.has(cc.PublishJob)) {
      return 'upload'
    } else if (this.job.types.has(cc.UnlistJob)) {
      return 'eye-slash'
    } else if (this.job.types.has(cc.TransformJob)) {
      return 'random'
    } else if (this.job.types.has(cc.ImportJob)) {
      return 'file-import'
    } else {
      return 'circle'
    }
  }
}
</script>
