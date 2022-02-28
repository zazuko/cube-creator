<template>
  <o-field
    :message="wasValidated ? invalidMessage : ''"
    :variant="wasValidated && invalidMessage ? 'danger' : ''"
  >
    <o-autocomplete
      ref="autocomplete"
      :value="value"
      @input="update"
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
import { CsvSource } from '@cube-creator/model'
import { Term } from 'rdf-js'
import { Prop, Component, Vue, Watch } from 'vue-property-decorator'
import { Store } from 'vuex'
import { RootState } from '../../store/types'
import store from '../../store'
import * as storeNs from '../../store/namespace'

@Component
export default class extends Vue {
  @Prop() value!: string | undefined
  @Prop() update!: (newValue: string) => void
  @Prop() tableName!: string
  @Prop() isObservationTable!: boolean
  @Prop() sourceId?: Term
  @Prop({ default: true }) autoPrefill!: boolean // TODO: Should only be true on table creation

  @storeNs.project.Getter('getSource') getSource!: (id: Term) => CsvSource

  wasModified = !!this.value
  wasValidated = false

  get $store (): Store<RootState> {
    return store
  }

  get source (): CsvSource | null {
    return this.sourceId ? this.getSource(this.sourceId) : null
  }

  get propositions (): string[] {
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
  }

  getInputElement (): HTMLInputElement | null {
    const autocomplete = this.$refs.autocomplete as Vue
    return autocomplete?.$el.querySelector('input') ?? null
  }

  getCursorPosition (): number {
    const inputElement = this.getInputElement()
    return inputElement?.selectionStart || 0
  }

  onTyping (): void {
    this.wasModified = true
  }

  validate (): void {
    this.wasValidated = true
  }

  onSelect (value: string, event: Event): void {
    if (event) {
      event.preventDefault()
    }

    const inputElement = this.getInputElement()
    inputElement && inputElement.focus()
  }

  formatProposition (proposition: string): string {
    const value = this.value || ''
    const position = this.getCursorPosition()
    const nextChar = value[position]
    const insert = nextChar === '}' ? proposition : proposition + '}'
    const newValue = value.substring(0, position) + insert + value.substring(position)

    return newValue
  }

  @Watch('tableName')
  @Watch('isObservationTable')
  prefill (): void {
    if (this.wasModified) return

    if (!this.tableName) return

    const prefix = this.tableName.split(' ').join('')
    const prefillValue = !this.isObservationTable
      ? `${prefix}/{REPLACE}`
      : ''

    this.update(prefillValue)
    this.$emit('input', prefillValue)
  }

  get invalidMessage (): string {
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
  }
}
</script>
