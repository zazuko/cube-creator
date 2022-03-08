<template>
  <o-datetimepicker :model-value="dateValue" @update:modelValue="onUpdate" icon="calendar-alt" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'DateTimePickerEditor',
  props: {
    value: {
      type: String,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: string) => void>,
      required: true,
    }
  },

  computed: {
    dateValue (): Date | null {
      return this.value ? new Date(this.value) : null
    },
  },

  methods: {
    onUpdate (value: Date): void {
      const stringValue = value.toISOString()
      this.update(stringValue)
    },
  },
})
</script>
