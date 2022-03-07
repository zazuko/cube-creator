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
            <o-dropdown position="bottom-left" class="has-text-weight-normal">
              <template #trigger>
                <button class="button is-text is-small">
                  <o-icon icon="ellipsis-h" />
                </button>
              </template>
              <o-dropdown-item tag="div" item-class="p" v-if="table.csvw" has-link>
                <router-link class="dropdown-item" :to="{ name: 'TableCsvw', params: { tableId: table.clientPath } }">
                  View generated CSVW
                </router-link>
              </o-dropdown-item>
            </o-dropdown>
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
        <span v-if="columnMapping.referencedTable" class="tag is-rounded" :style="{ 'background-color': getTableColor(columnMapping.referencedTable.id) }">
          <property-display :term="columnMapping.targetProperty" />
        </span>
        <span v-else>
          <property-display :term="columnMapping.targetProperty" />
          <span v-if="columnMapping.datatype" class="has-text-grey"> (<property-display :term="columnMapping.datatype" />)</span>
          <span v-if="columnMapping.language" class="has-text-grey"> (language: {{ columnMapping.language.value }})</span>
        </span>
        <o-tooltip v-if="columnMapping.isKeyDimension" label="Key dimension">
          <o-icon icon="key" variant="grey" />
        </o-tooltip>
        <o-tooltip v-if="columnMapping.isMeasureDimension" label="Measure dimension">
          <o-icon icon="chart-bar" variant="primary" />
        </o-tooltip>
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
      <o-tooltip v-if="table.actions.createLiteralColumnMapping || table.actions.createReferenceColumnMapping" label="Map column">
        <o-button
          tag="router-link"
          :to="{ name: 'ColumnMappingCreate', params: { tableId: table.clientPath } }"
          variant="text"
          size="small"
          icon-left="plus"
          data-testid="create-column-mapping"
        />
      </o-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Term } from 'rdf-js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { ColumnMapping, Table } from '@cube-creator/model'
import BMessage from './BMessage.vue'
import HydraOperationButton from './HydraOperationButton.vue'
import PropertyDisplay from './PropertyDisplay.vue'
import { confirmDialog } from '../use-dialog'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'MapperTable',
  components: { BMessage, HydraOperationButton, PropertyDisplay },
  props: {
    table: {
      type: Object as PropType<Table>,
      required: true,
    }
  },

  computed: {
    ...mapGetters('project', {
      getTable: 'getTable',
    }),

    errors (): Array<{ id: ResourceIdentifier, description?: string }> {
      const columnErrors = this.table.columnMappings
        .flatMap(cm => (cm.errors || []).map(({ id, description }) => ({
          id,
          description: `Property ${cm.targetProperty?.value}: ${description}`
        })))

      return [
        ...(this.table.errors || []),
        ...columnErrors,
      ]
    },

    prefix (): string {
      return this.table.isObservationTable
        ? 'Cube:'
        : 'Concept:'
    },
  },

  methods: {
    getTableColor (tableId: Term): string {
      try {
        return this.getTable(tableId).color
      } catch {
        return 'red'
      }
    },

    deleteTable (table: Table): void {
      confirmDialog(this, {
        title: table.actions.delete?.title,
        message: 'Are you sure you want to delete this table?',
        confirmText: 'Delete',
        onConfirm: () => {
          this.$store.dispatch('api/invokeDeleteOperation', {
            operation: table.actions.delete,
            successMessage: `Table ${table.name} deleted successfully`,
            callbackAction: 'project/refreshTableCollection',
          })
        },
      })
    },

    deleteColumnMapping (columnMapping: ColumnMapping): void {
      confirmDialog(this, {
        title: columnMapping.actions.delete?.title,
        message: 'Are you sure you want to delete this column mapping?',
        confirmText: 'Delete',
        onConfirm: () => {
          this.$store.dispatch('api/invokeDeleteOperation', {
            operation: columnMapping.actions.delete,
            successMessage: 'Column mapping deleted successfully',
            callbackAction: 'project/refreshTableCollection',
          })
        },
      })
    },
  },
})
</script>

<style scoped>
.identifier-template {
  max-width: 60rem;
  overflow-x: auto;
}
</style>
