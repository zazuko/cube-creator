<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Save term"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { SharedDimension, SharedDimensionTerm } from '@/store/types'

const sharedDimensionNS = namespace('sharedDimension')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class extends Vue {
  @sharedDimensionNS.State('dimension') dimension!: SharedDimension
  @sharedDimensionNS.Getter('findTerm') findTerm!: (id: string) => SharedDimensionTerm

  resource: GraphPointer | null = Object.freeze(clownface({ dataset: dataset() }).namedNode(''));
  error: ErrorDetails | null = null;
  isSubmitting = false;
  shape: Shape | null = null;
  shapes: GraphPointer | null = null;

  get term (): SharedDimensionTerm {
    const termId = this.$route.params.termId
    return this.findTerm(termId)
  }

  get operation (): RuntimeOperation | null {
    return this.term.actions.replace
  }

  get title (): string {
    return this.operation?.title ?? ''
  }

  async mounted (): Promise<void> {
    this.resource = Object.freeze(this.term.pointer)

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      const term = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
      })

      this.$store.commit('sharedDimension/storeTerm', term)

      this.$buefy.toast.open({
        message: 'Shared dimension term successfully saved',
        type: 'is-success',
      })

      this.$router.push({ name: 'SharedDimension', params: { id: this.dimension.clientPath } })
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'SharedDimension', params: { id: this.dimension.clientPath } })
  }
}
</script>
