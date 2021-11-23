<template>
  <side-pane :title="title" @close="onCancel">
    <b-field label="URI" v-if="termUri">
      <a class="form-input" :href="termUri" target="_blank" rel="noopener noreferer">
        <span>{{ termUri }}</span>
        <b-icon icon="external-link-alt" />
      </a>
    </b-field>
    <hydra-operation-form-with-raw
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
import { Component, Vue, Watch } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import SidePane from '@/components/SidePane.vue'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import * as storeNs from '../store/namespace'
import { serializeSharedDimensionTerm } from '../store/serializers'
import { SharedDimension, SharedDimensionTerm } from '../store/types'

@Component({
  components: { SidePane, HydraOperationFormWithRaw },
})
export default class extends Vue {
  @storeNs.sharedDimension.State('dimension') dimension!: SharedDimension

  operation: RuntimeOperation | null = null
  term: SharedDimensionTerm | null = null
  resource: GraphPointer | null = null
  error: ErrorDetails | null = null
  isSubmitting = false
  shape: Shape | null = null
  shapes: GraphPointer | null = null

  mounted (): void {
    this.prepareForm()
  }

  @Watch('$route')
  async prepareForm (): Promise<void> {
    this.resource = null
    this.operation = null
    this.shape = null

    const termId = this.$route.params.termId
    const term = await api.fetchResource(termId)

    this.term = serializeSharedDimensionTerm(term)
    this.resource = Object.freeze(term.pointer)
    this.operation = term.actions.replace ?? null

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation, {
        targetClass: this.dimension.id,
      })
    }
  }

  get title (): string {
    return this.operation?.title ?? ''
  }

  get termUri (): string | null {
    return this.term?.canonical?.value || this.term?.id?.value || null
  }

  async onSubmit (resource: GraphPointer): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      const term = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource,
        headers: { Prefer: `target-class=${this.dimension.id.value}` },
      })

      this.$store.dispatch('sharedDimension/updateTerm', term)

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
