<template>
  <div class="panel-block gap-3">
    <job-icon :job="job" />
    <div class="is-flex-grow-1 is-flex is-align-items-center gap-3">
      <div>
        <span>{{ job.name }}</span><br>
        <span class="has-text-grey">{{ job.created | format-date }}</span>
      </div>
      <slot />
    </div>
    <div class="is-flex gap-1">
      <slot name="actions" />
      <a :disabled="!link" :href="link" target="_blank" class="button is-small">
        <span>Logs</span>
        <b-icon icon="chevron-right" />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Job } from '@cube-creator/model'
import JobIcon from './JobIcon.vue'

@Component({
  components: { JobIcon },
})
export default class extends Vue {
  @Prop() job!: Job

  get link (): string | undefined {
    return this.job.link?.id.value
  }
}
</script>

<style scoped>
  a[disabled] {
    cursor: not-allowed;
  }
</style>
