<template>
  <div>
    <o-field>
      <b-radio-button
        v-for="filter in filters"
        :key="filter"
        :native-value="filter"
        v-model="selectedFilter"
      >
        {{ filter }}
      </b-radio-button>
    </o-field>
    <table class="terms-table">
      <tbody>
        <tr v-for="o in displayedObjects" :key="o.key" class="term-row">
          <td>
            <render-wc-template
              class="term-pair"
              :template-result="renderer.renderFocusNode({ focusNode: o.object, shape: shape.node })"
            />
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
import { Vue, Component, Prop } from 'vue-property-decorator'
import { PropertyObjectState } from '@hydrofoil/shaperone-core/models/forms'
import { prov, sh } from '@tpluscode/rdf-ns-builders'
import { Term } from 'rdf-js'
import { PropertyShape } from '@rdfine/shacl'
import { PropertyRenderer } from '@hydrofoil/shaperone-core/renderer'
import RenderWcTemplate from '../RenderWcTemplate.vue'

@Component({
  components: { RenderWcTemplate },
})
export default class extends Vue {
  @Prop() objects!: PropertyObjectState[]
  @Prop() shape!: PropertyShape
  @Prop() renderer!: PropertyRenderer

  filters = ['All', 'Mapped', 'Unmapped']
  selectedFilter = 'All'

  get defaultValue (): Term | undefined {
    return this.shape.node?.pointer
      .out(sh.property)
      .has(sh.path, prov.pairEntity)
      .out(sh.defaultValue)
      .term
  }

  get displayedObjects (): PropertyObjectState[] {
    const objects = [...this.objects].sort((obj1, obj2) => {
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
    } else {
      return objects
    }
  }
}
</script>

<style scoped>
.terms-table {
  min-width: 100%;
}
</style>

<style>
.term-pair {
  display: flex;
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
