<template>
  <div v-if="isRawMode" class="form-container">
    <hydra-raw-rdf-form
      ref="rdfEditor"
      :operation="operation"
      :resource="internalResource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      :submit-label="submitLabel"
      :show-cancel="showCancel"
      @submit="$emit('submit', $event)"
      @cancel="$emit('cancel', $event)"
    />
    <div class="mt-4 has-text-right">
      <b-button @click="toggleMode" icon-left="chevron-left">
        Back to form (basic)
      </b-button>
    </div>
  </div>
  <div v-else class="form-container">
    <hydra-operation-form
      ref="form"
      :operation="operation"
      :resource="internalResource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      :submit-label="submitLabel"
      :show-cancel="showCancel"
      @submit="$emit('submit', $event)"
      @cancel="$emit('cancel', $event)"
    />
    <div class="mt-4 has-text-right">
      <b-button icon-right="exclamation-triangle" @click="toggleMode" type="is-text">
        Edit raw RDF (advanced)
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import HydraRawRdfForm from '@/components/HydraRawRdfForm.vue'
import clownface, { GraphPointer } from 'clownface'
import $rdf from '@rdf-esm/dataset'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { ErrorDetails } from '@/api/errors'

@Component({
  components: { HydraOperationForm, HydraRawRdfForm },
})
export default class extends Vue {
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ required: true }) resource!: GraphPointer
  @Prop({ required: true }) shape!: Shape | null
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() showCancel?: boolean
  @Prop() submitLabel?: string

  isRawMode = false
  internalResource: GraphPointer | null = this.resource

  async toggleMode (): Promise<void> {
    await this.syncResource()
    this.isRawMode = !this.isRawMode
  }

  async syncResource (): Promise<void> {
    if (!this.internalResource) return

    if (this.isRawMode) {
      const rdfEditor: HydraRawRdfForm = this.$refs.rdfEditor as any
      await rdfEditor.waitParsing()
      this.internalResource = Object.freeze(clownface({
        dataset: $rdf.dataset(rdfEditor.editorQuads || []),
        term: this.internalResource.term,
      }))
    } else {
      const form: HydraOperationForm = this.$refs.form as any
      this.internalResource = Object.freeze(form.clone)
    }
  }
}
</script>

<style>
.form-container {
  min-height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
