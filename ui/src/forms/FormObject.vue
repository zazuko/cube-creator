<template>
  <div v-if="isReady" class="form-object">
    <render-wc-template :template-result="renderEditor()" class="form-object-editor" />
    <div v-if="property.canRemove">
      <o-tooltip label="Remove value">
        <o-button icon-left="minus" @click.prevent="actions.remove" variant="text" />
      </o-tooltip>
    </div>
  </div>
  <loading-block v-else class="is-size-7 py-5" />
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit'
import RenderWcTemplate from './RenderWcTemplate.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'

export default defineComponent({
  name: 'FormObject',
  components: { RenderWcTemplate, LoadingBlock },
  props: {
    object: {
      type: Object as PropType<PropertyObjectState>,
      required: true,
    },
    property: {
      type: Object as PropType<PropertyState>,
      required: true,
    },
    actions: {
      type: Object,
      required: true,
    },
    renderEditor: {
      type: Function as PropType<() => TemplateResult>,
      required: true,
    },
  },

  computed: {
    isReady (): boolean {
      return !this.object?.componentState?.loading
    },
  },
})
</script>

<style scoped>
.form-object {
  display: flex;
  justify-content: space-between;
}

.form-object-editor {
  flex-grow: 1;
  max-width: 95%;
}
</style>
