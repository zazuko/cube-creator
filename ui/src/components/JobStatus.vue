<template>
  <span v-if="showLabel" class="tag is-light" :class="typeClass">
    <o-icon :icon="icon" :class="iconColorClass" />
    <span>{{ label }}</span>
  </span>
  <o-icon v-else :icon="icon" :class="iconColorClass" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Job } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'

export default defineComponent({
  name: 'JobStatus',
  props: {
    job: {
      type: Object as PropType<Job>,
      required: true,
    },
    showLabel: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    statusString (): string {
      return this.job.actionStatus?.value ?? 'unknown'
    },

    icon (): string {
      return {
        [schema.CompletedActionStatus.value]: 'check-circle',
        [schema.PotentialActionStatus.value]: 'circle',
        [schema.ActiveActionStatus.value]: 'circle',
        [schema.FailedActionStatus.value]: 'times-circle',
      }[this.statusString] ?? 'question-circle'
    },

    iconColorClass (): string {
      return {
        [schema.CompletedActionStatus.value]: 'has-text-success',
        [schema.PotentialActionStatus.value]: 'has-text-grey-light blink',
        [schema.ActiveActionStatus.value]: 'has-text-info blink',
        [schema.FailedActionStatus.value]: 'has-text-danger',
      }[this.statusString] ?? 'has-text-dark'
    },

    typeClass (): string {
      return {
        [schema.CompletedActionStatus.value]: 'is-success',
        [schema.PotentialActionStatus.value]: 'is-light',
        [schema.ActiveActionStatus.value]: 'is-info',
        [schema.FailedActionStatus.value]: 'is-danger',
      }[this.statusString] ?? 'is-default'
    },

    label (): string {
      return {
        [schema.CompletedActionStatus.value]: 'Complete',
        [schema.PotentialActionStatus.value]: 'Pending',
        [schema.ActiveActionStatus.value]: 'Running',
        [schema.FailedActionStatus.value]: 'Failed',
      }[this.statusString] ?? 'Unknown'
    },
  },
})
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
