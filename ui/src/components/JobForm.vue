<template>
  <div>
    <p v-if="hasNoOptions && !error">
      No settings to fill in. Just hit the button below to start the transformation.
    </p>
    <hydra-operation-form
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @submit="onSubmit"
      :show-cancel="false"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import type { Shape } from '@rdfine/shacl'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { schema } from '@tpluscode/rdf-ns-builders'

@Component({
  components: { HydraOperationForm },
})
export default class JobForm extends Vue {
  @Prop() operation!: RuntimeOperation

  resource: GraphPointer = Object.freeze(clownface({ dataset: dataset() }).namedNode('').addOut(schema.name, 'test'));
  shape: Shape | null = null;
  error: ErrorDetails | null = null;
  isSubmitting = false;

  async mounted (): Promise<void> {
    this.shape = await api.fetchOperationShape(this.operation)
  }

  get hasNoOptions (): boolean {
    return this.shape?.property.length === 0
  }

  async onSubmit (): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('app/showMessage', {
        message: 'Transformation was started',
        type: 'is-success',
      })

      this.$store.dispatch('project/fetchJobCollection')
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }
}
</script>
