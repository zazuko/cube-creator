<template>
  <side-pane is-open title="Preview table mapping (CSVW)" @close="onCancel" class="side-pane-csvw">
    <b-message v-show="csvw.error" type="is-danger">
      {{ csvw.error }}
    </b-message>

    <div v-if="csvw.data">
      <div class="is-flex is-justify-content-space-between">
        <b-field>
          <b-radio-button
            v-for="format in formats"
            :key="format.value"
            :native-value="format.value"
            v-model="selectedFormat"
            size="is-small"
          >
            {{ format.label }}
          </b-radio-button>
        </b-field>
        <b-button size="is-small" icon-left="clipboard" @click="copy">
          Copy
        </b-button>
      </div>
      <rdf-editor :serialized.prop="csvw.data" :format="selectedFormat" ref="snippet" readonly />
    </div>

    <loading-block v-show="csvw.isLoading" />
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import '@rdfjs-elements/rdf-editor'
import SidePane from '@/components/SidePane.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { Table } from '@cube-creator/model'
import Remote, { RemoteData } from '@/remote'

const projectNS = namespace('project')

@Component({
  components: { SidePane, LoadingBlock },
})
export default class TableCreateView extends Vue {
  @projectNS.Getter('findTable') findTable!: (id: string) => Table | null

  csvw: RemoteData<string> = Remote.loading()
  selectedFormat = 'application/ld+json'
  formats = [
    { label: 'JSON-LD', value: 'application/ld+json' },
    { label: 'Turtle', value: 'text/turtle' },
    { label: 'N-Triples', value: 'application/n-triples' },
  ]

  get table (): Table | null {
    const tableId = this.$router.currentRoute.params.tableId
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

    const csvw = representation.root.toJSON()
    const csvwString = JSON.stringify(csvw, null, 2)
    this.csvw = Remote.loaded(csvwString)
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
.side-pane-csvw {
  min-width: 30%;
  width: auto;
}

rdf-editor::part(CodeMirror-vscrollbar) {
  display: none;
}
</style>
