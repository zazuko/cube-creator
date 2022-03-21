<template>
  <label class="form-property">
    <span class="label">
      {{ property.name }}
    </span>
    <o-field v-if="property.shape.description">
      <markdown-render class="help" :anchor-attributes="linkAttrs" :source="property.shape.description" />
    </o-field>
    <o-field v-if="property.selectedEditor">
      <render-wc-template :template-result="renderMultiEditor()" />
    </o-field>
    <div v-else v-for="object in property.objects" :key="object.key">
      <render-wc-template :template-result="renderObject({ object })" />
    </div>
    <div v-if="!property.selectedEditor && property.canAdd">
      <o-tooltip label="Add value">
        <o-button icon-left="plus" @click.prevent="actions.addObject" variant="text" />
      </o-tooltip>
    </div>
  </label>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit'
import MarkdownRender from '@/components/MarkdownRender.vue'
import RenderWcTemplate from './RenderWcTemplate.vue'

export default defineComponent({
  name: 'FormProperty',
  components: { MarkdownRender, RenderWcTemplate },
  props: {
    property: {
      type: Object as PropType<PropertyState>,
      required: true,
    },
    actions: {
      type: Object,
      required: true,
    },
    renderObject: {
      type: Function as PropType<(arg: { object: PropertyObjectState }) => TemplateResult>,
      required: true,
    },
    renderMultiEditor: {
      type: Function as PropType<() => TemplateResult>,
      required: true,
    },
  },

  data () {
    return {
      linkAttrs: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }
  }
})
</script>

<style scoped>
.form-property {
  display: block;
}
</style>
