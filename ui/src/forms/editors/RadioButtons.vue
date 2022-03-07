<template>
  <o-field :message="message">
    <radio-button
      v-for="option in choices"
      :key="option.value"
      :value="_value"
      :native-value="option.value"
      @input="emit"
    >
      {{ label(option) }}
    </radio-button>
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { GraphPointer, MultiPointer } from 'clownface'
import { Term } from 'rdf-js'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import RadioButton from '@/components/RadioButton.vue'

export default defineComponent({
  name: 'RadioButtons',
  components: { RadioButton },
  props: {
    options: {
      type: Object as PropType<MultiPointer>,
      default: undefined,
    },
    value: {
      type: Object as PropType<GraphPointer>,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: Term | string) => void>,
      required: true,
    },
  },

  computed: {
    _value (): string {
      return this.value?.value || ''
    },

    choices (): Term[] {
      return this.options?.terms ?? []
    },

    message (): string {
      if (this.value) {
        return this.options?.node(this.value).out(rdfs.comment).values[0] || ''
      }

      return ''
    },
  },

  methods: {
    label (value: Term): string {
      return this.options?.node(value).out(rdfs.label).values[0] || value.value
    },

    emit (value: string): void {
      const choice = this.choices.find(ptr => ptr.value === value)
      if (choice) {
        this.update(choice)
      }
    },
  },
})
</script>
