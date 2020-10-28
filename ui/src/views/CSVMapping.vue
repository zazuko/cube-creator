<template>
  <div v-if="mapping && sourcesCollection && tableCollection">
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
              <b-tooltip v-if="sourcesCollection.actions.upload" :label="sourcesCollection.actions.upload.title">
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
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                Output tables
              </div>
              <div class="level-item">
                <b-tooltip v-if="tableCollection.actions.create" :label="tableCollection.actions.create.title">
                  <b-button tag="router-link" :to="{ name: 'TableCreate' }" size="is-small" icon-left="plus" />
                </b-tooltip>
              </div>
            </div>
          </div>
        </h3>
      </div>
    </div>

    <div v-if="sources.length > 0" class="sources">
      <csv-source-mapping
        v-for="(source, index) in sources"
        :key="source.id.value"
        :source="source"
        :is-first-source="index === 0"
        :table-collection="tableCollection"
        :tables="tables"
      />
    </div>
    <p v-else>
      You haven't uploaded any CSV file yet.
      <span v-if="sourcesCollection.actions.upload">
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
    const project = this.$store.state.project.project
    this.$store.dispatch('project/fetchCSVMapping', project.csvMapping.id.value)
  },

  computed: {
    ...mapState({
      mapping: (state: any): CSVMapping | null => state.project.csvMapping,
      sourcesCollection: (state: any): SourcesCollection | null => state.project.sourcesCollection,
      tableCollection: (state: any): TableCollection | null => state.project.tableCollection,
    }),
    ...mapGetters({
      sources: 'project/sources',
      tables: 'project/tables',
    }),
  },
})
</script>
