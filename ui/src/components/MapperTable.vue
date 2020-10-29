<template>
  <div class="table panel">
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
              @click="editTable(table)"
            />
            <hydra-operation-button
              :operation="table.actions.delete"
              @click="deleteTable(table)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="panel-block">
      Identifier template: <code>{{ table.identifierTemplate }}</code>
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
            :to="{ name: 'ColumnMappingEdit' }"
          />
          <hydra-operation-button
            :operation="columnMapping.actions.delete"
            @click="deleteColumnMapping(columnMapping)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { ColumnMapping, Table } from '../types'
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

  editTable (table: Table): void {
    this.$buefy.toast.open({ message: 'Not implemented yet', type: 'is-info' })
  }

  deleteColumnMapping (columnMapping: ColumnMapping): void {
    this.$buefy.toast.open({ message: 'Not implemented yet', type: 'is-info' })
  }
}
</script>
