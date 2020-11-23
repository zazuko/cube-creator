<template>
  <label v-if="property && !isHidden" class="form-property">
    <span class="label">
      {{ property.name }}
    </span>
    <b-field v-if="property.shape.description">
      <p class="help">
        {{ property.shape.description }}
      </p>
    </b-field>
    <b-field v-if="property.selectedEditor">
      <render-wc-template :template-result="renderMultiEditor()" />
    </b-field>
    <div v-else v-for="object in property.objects" :key="object.key">
      <render-wc-template :template-result="renderObject(object)" />
    </div>
    <div v-if="!property.selectedEditor && property.canAdd">
      <b-tooltip label="Add value">
        <b-button icon-left="plus" @click.prevent="actions.addObject" type="is-white" />
      </b-tooltip>
    </div>
  </label>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit-element'
import { dash } from '@tpluscode/rdf-ns-builders'
import RenderWcTemplate from './RenderWcTemplate.vue'

@Component({
  components: { RenderWcTemplate },
})
export default class extends Vue {
  @Prop() property!: PropertyState;
  @Prop() actions!: any;
  @Prop() renderObject!: (object: PropertyObjectState) => TemplateResult;
  @Prop() renderMultiEditor!: () => TemplateResult;

  get isHidden (): boolean {
    return !!this.property.shape.pointer.out(dash.hidden).value
  }
}
</script>

<style scoped>
.form-property {
  display: block;
}
</style>
