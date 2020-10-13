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
              <b-tooltip v-if="canUploadSource" label="Upload new CSV file" type="is-light" :delay="200" size="is-small">
                <b-button tag="router-link" :to="{ name: 'CSVUpload' }" type="is-white" class="has-text-grey" size="is-small" icon-left="plus" />
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
      <div v-for="source in sources" :key="source.id.value" class="source">
        {{ source.name }}
      </div>
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
import { mapState } from 'vuex'
import { CSVMapping, Source, SourcesCollection } from '@/types'

export default Vue.extend({
  name: 'CSVMapping',

  async mounted () {
    const project = this.$store.state.cubeProjects.project
    const mapping = await this.$store.dispatch('cubeProjects/fetchCSVMapping', project.csvMapping.id.value)
    await this.$store.dispatch('cubeProjects/fetchSourcesCollection', mapping.sourcesCollection.id.value)
  },

  computed: {
    ...mapState({
      mapping: (state: any): CSVMapping | null => state.cubeProjects.csvMapping,
      sourcesCollection: (state: any): SourcesCollection | null => state.cubeProjects.sourcesCollection,
    }),

    sources () {
      return this.sourcesCollection?.member || []
    },

    canUploadSource (): boolean {
      return !!this.sourcesCollection?.actions.upload
    },
  },
})
</script>
