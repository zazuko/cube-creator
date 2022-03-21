<template>
  <render-wc-template v-if="templateResult" :template-result="templateResult" />
</template>

<script lang="ts">
import { PropertyObjectState } from '@hydrofoil/shaperone-core/models/forms'
import { PropertyRenderer } from '@hydrofoil/shaperone-core/renderer'
import { PropertyShape } from '@rdfine/shacl'
import { defineComponent, PropType, nextTick, shallowRef, toRefs, watch } from 'vue'
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

  setup (props) {
    const { object, shape, renderer } = toRefs(props)
    const templateResult = shallowRef(null)

    const renderTemplateResult = () => {
      nextTick(() => {
        const obj: any = object.value.object

        if (!obj) {
          return null
        }

        templateResult.value = renderer.value.renderFocusNode({
          focusNode: obj,
          shape: shape.value.node,
        })
      })
    }
    watch([object, shape, renderer], renderTemplateResult, { immediate: true })

    return {
      templateResult,
    }
  },
})
</script>
