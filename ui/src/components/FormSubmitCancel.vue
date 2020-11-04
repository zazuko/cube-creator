<template>
  <b-field :addons="false">
    <hr>
    <b-field class="buttons" :addons="false">
      <div class="control">
        <button type="submit" class="button is-primary" :disabled="disabled">
          {{ _submitLabel }}
        </button>
      </div>
      <div class="control">
        <b-button @click="$emit('cancel')">
          Cancel
        </b-button>
      </div>
    </b-field>
  </b-field>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class FormSubmitCancel extends Vue {
  @Prop() submitLabel?: string
  @Prop() disabled?: boolean

  get _submitLabel (): string {
    return this.submitLabel || 'Save'
  }
}
</script>

<style scoped>
.buttons {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.buttons > .control:not(:last-child) {
  margin-left: 0.5rem;
}
</style>
