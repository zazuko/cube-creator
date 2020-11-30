<template>
  <div v-if="mapping && jobCollection">
    <job-form
      v-if="jobCollection.actions.create"
      :operation="jobCollection.actions.create"
      class="box container-narrow"
    />

    <div class="jobs content" v-show="jobs.length > 0">
      <h3 class="title is-5">
        Previous jobs
      </h3>
      <ul>
        <li v-for="job in jobs" :key="job.id.value">
          {{ job.created | format-date }} ({{ job.name }})
        </li>
      </ul>
    </div>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import LoadingBlock from '@/components/LoadingBlock.vue'
import JobForm from '@/components/JobForm.vue'
import { CsvMapping, JobCollection, Job } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { LoadingBlock, JobForm },
})
export default class CubeDesignerView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping | null;
  @projectNS.State('jobCollection') jobCollection!: JobCollection | null;
  @projectNS.Getter('jobs') jobs!: Job[];

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCSVMapping')
    this.$store.dispatch('project/fetchJobCollection')
  }
}
</script>
