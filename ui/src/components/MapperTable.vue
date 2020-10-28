<template>
  <div class="table panel">
    <div class="panel-heading" :style="{ 'background-color': table.color }">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            {{ table.name }}
          </div>
          <div class="level-item">
            <b-tooltip v-if="table.actions.delete" :label="table.actions.delete.title">
              <b-button icon-left="trash" @click="deleteTable(table)" type="is-text" />
            </b-tooltip>
            <b-tooltip v-if="table.actions.edit" :label="table.actions.edit.title">
              <b-button icon-left="pencil-alt" @click="editTable(table)" type="is-text" />
            </b-tooltip>
          </div>
        </div>
      </div>
    </div>
    <div v-for="columnMapping in table.columnMappings" :key="columnMapping.id.value" class="panel-block">
      {{ columnMapping.sourceColumn.id.value }}<br>
      -><br>
      {{ columnMapping.targetProperty.value }}
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Table } from '@/types'

@Component
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
}
</script>
