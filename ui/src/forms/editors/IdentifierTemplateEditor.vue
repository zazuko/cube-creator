<template>
  <o-field
    :message="wasValidated ? invalidMessage : ''"
    :variant="wasValidated && invalidMessage ? 'danger' : ''"
  >
    <o-autocomplete
      ref="autocomplete"
      :model-value="value"
      @update:modelValue="update"
      @typing="onTyping"
      @select="onSelect"
      @blur="validate"
      :data="propositions"
      :custom-formatter="formatProposition"
      placeholder="e.g. MyTable/{column_id}"
      :disabled="!source"
    />
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { CsvSource } from '@cube-creator/model'
import type { Term } from '@rdfjs/types'
import { mapGetters, Store } from 'vuex'
import { RootState } from '../../store/types'
import store from '../../store'

export default defineComponent({
  name: 'IdentifierTemplateEditor',
  props: {
    value: {
      type: String,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: string) => void>,
      required: true,
    },
    tableName: {
      type: String,
      default: undefined,
    },
    isObservationTable: {
      type: Boolean,
      required: true,
    },
    sourceId: {
      type: Object as PropType<Term>,
      default: undefined,
    },
  },
  emits: ['input'],

  data () {
    return {
      wasModified: false,
      wasValidated: false,

    }
  },

  created () {
    this.wasModified = !!this.value
  },

  computed: {
    ...mapGetters('project', {
      getSource: 'getSource',
    }),

    $store (): Store<RootState> {
      return store
    },

    source (): CsvSource | null {
      return this.sourceId ? this.getSource(this.sourceId) : null
    },

    propositions (): string[] {
      if (!this.source) return []

      const value = this.value ?? ''
      const position = this.getCursorPosition()
      const beforeCursor = value.slice(0, position)
      const insideBracesMatch = beforeCursor.match(/^.*\{([^}]*)$/)
      const insideBraces = insideBracesMatch ? insideBracesMatch[1] : ''

      if (!insideBracesMatch) return []

      return this.source.columns
        .filter((column) => column.name.startsWith(insideBraces))
        .map((column) => column.name.substring(insideBraces.length))
    },

    invalidMessage (): string {
      const columns = this.source?.columns ?? []
      const columnNames = columns.map(({ name }) => name)
      const matches = this.value?.matchAll(/\{([^{}]*)\}/g) ?? []
      const inputColumnNames = [...matches].map((match) => match[1])
      const invalidColumnNames = inputColumnNames.filter((name) => !columnNames.includes(name))

      if (invalidColumnNames.length > 0) {
        return `The following columns are not valid: ${invalidColumnNames.join(', ')}`
      } else {
        return ''
      }
    },
  },

  methods: {
    getInputElement (): HTMLInputElement | null {
      const autocomplete = this.$refs.autocomplete as any
      return autocomplete?.$el.querySelector('input') ?? null
    },

    getCursorPosition (): number {
      const inputElement = this.getInputElement()
      return inputElement?.selectionStart || 0
    },

    onTyping (): void {
      this.wasModified = true
    },

    validate (): void {
      this.wasValidated = true
    },

    onSelect (value: string, event: Event): void {
      if (event) {
        event.preventDefault()
      }

      const inputElement = this.getInputElement()
      inputElement && inputElement.focus()
    },

    formatProposition (proposition: string): string {
      const value = this.value || ''
      const position = this.getCursorPosition()
      const nextChar = value[position]
      const insert = nextChar === '}' ? proposition : proposition + '}'
      const newValue = value.substring(0, position) + insert + value.substring(position)

      return newValue
    },
  },
})
</script>
