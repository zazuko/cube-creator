<template>
  <render-wc-template :template-result="templateResult" />
</template>

<script lang="ts">
import { PropertyObjectState } from '@hydrofoil/shaperone-core/models/forms'
import { PropertyRenderer } from '@hydrofoil/shaperone-core/renderer'
import { PropertyShape } from '@rdfine/shacl'
import { defineComponent, PropType } from 'vue'
import RenderWcTemplate from '../RenderWcTemplate.vue'

export default defineComponent({
  name: 'DictionaryTableEditorPair',
  components: { RenderWcTemplate },
  props: {
    renderer: {
      type: Object as PropType<PropertyRenderer>,
      required: true,
    },
    shape: {
      type: Object as PropType<PropertyShape>,
      required: true,
    },
    object: {
      type: Object as PropType<PropertyObjectState>,
      required: true,
    },
  },

  computed: {
    templateResult () {
      const object: any = this.object.object

      return this.renderer.renderFocusNode({
        focusNode: object,
        shape: this.shape.node,
      })
    }
  }
})
</script>
