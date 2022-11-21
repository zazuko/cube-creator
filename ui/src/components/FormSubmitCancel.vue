<template>
  <o-field :addons="false">
    <hr v-if="!inline">
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
      <div class="control" v-if="showClear">
        <o-button @click="$emit('clear')">
          Clear
        </o-button>
      </div>
    </o-field>
  </o-field>
</template>

<script lang="ts">
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { defineComponent, PropType } from 'vue'
import ButtonLoading from './ButtonLoading.vue'

export default defineComponent({
  name: 'FormSubmitCancel',
  components: { ButtonLoading },
  props: {
    submitLabel: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    showCancel: {
      type: Boolean,
      default: true,
    },
    showClear: {
      type: Boolean,
      default: true,
    },
    inline: {
      type: Boolean,
      default: false,
    },
    submitButtonVariant: {
      type: String as PropType<ColorsModifiers>,
      default: 'primary',
    },
  },
  emits: ['cancel', 'clear'],

  computed: {
    _submitLabel (): string {
      return this.submitLabel || 'Save'
    },
  },
})
</script>

<style scoped>
.buttons {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;
  padding-top: 28px;
}

hr + .buttons {
  padding-top: 0;
}

.buttons > .control:not(:last-child) {
  margin-left: 0.5rem;
}
</style>
