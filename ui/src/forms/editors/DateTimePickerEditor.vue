<template>
  <b-datetimepicker :value="dateValue" @input="onUpdate" icon="calendar-alt" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class DatePickerEditor extends Vue {
  @Prop() value?: string;
  @Prop() update!: (newValue: string) => void

  get dateValue (): Date | null {
    return this.value ? new Date(this.value) : null
  }

  onUpdate (value: Date): void {
    const stringValue = value.toISOString()
    this.update(stringValue)
  }
}
</script>
