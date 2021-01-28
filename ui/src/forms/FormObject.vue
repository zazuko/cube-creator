<template>
  <div v-if="object" class="form-object">
    <render-wc-template :template-result="renderEditor()" class="form-object-editor" />
    <div v-if="property.canRemove">
      <b-tooltip label="Remove value">
        <b-button icon-left="minus" @click.prevent="actions.remove" type="is-white" />
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { TemplateResult } from 'lit-element'
import RenderWcTemplate from './RenderWcTemplate.vue'

@Component({
  components: { RenderWcTemplate },
})
export default class extends Vue {
  @Prop() object!: PropertyObjectState;
  @Prop() property!: PropertyState;
  @Prop() actions!: any;
  @Prop() renderEditor!: () => TemplateResult;
}
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
