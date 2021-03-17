<template>
  <side-pane :title="title" @close="onCancel">
    <div v-if="isRawMode" class="h-full is-flex is-flex-direction-column is-justify-content-space-between">
      <hydra-raw-rdf-form
        ref="rdfEditor"
        v-if="operation"
        :operation="operation"
        :resource="resource"
        :shape="shape"
        :error="error"
        :is-submitting="isSubmitting"
        @submit="onSubmit"
        @cancel="onCancel"
      />
      <b-button @click="toggleMode">
        Back to form (basic)
      </b-button>
    </div>
    <div v-else class="h-full is-flex is-flex-direction-column is-justify-content-space-between">
      <hydra-operation-form
        ref="form"
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
      <b-button icon-right="exclamation-triangle" @click="toggleMode">
        Edit raw RDF (advanced)
      </b-button>
    </div>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import HydraRawRdfForm from '@/components/HydraRawRdfForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { SharedDimension } from '@/store/types'

const sharedDimensionNS = namespace('sharedDimension')

@Component({
  components: { SidePane, HydraOperationForm, HydraRawRdfForm },
})
export default class extends Vue {
  @sharedDimensionNS.State('dimension') dimension!: SharedDimension

  operation: RuntimeOperation | null = null
  resource: GraphPointer | null = null
  error: ErrorDetails | null = null
  isSubmitting = false
  shape: Shape | null = null
  shapes: GraphPointer | null = null
  isRawMode = false

  mounted (): void {
    this.prepareForm()
  }

  toggleMode () {
    if (this.isRawMode) {
      const rdfEditor: HydraRawRdfForm = this.$refs.rdfEditor as any
      this.resource = Object.freeze(clownface({
        dataset: $rdf.dataset(rdfEditor.editorQuads || []),
        term: this.resource!.term,
      }))
    } else {
      const form: HydraOperationForm = this.$refs.form as any
      this.resource = Object.freeze(form.clone)
    }

    this.isRawMode = !this.isRawMode
  }

  @Watch('$route')
  async prepareForm (): Promise<void> {
    this.resource = null
    this.operation = null
    this.shape = null

    const termId = this.$route.params.termId
    const term = await api.fetchResource(termId)

    this.resource = Object.freeze(term.pointer)
    this.operation = term.actions.replace ?? null

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  get title (): string {
    return this.operation?.title ?? ''
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
