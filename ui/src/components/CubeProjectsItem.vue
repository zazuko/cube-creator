<template>
  <div class="is-flex is-flex-direction-column is-align-items-stretch p-0">
    <div class="grid p-2">
      <div>
        <router-link
          :to="{ name: 'CubeProject', params: { id: project.clientPath } }"
          class="is-block has-text-weight-bold"
          title="Open project"
        >
          {{ project.label }}
        </router-link>
        <p class="is-size-7" title="Cube identifier">
          {{ project.cubeIdentifier || (project.sourceCube && project.sourceCube.value) }}
        </p>
      </div>
      <div>
        <div v-if="project.plannedNextUpdate">
          <p>Next update in</p>
          <span :class="nextUpdateWarning(project.plannedNextUpdate)">
            {{ timeUntilNextUpdate(project.plannedNextUpdate) }}
          </span>
        </div>
      </div>
      <div class="is-flex is-align-items-center gap-2 owners">
        <div v-if="project.maintainer" class="is-flex is-flex-direction-column is-align-items-flex-end">
          <p class="tag">
            {{ project.maintainer.displayLabel }}
          </p>
          <p class="is-size-7 pr-2" v-if="project.creator && project.creator.name">
            {{ project.creator.name }}
          </p>
        </div>
        <o-tooltip class="is-block" label="More details">
          <o-button icon-left="info-circle" variant="white" size="small" @click="toggleDetails" />
        </o-tooltip>
      </div>
    </div>
    <o-collapse animation="slide" :open="detailsShown">
      <!-- A bug in Oruga makes the trigger slot mandatory -->
      <template #trigger />
      <table v-if="details" class="table is-fullwidth has-background-light">
        <tr v-for="part in details.parts" :key="part.id.value" class="is-size-7">
          <th class="w-1/3">
            {{ part.name }}
          </th>
          <td>
            <span v-for="(value, index) in part.values" :key="index">
              <external-term :resource="value" />
              <span v-if="index !== part.values.length - 1">, </span>
            </span>
            <span v-if="part.values.length === 0">-</span>
          </td>
        </tr>
      </table>
      <loading-block v-else />
    </o-collapse>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'
import humanizeDuration, { HumanizerOptions } from 'humanize-duration'
import { Project } from '@cube-creator/model'
import { RdfResource } from 'alcaeus'

import LoadingBlock from '../components/LoadingBlock.vue'
import ExternalTerm from '../components/ExternalTerm.vue'

const msInDay = /* hours */ 24 * /* seconds */ 3600 * /* milliseconds */ 1000
const twentyDays = 20 * msInDay
const thirtyDays = 30 * msInDay

export default defineComponent({
  name: 'CubeProjectsItem',
  components: { LoadingBlock, ExternalTerm },
  props: {
    project: {
      type: Object as PropType<Project>,
      required: true,
    }
  },

  data () {
    return {
      detailsShown: false,
    }
  },

  computed: {
    ...mapGetters({
      getDetails: 'projects/getProjectDetails',
    }),

    details (): RdfResource | null {
      return this.getDetails(this.project)
    },
  },

  methods: {
    toggleDetails (): void {
      if (!this.detailsShown) {
        this.$store.dispatch('projects/fetchProjectDetails', this.project)
      }

      this.detailsShown = !this.detailsShown
    },

    timeUntilNextUpdate (nextUpdate: Date) {
      const duration = nextUpdate.valueOf() - new Date().valueOf()

      let sign = ''
      if (duration < 0) {
        sign = '- '
      }

      const options: HumanizerOptions = { largest: 1, round: true }
      if (duration < thirtyDays) {
        options.units = ['d']
      }

      return sign + humanizeDuration(duration, options)
    },

    nextUpdateWarning (nextUpdate: Date) {
      const duration = nextUpdate.valueOf() - new Date().valueOf()
      if (duration < twentyDays) {
        return 'has-background-warning'
      }

      return ''
    }
  },
})
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: 5fr 2fr 1fr;
}

.owners {
  text-align: right;
}
</style>
