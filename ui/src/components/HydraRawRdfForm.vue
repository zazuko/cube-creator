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
import { defineComponent, PropType } from '@vue/composition-api'
import { RuntimeOperation } from 'alcaeus'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import BMessage from './BMessage.vue'
import FormSubmitCancel from './FormSubmitCancel.vue'
import HydraOperationError from './HydraOperationError.vue'
import { ErrorDetails } from '@/api/errors'
import LoadingBlock from './LoadingBlock.vue'
import { BlankNode, DefaultGraph, NamedNode, Quad, Variable } from 'rdf-js'
import { Shape } from '@rdfine/shacl'

interface ParseError {
  detail: { error: string }
}

export default defineComponent({
  name: 'HydraRawRdfForm',
  components: { BMessage, FormSubmitCancel, HydraOperationError, LoadingBlock },
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    resource: {
      type: Object as PropType<GraphPointer>,
      required: true,
    },
    shape: {
      type: Object as PropType<Shape | null>,
      required: true,
    },
    error: {
      type: Object as PropType<ErrorDetails | null>,
      default: null,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    showCancel: {
      type: Boolean,
      default: false,
    },
    submitLabel: {
      type: String,
      default: undefined,
    },
  },

  data (): { parseError: string | null, editorQuads: Quad[] | null, editorPrefixes: string[] } {
    return {
      parseError: null,
      editorQuads: null,
      editorPrefixes: ['hydra', 'rdf', 'rdfs', 'schema', 'xsd'],
    }
  },

  computed: {
    graph (): NamedNode | BlankNode | Variable | DefaultGraph | undefined {
      return this.resource._context[0].graph
    },

    initQuads (): Quad[] {
      if (!this.resource) return []

      return [
        ...this.resource.dataset.match(null, null, null, this.graph)
      ]
    },

    clone (): GraphPointer | null {
      if (!this.resource || !this.editorQuads) return null

      return clownface({
        dataset: $rdf.dataset(this.editorQuads),
        term: this.resource.term,
        graph: this.graph,
      })
    },

    _submitLabel (): string {
      return this.submitLabel ?? this.operation.title ?? 'Save'
    },
  },

  methods: {
    onParseSuccess ({ detail: { value } }: { detail: { value: Quad[] } }): void {
      this.parseError = null
      this.editorQuads = value
        .map(({ subject, predicate, object }) => $rdf.quad(subject, predicate, object, this.graph))
    },

    onParseError ({ detail: { error } }: ParseError): void {
      this.parseError = error
      this.editorQuads = null
    },

    async onSubmit (): Promise<void> {
      await this.waitParsing()

      if (this.clone) {
        this.$emit('submit', this.clone)
      }
    },

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
    },
  },
})
</script>
