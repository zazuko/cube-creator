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
          {{ columnMapping.targetProperty.value }}
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
      <hydra-operation-button
        :operation="table.actions.createColumnMapping"
        :to="{ name: 'ColumnMappingCreate', params: { tableId: table.clientPath } }"
        data-testid="create-column-mapping"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { ColumnMapping, Table } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'

@Component({
  components: { HydraOperationButton },
})
export default class MapperTable extends Vue {
  @Prop() readonly table!: Table;

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
          callbackAction: 'project/refreshTablesCollection',
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
