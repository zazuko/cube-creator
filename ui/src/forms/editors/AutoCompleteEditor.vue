<template>
  <vue-select
    placeholder="Select"
    :options="_options"
    label="label"
    :model-value="_value"
    @update:modelValue="onInput"
    :clearable="false"
    :loading="loading"
    @search="onSearch"
  >
    <template #option="option">
      {{ option.label }}
      <cite v-if="option.helptext"><br>({{ option.helptext }})</cite>
    </template>
  </vue-select>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import VueSelect from 'vue-select'
import { debounce } from 'debounce'
import { findNodes } from 'clownface-shacl-path'
import { sh1 } from '@cube-creator/core/namespace'
import only from 'clownface/filter'
import { displayLanguage } from '@/store/serializers'
import { getLocalizedLabel } from '@rdfjs-elements/lit-helpers'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'

interface Option {
  label: string
  value: string
  term: Term
}

export default defineComponent({
  name: 'AutoCompleteEditor',
  components: { VueSelect },
  props: {
    property: {
      type: Object as PropType<PropertyShape>,
      required: true,
    },
    update: {
      type: Function as PropType<(newValue: Term | null) => void>,
      required: true,
    },
    value: {
      type: Object as PropType<NamedNode>,
      default: undefined,
    },
    options: {
      type: Array as PropType<GraphPointer[]>,
      default: undefined,
    },
    debounceWait: {
      type: Number,
      default: 300,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['search'],

  data (): { searchValue: string, initialLoaded: boolean, onSearch: (query: string) => void } {
    return {
      searchValue: '',
      initialLoaded: false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onSearch: () => {},
    }
  },

  created () {
    this.onSearch = debounce((freetextQuery: string): void => {
      if (this.initialLoaded && !freetextQuery) {
        return
      }

      this.searchValue = freetextQuery
      this.initialLoaded = true
      this.$emit('search', freetextQuery)
    }, this.debounceWait)
  },

  computed: {
    _options (): Option[] {
      const helptextPath = this.property.pointer.out(sh1.itemHelptextPath)

      const options = this.options ?? []
      return options.map((pointer) => {
        let helptext: string | undefined
        if (helptextPath.value) {
          [helptext] = findNodes(pointer, helptextPath).filter(only.taggedLiteral(displayLanguage)).values
        }

        return {
          value: pointer.term.value,
          label: getLocalizedLabel(pointer.out([rdfs.label, schema.name])),
          term: pointer.term,
          helptext,
        }
      })
    },

    _value (): Option | null {
      return this._options.find(({ value }) => value === this.value?.value) ?? null
    },
  },

  methods: {
    onInput (value: Option | null): void {
      this.update(value?.term ?? null)
    },
  },
})
</script>
