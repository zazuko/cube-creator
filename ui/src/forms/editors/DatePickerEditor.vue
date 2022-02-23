<template>
  <b-datepicker :value="dateValue" @input="onUpdate" icon="calendar-alt" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class DatePickerEditor extends Vue {
  @Prop() value?: string
  @Prop() update!: (newValue: string) => void

  get dateValue (): Date | null {
    return this.value ? new Date(this.value) : null
  }

  onUpdate (value: Date): void {
    const stringValue = dateToString(value)
    this.update(stringValue)
  }
}

/**
 * Format Date as ISO8061 string while respecting the date's timezone:
 *
 * > dateToString(new Date('2020-04-13T00:00:00.000+02:00'))
 * '2020-04-13'
 */
function dateToString (date: Date): string {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString()

  return localISOTime.substring(0, 10)
}
</script>
