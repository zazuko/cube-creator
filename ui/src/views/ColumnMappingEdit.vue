<template>
  <side-pane :is-open="true" title="Edit column mapping" @close="onCancel" v-if="columnMapping">
    <p><strong>TODO</strong></p>
    <div class="content">
      <ul>
        <li>{{ columnMapping.sourceColumn.id.value }}</li>
        <li>{{ columnMapping.targetProperty.value }}</li>
        <li>{{ columnMapping.datatype }}</li>
        <li>{{ columnMapping.language }}</li>
      </ul>
    </div>
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { ColumnMapping } from '../types'
import SidePane from '@/components/SidePane.vue'

const projectNS = namespace('project')

@Component({
  components: { SidePane },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.Getter('findColumnMapping') findColumnMapping!: (id: string) => ColumnMapping | null

  get columnMapping (): ColumnMapping | null {
    const columnMappingId = this.$router.currentRoute.params.columnMappingId
    return this.findColumnMapping(columnMappingId)
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
