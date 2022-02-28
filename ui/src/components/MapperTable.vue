<template>
  <div class="mapper-table panel">
    <div class="panel-heading" :style="{ 'background-color': table.color }">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <span class="has-text-weight-normal">{{ prefix }}&nbsp;</span>{{ table.name }}
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
            <b-dropdown position="is-bottom-left">
              <button class="button is-text is-small" slot="trigger">
                <b-icon icon="ellipsis-h" />
              </button>
              <b-dropdown-item v-if="table.csvw" has-link>
                <router-link :to="{ name: 'TableCsvw', params: { tableId: table.clientPath } }">
                  View generated CSVW
                </router-link>
              </b-dropdown-item>
            </b-dropdown>
          </div>
        </div>
      </div>
    </div>
    <b-message v-if="errors.length" type="is-danger" class="content">
      <p>There are problems in the table:</p>
      <pre v-for="error in errors" :key="error.id.value">{{ error.description }}</pre>
    </b-message>
    <div class="panel-block">
      <span>Identifier template:</span>
      <code class="identifier-template">{{ table.identifierTemplate || 'auto' }}</code>
    </div>
    <div
      v-for="columnMapping in table.columnMappings"
      :key="columnMapping.id.value"
      class="panel-block is-justify-content-space-between"
      :data-column-mapping-id="columnMapping.id.value"
      @mouseenter="$emit('highlight-arrows', [columnMapping.id.value])"
      @mouseleave="$emit('unhighlight-arrows', [columnMapping.id.value])"
    >
      <div class="is-flex gap-2">
        <b-tag v-if="columnMapping.referencedTable" rounded :style="{ 'background-color': getTableColor(columnMapping.referencedTable.id) }">
          <property-display :term="columnMapping.targetProperty" />
        </b-tag>
        <span v-else>
          <property-display :term="columnMapping.targetProperty" />
          <span v-if="columnMapping.datatype" class="has-text-grey"> (<property-display :term="columnMapping.datatype" />)</span>
          <span v-if="columnMapping.language" class="has-text-grey"> (language: {{ columnMapping.language.value }})</span>
        </span>
        <b-tooltip v-if="columnMapping.isKeyDimension" label="Key dimension">
          <b-icon icon="key" type="is-grey" />
        </b-tooltip>
        <b-tooltip v-if="columnMapping.isMeasureDimension" label="Measure dimension">
          <b-icon icon="chart-bar" type="is-primary" />
        </b-tooltip>
      </div>
      <div class="is-flex">
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
    <div class="panel-block">
      <b-tooltip v-if="table.actions.createLiteralColumnMapping || table.actions.createReferenceColumnMapping" label="Map column">
        <b-button
          tag="router-link"
          :to="{ name: 'ColumnMappingCreate', params: { tableId: table.clientPath } }"
          type="is-text"
          size="is-small"
          icon-left="plus"
          data-testid="create-column-mapping"
        />
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { ColumnMapping, Table } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'
import PropertyDisplay from './PropertyDisplay.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { HydraOperationButton, PropertyDisplay },
})
export default class MapperTable extends Vue {
  @Prop() readonly table!: Table

  @storeNs.project.Getter('getTable') getTable!: (uri: Term) => Table

  get errors (): Array<{ id: ResourceIdentifier, description?: string }> {
    const columnErrors = this.table.columnMappings
      .flatMap(cm => (cm.errors || []).map(({ id, description }) => ({
        id,
        description: `Property ${cm.targetProperty?.value}: ${description}`
      })))

    return [
      ...(this.table.errors || []),
      ...columnErrors,
    ]
  }

  get prefix (): string {
    return this.table.isObservationTable
      ? 'Cube:'
      : 'Concept:'
  }

  getTableColor (tableId: Term): string {
    try {
      return this.getTable(tableId).color
    } catch {
      return 'red'
    }
  }

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
