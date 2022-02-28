<template>
  <side-pane title="Preview table mapping (CSVW)" @close="onCancel">
    <b-message v-show="csvw.error" type="is-danger">
      {{ csvw.error }}
    </b-message>

    <div v-if="csvw.data">
      <div class="is-flex is-justify-content-space-between">
        <o-field>
          <radio-button
            v-for="format in formats"
            :key="format.value"
            :native-value="format.value"
            v-model="selectedFormat"
            size="small"
          >
            {{ format.label }}
          </radio-button>
        </o-field>
        <o-button size="small" icon-left="clipboard" @click="copy">
          Copy
        </o-button>
      </div>
      <rdf-editor
        :quads.prop="csvw.data"
        :format="selectedFormat"
        :prefixes="editorPrefixes"
        ref="snippet"
        readonly
      />
    </div>

    <loading-block v-show="csvw.isLoading" />
  </side-pane>
</template>

<script lang="ts">
import '@rdfjs-elements/rdf-editor'
import { Quad } from 'rdf-js'
import { Vue, Component } from 'vue-property-decorator'
import BMessage from '@/components/BMessage.vue'
import SidePane from '@/components/SidePane.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import RadioButton from '@/components/RadioButton.vue'
import { Table } from '@cube-creator/model'
import Remote, { RemoteData } from '@/remote'
import * as storeNs from '../store/namespace'

@Component({
  components: { BMessage, SidePane, LoadingBlock, RadioButton },
})
export default class TableCreateView extends Vue {
  @storeNs.project.Getter('findTable') findTable!: (id: string) => Table | null

  csvw: RemoteData<Quad[]> = Remote.loading()
  selectedFormat = 'application/ld+json'
  formats = [
    { label: 'JSON-LD', value: 'application/ld+json' },
    { label: 'Turtle', value: 'text/turtle' },
    { label: 'N-Triples', value: 'application/n-triples' },
  ]

  editorPrefixes = ['hydra', 'rdf', 'rdfs', 'schema', 'xsd']

  get table (): Table | null {
    const tableId = this.$route.params.tableId
    return this.findTable(tableId)
  }

  async mounted (): Promise<void> {
    if (!this.table?.csvw.load) {
      this.csvw = Remote.error('Could not load CSVW')
      return
    }

    const { representation } = await this.table.csvw.load()
    if (!representation || !representation.root) {
      this.csvw = Remote.error('Could not load CSVW')
      return
    }

    const csvw = representation.root.pointer.dataset
    this.csvw = Remote.loaded([...csvw])
  }

  async copy (): Promise<void> {
    const snippet = this.$refs.snippet as any
    const content = snippet.codeMirror.value
    await navigator.clipboard.writeText(content)
    this.$buefy.toast.open('Copied 👍')
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>

<style scoped>
rdf-editor::part(CodeMirror-vscrollbar) {
  display: none;
}
</style>
