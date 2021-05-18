<template>
  <label class="form-property">
    <span class="label">
      {{ property.name }}
    </span>
    <b-field v-if="property.shape.description">
      <vue-markdown class="help" :anchor-attributes="linkAttrs" :source="property.shape.description" />
    </b-field>
    <b-field v-if="property.selectedEditor">
      <render-wc-template :template-result="renderMultiEditor()" />
    </b-field>
    <div v-else v-for="object in property.objects" :key="object.key">
      <render-wc-template :template-result="renderObject({ object })" />
    </div>
    <div v-if="!property.selectedEditor && property.canAdd">
      <b-tooltip label="Add value">
        <b-button icon-left="plus" @click.prevent="actions.addObject" type="is-text" />
      </b-tooltip>
    </div>
  </label>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit-element'
// Makes the hidden property visible to typescript
import VueMarkdown from 'vue-markdown/src/VueMarkdown'
import RenderWcTemplate from './RenderWcTemplate.vue'

@Component({
  components: { RenderWcTemplate, VueMarkdown },
})
export default class extends Vue {
  @Prop() property!: PropertyState;
  @Prop() actions!: any;
  @Prop() renderObject!: (arg: { object: PropertyObjectState }) => TemplateResult;
  @Prop() renderMultiEditor!: () => TemplateResult;

  linkAttrs = {
    target: '_blank',
    rel: 'noopener noreferrer nofollow',
  }
}
</script>

<style scoped>
.form-property {
  display: block;
}
</style>
