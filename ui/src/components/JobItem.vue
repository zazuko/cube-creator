<template>
  <div class="panel-block job">
    <job-icon :job="job" />
    <div class="ml-3">
      <span>{{ job.name }}</span><br>
      <span class="has-text-grey">{{ job.created | format-date }}</span>
    </div>
    <slot />
    <a :disabled="!link" :href="link" target="_blank" class="has-text-grey is-flex">
      Logs <b-icon icon="chevron-right" />
    </a>
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

  get link () {
    return this.job.link?.id.value
  }
}
</script>

<style scoped>
  .panel-block {
    display: flex;
  }

  .panel-block > div {
    flex: 1;
  }

  a[disabled] {
    cursor: not-allowed;
  }
</style>
