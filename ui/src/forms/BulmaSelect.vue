<template>
  <b-select placeholder="Select" @input="emit" :value="value">
    <option
      v-for="option in options"
      :value="option.id"
      :key="option.id.value"
    >
      {{ label(option) }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { RdfResource } from '@tpluscode/rdfine'
import { Hydra } from 'alcaeus/web'
import { NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'

const labelProperty = schema.name

@Component
export default class extends Vue {
  @Prop() collection?: RdfResource
  @Prop() update!: (newValue: string | NamedNode) => void
  @Prop() value?: NamedNode;

  options: RdfResource[] = []

  label (option: RdfResource): string {
    return option.getString(labelProperty, { strict: false }) || option.id.value
  }

  async mounted (): Promise<void> {
    if (this.collection && this.collection.id.termType === 'NamedNode') {
      const { representation } = await Hydra.loadResource(this.collection.id)
      this.options = representation?.root?.member || []
    }
  }

  emit (value: NamedNode): void {
    this.update(value)
  }
}
</script>
