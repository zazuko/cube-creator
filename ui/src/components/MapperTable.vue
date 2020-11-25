<template>
  <div class="mapper-table panel">
    <div class="panel-heading" :style="{ 'background-color': table.color }">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            {{ table.name }}
          </div>
          <div class="level-item" v-if="table.isObservationTable">
            <b-tooltip label="Observation table">
              <b-icon icon="eye" />
            </b-tooltip>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <hydra-operation-button
              :operation="table.actions.edit"
              :to="{ name: 'TableEdit', params: { tableId: table.clientPath } }"
            />
            <hydra-operation-button
              :operation="table.actions.delete"
              @click="deleteTable(table)"
              data-testid="delete-table"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="panel-block">
      <span>Identifier template:</span>
      <code class="identifier-template">{{ table.identifierTemplate }}</code>
    </div>
    <div v-for="columnMapping in table.columnMappings" :key="columnMapping.id.value" class="panel-block">
      <div class="level-left">
        <div class="level-item">
          <b-tag v-if="columnMapping.referencedTable" rounded :style="{ 'background-color': getTable(columnMapping.referencedTable.id).color }">
            <property-display :term="columnMapping.targetProperty" />
          </b-tag>
          <property-display v-else :term="columnMapping.targetProperty" />
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <hydra-operation-button
            :operation="columnMapping.actions.edit"
            :to="{ name: 'ColumnMappingEdit', params: { columnMappingId: columnMapping.clientPath } }"
          />
          <hydra-operation-button
            :operation="columnMapping.actions.delete"
            @click="deleteColumnMapping(columnMapping)"
          />
        </div>
      </div>
    </div>
    <div class="panel-block">
      <b-tooltip v-if="table.actions.createLiteralColumnMapping || table.actions.createReferenceColumnMapping" label="Map column">
        <b-button
          tag="router-link"
          :to="{ name: 'ColumnMappingCreate', params: { tableId: table.clientPath } }"
          type="is-text"
          size="is-small"
          icon-left="plus"
        />
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { namespace } from 'vuex-class'
import { ColumnMapping, Table } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'
import PropertyDisplay from './PropertyDisplay.vue'

const projectNS = namespace('project')

@Component({
  components: { HydraOperationButton, PropertyDisplay },
})
export default class MapperTable extends Vue {
  @Prop() readonly table!: Table;

  @projectNS.Getter('getTable') getTable!: (uri: Term) => Table

  deleteTable (table: Table): void {
    this.$buefy.dialog.confirm({
      title: table.actions.delete?.title,
      message: 'Are you sure you want to delete this table?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: () => {
        this.$store.dispatch('api/invokeDeleteOperation', {
          operation: table.actions.delete,
          successMessage: `Table ${table.name} deleted successfully`,
          callbackAction: 'project/refreshTableCollection',
        })
      },
    })
  }

  deleteColumnMapping (columnMapping: ColumnMapping): void {
    this.$buefy.dialog.confirm({
      title: columnMapping.actions.delete?.title,
      message: 'Are you sure you want to delete this column mapping?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: () => {
        this.$store.dispatch('api/invokeDeleteOperation', {
          operation: columnMapping.actions.delete,
          successMessage: 'Column mapping deleted successfully',
          callbackAction: 'project/refreshTableCollection',
        })
      },
    })
  }
}
</script>

<style scoped>
.identifier-template {
  max-width: 60rem;
  overflow-x: auto;
}
</style>
