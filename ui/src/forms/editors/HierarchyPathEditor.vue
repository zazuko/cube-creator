<template>
  <div>
    <b-field>
      <b-checkbox :value="inverse" @input="__onInverseToggled">
        Inverse
      </b-checkbox>
    </b-field>
    <b-field>
      <instances-select :update="__onPropertySelected"
                        :options="properties"
                        :value="property"
      />
    </b-field>
    <b-field label="Example resource" v-if="exampleLabel">
      <a target="_blank" :href="example.value">{{ exampleLabel }}</a>
      <a target="_blank" :href="moreExamples">&nbsp;(more)</a>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { NamedNode, Term } from 'rdf-js'
import { dataset } from '@rdf-esm/dataset'
import clownface, { GraphPointer } from 'clownface'
import { sh, schema, rdfs } from '@tpluscode/rdf-ns-builders/strict'
import { Item } from '@hydrofoil/shaperone-core/components'
import InstancesSelect from './SelectEditor.vue'

function getProperty (value: GraphPointer | undefined) {
  if (!value) {
    return {}
  }

  const inverse = value.term.termType === 'BlankNode'
  const property = inverse
    ? value?.out(sh.inversePath).toArray().shift()
    : value

  return { property, inverse }
}

@Component({
  components: { InstancesSelect }
})
export default class extends Vue {
  @Prop() value?: GraphPointer;
  @Prop() example?: GraphPointer;
  @Prop() moreExamples?: string;
  inverse = false;
  property?: Term | null = null;
  @Prop() properties!: Item[];
  @Prop() update!: (newValue: GraphPointer | Term) => void;

  get exampleLabel () {
    if (typeof this.example?.out === 'function') {
      return this.example.out([schema.name, rdfs.label]).values?.shift() ||
          this.example.value
    }

    return ''
  }

  mounted () {
    const { inverse, property } = getProperty(this.value)
    this.inverse = !!inverse
    this.property = property?.term
  }

  __onInverseToggled () {
    this.inverse = !this.inverse
    this.__update()
  }

  __onPropertySelected (term: Term) {
    this.property = term
    this.__update()
  }

  __update () {
    const pointer = clownface({ dataset: dataset() })
    if (this.inverse) {
      const path = pointer.blankNode()
      if (this.property) {
        path.addOut(sh.inversePath, this.property)
      }
      this.update(path)
    } else if (this.property) {
      this.update(this.property)
    }
  }
}
</script>
