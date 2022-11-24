<template>
  <div>
    <div class="panel-block">
      <o-field label="Filter">
        <radio-button
          v-for="filter in filters"
          :key="filter"
          :native-value="filter"
          v-model="selectedFilter"
        >
          {{ filter }}
        </radio-button>
      </o-field>
    </div>
    <div class="panel-block">
      <o-input placeholder="Type to filter values" v-model="textFilter" icon="filter" />
    </div>
    <div class="panel is-flex is-align-items-center gap-1">
      <o-tooltip label="Previous page">
        <o-button
          icon-left="chevron-left"
          @click="page = page - 1"
          :disabled="!hasPreviousPage"
        />
      </o-tooltip>
      <o-tooltip label="Next page">
        <o-button
          icon-left="chevron-right"
          @click="page = page + 1"
          :disabled="!hasNextPage"
        />
      </o-tooltip>
      <span class="ml-4">Page</span>
      <o-input
        v-model.number="page"
        type="number"
        min="1"
        :max="totalPages"
        :disabled="totalPages === 0"
        class="is-inline-block w-20"
      />
      <span class="">of {{ totalPages }}</span>
      <span class="ml-4">({{ filteredObjects.length }} rows)</span>
    </div>
    <table class="terms-table">
      <tbody>
        <tr v-for="o in displayedObjects" :key="o.key" class="term-row">
          <td>
            <dictionary-table-editor-pair class="term-pair" :shape="shape" :renderer="renderer" :object="o" />
          </td>
          <td class="term-remove-col">
            <o-tooltip label="Remove value">
              <o-button icon-left="minus" @click.prevent="renderer.actions.removeObject(o.object)" variant="white" />
            </o-tooltip>
          </td>
        </tr>
        <tr v-if="displayedObjects.length === 0">
          <td class="has-text-grey">
            Nothing to display
          </td>
        </tr>
      </tbody>
    </table>
    <o-tooltip label="Add value">
      <o-button icon-left="plus" @click.prevent="renderer.actions.addObject" variant="white" />
    </o-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { PropertyObjectState } from '@hydrofoil/shaperone-core/models/forms'
import { prov, sh } from '@tpluscode/rdf-ns-builders'
import { Term } from 'rdf-js'
import { PropertyShape } from '@rdfine/shacl'
import { PropertyRenderer } from '@hydrofoil/shaperone-core/renderer'
import RadioButton from '@/components/RadioButton.vue'
import DictionaryTableEditorPair from './DictionaryTableEditorPair.vue'

export default defineComponent({
  name: 'DictionaryTableEditor',
  components: { DictionaryTableEditorPair, RadioButton },
  props: {
    objects: {
      type: Array as PropType<PropertyObjectState[]>,
      required: true,
    },
    shape: {
      type: Object as PropType<PropertyShape>,
      required: true,
    },
    renderer: {
      type: Object as PropType<PropertyRenderer>,
      required: true,
    },
  },

  data () {
    return {
      filters: ['All', 'Mapped', 'Unmapped'],
      selectedFilter: 'All',
      textFilter: '',
      limit: 15,
      page: 1
    }
  },

  watch: {
    selectedFilter () {
      this.page = 1
    },
  },

  computed: {
    defaultValue (): Term | undefined {
      return this.shape.node?.pointer
        .out(sh.property)
        .has(sh.path, prov.pairEntity)
        .out(sh.defaultValue)
        .term
    },

    filteredObjects (): PropertyObjectState[] {
      const filterText = (obj: PropertyObjectState) => {
        const key = obj.object?.out(prov.pairKey).value ?? ''
        return key.toLowerCase().startsWith(this.textFilter.toLocaleLowerCase())
      }

      const objects = [...this.objects].filter(filterText).sort((obj1, obj2) => {
        const key1 = obj1.object?.out(prov.pairKey).value ?? ''
        const key2 = obj2.object?.out(prov.pairKey).value ?? ''
        return key1.localeCompare(key2)
      })

      const isUnmapped = (object: PropertyObjectState) => (
        !object.object?.out(prov.pairEntity).term ||
        object.object?.out(prov.pairEntity).term?.equals(this.defaultValue)
      )
      const isMapped = (object: PropertyObjectState) => !isUnmapped(object)

      if (this.selectedFilter === 'Unmapped') {
        return objects.filter(isUnmapped)
      } else if (this.selectedFilter === 'Mapped') {
        return objects.filter(isMapped)
      }

      return objects
    },

    displayedObjects (): PropertyObjectState[] {
      const offset = (this.page - 1) * this.limit
      return this.filteredObjects.slice(offset, offset + this.limit)
    },

    hasPreviousPage () {
      return this.page > 1
    },

    hasNextPage () {
      return this.page < this.totalPages
    },

    totalPages () {
      return Math.ceil(this.filteredObjects.length / this.limit)
    },
  },
})
</script>

<style scoped>
.terms-table {
  min-width: 100%;
}

.filters-heading {
  position: relative;
  padding: 0;
}

.filters-heading > button {
  width: 100%;
  margin: 0;

  border: none;
  background-color: transparent;
  cursor: pointer;
  justify-content: flex-start;
}
</style>

<style>
.term-pair {
  --cc-form-group-display: flex;
}

.term-pair > * {
  flex-grow: 1;

  display: flex;
  justify-content: stretch;
}

.term-pair > * > * {
  width: 50%;
}

.term-remove-col {
  width: 2rem;
}
</style>
