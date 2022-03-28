<template>
  <div>
    <o-field>
      <o-checkbox :value="inverse" @input="__onInverseToggled">
        Inverse
      </o-checkbox>
    </o-field>
    <o-field>
      <instances-select
        :update="__onPropertySelected"
        :options="properties"
        :value="property"
      />
    </o-field>
    <o-field label="Example resource" v-if="exampleLabel">
      <a target="_blank" :href="example.value">{{ exampleLabel }}</a>
      <a target="_blank" :href="moreExamples">&nbsp;(more)</a>
    </o-field>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Term } from 'rdf-js'
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

export default defineComponent({
  name: 'HierarchyPathEditor',
  components: { InstancesSelect },
  props: {
    value: {
      type: Object as PropType<GraphPointer>,
      default: undefined,
    },
    example: {
      type: Object as PropType<GraphPointer>,
      default: undefined,
    },
    moreExamples: {
      type: String,
      default: undefined,
    },
    properties: {
      type: Array as PropType<Item[]>,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: GraphPointer | Term) => void>,
      required: true,
    }
  },

  data (): { inverse: boolean, property: Term | undefined | null } {
    return {
      inverse: false,
      property: null,
    }
  },

  mounted () {
    const { inverse, property } = getProperty(this.value)
    this.inverse = !!inverse
    this.property = property?.term
  },

  computed: {
    exampleLabel (): string {
      if (typeof this.example?.out === 'function') {
        return this.example.out([schema.name, rdfs.label]).values?.shift() ||
            this.example.value
      }

      return ''
    },
  },

  methods: {
    __onInverseToggled () {
      this.inverse = !this.inverse
      this.__update()
    },

    __onPropertySelected (term: Term) {
      this.property = term
      this.__update()
    },

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
    },
  },
})
</script>