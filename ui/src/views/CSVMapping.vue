<template>
  <div v-if="mapping">
    <div class="columns">
      <div class="column">
        <div class="level">
          <div class="level-left">
            <div class="level-item">
              <h3 class="title is-6">
                Input CSVs
              </h3>
            </div>
            <div class="level-item">
              <b-tooltip v-if="canUploadSource" label="Upload new CSV file">
                <b-button tag="router-link" :to="{ name: 'CSVUpload' }" size="is-small" icon-left="plus" />
              </b-tooltip>
            </div>
          </div>
          <div class="level-right">
            <!-- <p class="level-item">
              Filter columns:
            </p>
            <b-field class="level-item">
              <b-radio-button v-model="columnFilter" native-value="all" size="is-small">
                All
              </b-radio-button>
              <b-radio-button v-model="columnFilter" native-value="mapped" size="is-small">
                Mapped
              </b-radio-button>
              <b-radio-button v-model="columnFilter" native-value="not-mapped" size="is-small">
                Not mapped
              </b-radio-button>
            </b-field> -->
          </div>
        </div>
      </div>
      <div class="column is-1">
        <p class="has-text-centered">
          <b-icon icon="arrow-right" size="is-small" />
        </p>
      </div>
      <div class="column">
        <h3 class="title is-6">
          Output tables
        </h3>
      </div>
    </div>

    <div v-if="sources.length > 0" class="sources">
      <csv-source-mapping v-for="source in sources" :key="source.id.value" :source="source" :tables="tables" />
    </div>
    <p v-else>
      You haven't uploaded any CSV file yet.
      <span v-if="canUploadSource">
        Do you want to
        <router-link :to="{ name: 'CSVUpload' }">
          upload one
        </router-link>?
      </span>
    </p>

    <router-view />
  </div>
  <b-loading v-else active :is-full-page="false" />
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import CsvSourceMapping from '@/components/CsvSourceMapping.vue'
import { CSVMapping, SourcesCollection, TableCollection } from '../types'

export default Vue.extend({
  name: 'CSVMapping',
  components: { CsvSourceMapping },

  mounted () {
    const project = this.$store.state.cubeProjects.project
    this.$store.dispatch('cubeProjects/fetchCSVMapping', project.csvMapping.id.value)
  },

  computed: {
    ...mapState({
      mapping: (state: any): CSVMapping | null => state.cubeProjects.csvMapping,
      sourcesCollection: (state: any): SourcesCollection | null => state.cubeProjects.sourcesCollection,
      tableCollection: (state: any): TableCollection | null => state.cubeProjects.tableCollection,
    }),
    ...mapGetters({
      sources: 'cubeProjects/sources',
      tables: 'cubeProjects/tables',
    }),

    canUploadSource (): boolean {
      return !!this.sourcesCollection?.actions.upload
    },
  },
})
</script>
