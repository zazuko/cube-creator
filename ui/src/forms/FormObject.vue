<template>
  <div class="form-object">
    <render-wc-template :template-result="editor" class="form-object-editor" />
    <div v-if="property.canRemove">
      <o-tooltip label="Remove value">
        <o-button icon-left="minus" @click.prevent="actions.remove" variant="text" />
      </o-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit'
import RenderWcTemplate from './RenderWcTemplate.vue'

export default defineComponent({
  name: 'FormObject',
  components: { RenderWcTemplate },
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
    editor (): TemplateResult {
      return this.renderEditor()
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
