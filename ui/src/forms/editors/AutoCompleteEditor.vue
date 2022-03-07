<template>
  <vue-select
    :placeholder="placeholder"
    :options="_options"
    label="label"
    :value="_value"
    @input="onInput"
    :clearable="false"
    @search="onSearch"
    @search:focus="__load"
    :clear-search-on-blur="clearOnBlur"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import VueSelect from 'vue-select'
import { debounce } from 'debounce'

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
    placeholder: {
      type: String,
      required: true,
    },
    options: {
      type: Array as PropType<[GraphPointer, string][]>,
      default: undefined,
    },
    debounceWait: {
      type: Number,
      default: 300,
    },
  },

  data (): { searchValue: string, initialLoaded: boolean, onSearch: (query: string, loading: () => void) => void } {
    return {
      searchValue: '',
      initialLoaded: false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onSearch: () => {},
    }
  },

  created () {
    this.onSearch = debounce((freetextQuery: string, loading: () => void): void => {
      if (this.initialLoaded && !freetextQuery) {
        return
      }

      this.searchValue = freetextQuery
      this.initialLoaded = true
      this.$emit('search', freetextQuery, loading)
    }, this.debounceWait)
  },

  computed: {
    _options (): Option[] {
      const options = this.options ?? []
      return options.map(([pointer, label]) => ({ value: pointer.term.value, label, term: pointer.term }))
    },

    _value (): Option | null {
      return this._options.find(({ value }) => value === this.value?.value) ?? null
    },
  },

  methods: {
    onInput (value: Option | null): void {
      this.update(value?.term ?? null)
    },

    clearOnBlur (): boolean {
      return false
    },

    __load (): void {
      this.$emit('search', this.searchValue)
    },
  },
})
</script>
