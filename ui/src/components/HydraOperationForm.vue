<template>
  <form @submit.prevent="$emit('submit')">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>

    <cc-form :resource.prop="resource" :shapes.prop="shapePointer" no-editor-switches />

    <form-submit-cancel
      :submit-label="operation.title"
      :is-submitting="isSubmitting"
      :show-cancel="showCancel"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import FormSubmitCancel from './FormSubmitCancel.vue'

@Component({
  components: { FormSubmitCancel },
})
export default class HydraOperationButton extends Vue {
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ required: true }) resource!: GraphPointer
  @Prop({ required: true }) shape!: Shape | null
  @Prop({ default: null }) error!: string | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() showCancel?: boolean

  get shapePointer (): GraphPointer | null {
    return this.shape?.pointer ?? null
  }
}
</script>
