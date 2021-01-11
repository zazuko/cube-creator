<template>
  <div class="panel-block job">
    <job-icon :job="job" />
    <div class="ml-3 is-flex-grow-1">
      <span>{{ job.name }}</span><br>
      <span class="has-text-grey">{{ job.created | format-date }}</span>
    </div>
    <a v-if="job.link" :href="job.link.id.value" target="_blank" class="has-text-grey is-flex">
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
}
</script>
