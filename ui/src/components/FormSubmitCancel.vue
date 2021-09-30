<template>
  <b-field :addons="false">
    <hr>
    <b-field class="buttons" :addons="false">
      <div class="control">
        <b-button native-type="submit" class="button" :type="submitButtonType" :disabled="disabled" :loading="isSubmitting">
          {{ _submitLabel }}
        </b-button>
      </div>
      <div class="control" v-if="showCancel">
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
  @Prop() isSubmitting?: boolean
  @Prop({ default: true }) showCancel?: boolean
  @Prop({ default: 'is-primary' }) submitButtonType?: string

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
