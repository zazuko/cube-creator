<template>
  <o-field>
    <o-input :value="valueText" @input="updateValue" class="text-input" :type="inputType" />
    <o-select :value="valueLanguage" @input="updateLanguage">
      <option v-for="language in languages" :key="language">
        {{ language }}
      </option>
    </o-select>
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Literal } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { PropertyState } from '@hydrofoil/shaperone-core/models/forms'

export default defineComponent({
  name: 'TextFieldWithLangEditor',
  props: {
    value: {
      type: Object as PropType<Literal>,
      default: undefined,
    },
    property: {
      type: Object as PropType<PropertyState>,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: Literal) => void>,
      required: true,
    },
    inputType: {
      type: String,
      default: 'text',
    },
  },

  computed: {
    languages (): string[] {
      return this.property?.shape.languageIn || []
    },

    valueText (): string {
      return this.value?.value || ''
    },

    valueLanguage (): string | undefined {
      return this.value?.language
    },
  },

  methods: {
    updateValue (newValue: string): void {
      this.update($rdf.literal(newValue, this.valueLanguage))
    },

    updateLanguage (newLanguage: string): void {
      this.update($rdf.literal(this.valueText, newLanguage))
    },
  },
})
</script>

<style scoped>
.text-input {
  flex-grow: 1;
}
</style>
