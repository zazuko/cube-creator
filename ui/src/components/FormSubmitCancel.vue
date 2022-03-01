<template>
  <o-field :addons="false">
    <hr>
    <o-field class="buttons" :addons="false">
      <div class="control">
        <button-loading
          native-type="submit"
          :variant="submitButtonVariant"
          :disabled="disabled"
          :loading="isSubmitting"
        >
          {{ _submitLabel }}
        </button-loading>
      </div>
      <div class="control" v-if="showCancel">
        <o-button @click="$emit('cancel')">
          Cancel
        </o-button>
      </div>
    </o-field>
  </o-field>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import ButtonLoading from './ButtonLoading.vue'

@Component({
  components: { ButtonLoading },
})
export default class FormSubmitCancel extends Vue {
  @Prop() submitLabel?: string
  @Prop() disabled?: boolean
  @Prop() isSubmitting?: boolean
  @Prop({ default: true }) showCancel?: boolean
  @Prop({ default: 'primary' }) submitButtonVariant?: string

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
