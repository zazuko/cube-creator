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
              <hydra-operation-button :operation="sourcesCollection.actions.upload" :to="{ name: 'CSVUpload' }" />
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
                <hydra-operation-button
                  :operation="tableCollection.actions.create"
                  :to="{ name: 'TableCreate' }"
                  :disabled="sources.length === 0"
                />
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
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import CsvSourceMapping from '@/components/CsvSourceMapping.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { CSVMapping, SourcesCollection, TableCollection, Table, Source } from '../types'

const projectNS = namespace('project')

@Component({
  components: { CsvSourceMapping, HydraOperationButton, LoadingBlock },
})
export default class CSVMappingView extends Vue {
  @projectNS.State('csvMapping') mapping!: CSVMapping | null;
  @projectNS.State('sourcesCollection') sourcesCollection!: SourcesCollection | null;
  @projectNS.State('tableCollection') tableCollection!: TableCollection | null;
  @projectNS.Getter('sources') sources!: Source[];
  @projectNS.Getter('tables') tables!: Table[];

  mounted (): void {
    this.$store.dispatch('project/fetchCSVMapping')
  }
}
</script>
