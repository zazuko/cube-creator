<template>
  <b-select placeholder="Select" @input="update" :value="value">
    <option
      v-for="option in options"
      :value="option.term"
      :key="option.value"
    >
      {{ label(option) }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { PropertyShape } from '@rdfine/shacl'
import { Hydra } from 'alcaeus/web'
import { NamedNode } from 'rdf-js'
import { rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import { hashi } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'

@Component
export default class extends Vue {
  @Prop() property!: PropertyShape
  @Prop() update!: (newValue: string | NamedNode) => void
  @Prop() value?: NamedNode;

  options: GraphPointer[] = []

  label (option: GraphPointer): string {
    return (
      option.out(rdfs.label).values[0] ||
      option.out(schema.name).values[0] ||
      option.value
    )
  }

  async mounted (): Promise<void> {
    const collection = this.property.get(hashi.collection)
    const shIn = this.property.in

    if (collection && collection.id.termType === 'NamedNode') {
      const { representation } = await Hydra.loadResource(collection.id)
      this.options = (representation?.root?.member || []).map((resource) => resource.pointer)
    } else if (shIn.length) {
      this.options = this.property.pointer.node(shIn).toArray()
    } else if (this.property.class) {
      this.options = this.property.pointer.any().has(rdf.type, this.property.class.id).toArray()
    }
  }
}
</script>
