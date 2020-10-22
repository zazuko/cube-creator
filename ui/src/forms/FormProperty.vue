<template>
  <b-field v-if="property" :label="property.name" :message="property.shape.description">
    <b-field v-if="property.selectedEditor">
      <render-wc-func :f="renderMultiEditor" :args="[null]" />
    </b-field>
    <div v-else v-for="object in property.objects" :key="object.id">
      <render-wc-func :f="renderObject" :args="[object]" />
    </div>
    <div v-if="!property.selectedEditor && property.canAdd">
      <b-tooltip label="Add value">
        <b-button icon-left="plus" @click="actions.addObject" type="is-white" />
      </b-tooltip>
    </div>
  </b-field>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit-element'
import RenderWcFunc from './RenderWcFunc.vue'

@Component({
  components: {
    RenderWcFunc,
  }
})
export default class extends Vue {
  @Prop() property!: PropertyState;
  @Prop() actions!: any;
  @Prop() renderObject!: (object: PropertyObjectState) => TemplateResult;
  @Prop() renderMultiEditor!: () => TemplateResult;
}
</script>
