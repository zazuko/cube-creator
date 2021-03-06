<template>
  <form @submit.prevent="onSubmit">
    <rdf-editor
      ref="editor"
      v-if="shape"
      format="text/turtle"
      :quads.prop="initQuads"
      :prefixes="editorPrefixes"
      @quads-changed="onParseSuccess"
      @parsing-failed="onParseError"
    />
    <loading-block v-else />

    <b-message v-if="parseError" type="is-danger" title="Parse error" class="error-message mt-4">
      {{ parseError }}
    </b-message>

    <hydra-operation-error :error="error" :shape="shape" class="mt-4" />

    <form-submit-cancel
      :submit-label="_submitLabel"
      :is-submitting="isSubmitting"
      :show-cancel="showCancel"
      :disabled="!shape"
      @cancel="$emit('cancel')"
    />
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import FormSubmitCancel from './FormSubmitCancel.vue'
import HydraOperationError from './HydraOperationError.vue'
import { ErrorDetails } from '@/api/errors'
import LoadingBlock from './LoadingBlock.vue'
import { BlankNode, DefaultGraph, NamedNode, Quad, Variable } from 'rdf-js'
import { Shape } from '@rdfine/shacl'

interface ParseError {
  detail: { error: string }
}

@Component({
  components: { FormSubmitCancel, HydraOperationError, LoadingBlock },
})
export default class HydraRawRdfForm extends Vue {
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ required: true }) resource!: GraphPointer
  @Prop({ required: true }) shape!: Shape | null
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() showCancel?: boolean
  @Prop() submitLabel?: string

  parseError: string | null = null
  editorQuads: Quad[] | null = null
  editorPrefixes = ['hydra', 'rdf', 'rdfs', 'schema', 'xsd']

  get graph (): NamedNode | BlankNode | Variable | DefaultGraph | undefined {
    return this.resource._context[0].graph
  }

  get initQuads (): Quad[] {
    if (!this.resource) return []

    return [
      ...this.resource.dataset.match(null, null, null, this.graph)
    ]
  }

  get clone (): GraphPointer | null {
    if (!this.resource || !this.editorQuads) return null

    return clownface({
      dataset: $rdf.dataset(this.editorQuads),
      term: this.resource.term,
      graph: this.graph,
    })
  }

  get _submitLabel (): string {
    return this.submitLabel ?? this.operation.title ?? 'Save'
  }

  onParseSuccess ({ detail: { value } }: { detail: { value: Quad[] } }): void {
    this.parseError = null
    this.editorQuads = value
      .map(({ subject, predicate, object }) => $rdf.quad(subject, predicate, object, this.graph))
  }

  onParseError ({ detail: { error } }: ParseError): void {
    this.parseError = error
    this.editorQuads = null
  }

  async onSubmit (): Promise<void> {
    await this.waitParsing()

    if (this.clone) {
      this.$emit('submit', this.clone)
    }
  }

  async waitParsing (): Promise<void> {
    const editor = this.$refs.editor as any

    return new Promise((resolve, reject) => {
      const parsingComplete = () => {
        editor.removeEventListener('quads-changed', parsingComplete)
        editor.removeEventListener('parsing-failed', parsingFailed)
        resolve()
      }

      const parsingFailed = (e: ParseError) => {
        editor.removeEventListener('quads-changed', parsingComplete)
        editor.removeEventListener('parsing-failed', parsingFailed)
        reject(e)
      }

      if (editor.isParsing) {
        editor.addEventListener('quads-changed', parsingComplete)
        editor.addEventListener('parsing-failed', parsingFailed)
      } else {
        resolve()
      }
    })
  }
}
</script>
