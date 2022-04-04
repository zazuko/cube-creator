import { html, Lazy, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import { dash, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { createCustomElement } from '@/forms/custom-element'
import { api } from '@/api'
import { SingleEditorRenderParams } from '@hydrofoil/shaperone-core/models/components/index'
import { Term } from 'rdf-js'
import { displayLanguage } from '@/store/serializers'
import { editor } from '@cube-creator/core/namespace'
import { toSparql } from 'clownface-shacl-path'

interface LabelViewerState {
  isLoading: boolean
  currentResource: Term
  label?: string
}

type LabelViewer = SingleEditorComponent<LabelViewerState> & {
  shouldLoad({ value }: SingleEditorRenderParams<LabelViewerState>): boolean | undefined
}

export const labelViewer: Lazy<LabelViewer> = {
  editor: dash.LabelViewer,
  shouldLoad ({ value: { object, componentState: { label, currentResource } } }) {
    return object && (typeof label === 'undefined' || !currentResource.equals(object.term))
  },
  init (params) {
    const { value: { object, componentState: { isLoading } }, updateComponentState } = params

    if (object && this.shouldLoad(params) && !isLoading) {
      updateComponentState({
        isLoading: true,
        currentResource: object.term
      })

      api.fetchResource(object.value)
        .then(resource => {
          const label = resource.pointer.out([schema.name, rdfs.label], { language: displayLanguage }).values[0] || object.value
          updateComponentState({
            label,
          })
        })
        .catch(() => updateComponentState({ label: object.value }))
        .finally(() => updateComponentState({ isLoading: false }))

      return false
    }

    return !isLoading
  },
  async lazyRender () {
    await import('./LabelViewer.vue').then(createCustomElement('cc-form-label'))
    return ({ value }) => {
      const { label } = value.componentState

      return html`
        <cc-form-label .value="${label}"></cc-form-label>`
    }
  }
}

export const hierarchyPropertyViewer: Lazy<SingleEditorComponent> = {
  editor: editor.HierarchyPropertyViewer,
  async lazyRender () {
    await import('../editors/TextFieldEditor.vue').then(createCustomElement('cc-hierarchy-property'))

    return ({ value }) => {
      let label = ''
      if (value.object) {
        label = toSparql(value.object).toString({ prologue: false })
      }

      return html`
        <cc-hierarchy-property .value="${label}" readonly></cc-hierarchy-property>`
    }
  }
}
