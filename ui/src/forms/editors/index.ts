import { html, SingleEditorComponent, Lazy, MultiEditorComponent } from '@hydrofoil/shaperone-wc'
import {
  EnumSelectEditor, enumSelect as enumSelectCore,
  InstancesSelectEditor, instancesSelect as instancesSelectCore, Item
} from '@hydrofoil/shaperone-core/components'
import * as ns from '@cube-creator/core/namespace'
import { dash, hydra, rdfs, schema, xsd } from '@tpluscode/rdf-ns-builders/strict'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import { FocusNode } from '@hydrofoil/shaperone-core'
import { createCustomElement } from '../custom-element'
import '@rdfine/dash/extensions/sh/PropertyShape'
import { Literal } from 'rdf-js'
import * as hierarchyQueries from './hierarchy/query'
import { loader } from './hierarchy/index'
import { SingleEditorRenderParams } from '@hydrofoil/shaperone-core/models/components/index'
import { InstancesSelect } from '@hydrofoil/shaperone-core/lib/components/instancesSelect'
import StreamClient from 'sparql-http-client'

export const textField: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldEditor,
  async lazyRender () {
    await import('./TextFieldEditor.vue').then(createCustomElement('textfield-editor'))

    return ({ value }, { update }) => html`<textfield-editor .value="${value.object?.value || ''}" .update="${update}"></textfield-editor>`
  }
}

export const textFieldWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
    ></cc-text-field-with-lang>`
  }
}

export const textAreaWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextAreaWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
      input-type="textarea"
    ></cc-text-field-with-lang>`
  }
}

export const instanceSelect: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('select-editor'))

    return ({ property, value }, { update }) => html`<select-editor .property="${Object.freeze(property.shape)}"
                          .update="${update}"
                          .options="${value.componentState.instances}"
                          .value="${value.object?.term}"></select-editor>`
  }
}

export const enumSelect: Lazy<EnumSelectEditor> = {
  ...enumSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('select-editor'))

    return ({ property, value }, { update }) =>
      html`<select-editor .property="${Object.freeze(property.shape)}"
                          .update="${update}"
                          .options="${value.componentState.choices}"
                          .value="${value.object?.term}"></select-editor>`
  }
}

export const autoComplete: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  editor: dash.AutoCompleteEditor,
  init (params) {
    const hasFreeTextQueryVariable = !!this.searchTemplate?.(params)?.mapping
      .some(({ property }) => property?.equals(hydra.freetextQuery))

    if (!hasFreeTextQueryVariable) {
      return instancesSelectCore.init?.call(this, params) || true
    }

    const { form, property, value, updateComponentState } = params
    const { object } = value

    function updateLoadingState ({ loading = false, ready = true } = {}) {
      updateComponentState({
        loading,
        ready,
      })
    }

    const componentNotLoaded = !value.componentState.ready && !value.componentState.loading
    const hasNoLabel = object?.term.termType === 'NamedNode' && !object?.out(form.labelProperties).terms.length

    if (componentNotLoaded && object && hasNoLabel) {
      updateLoadingState({
        loading: true,
        ready: false,
      })

      const loadInstance = async () => {
        const instance = await this.loadInstance({ property: property.shape, value: object })
        if (instance) {
          const objectNode = property.shape.pointer.node(object)
          for (const labelProperty of form.labelProperties) {
            objectNode.addOut(labelProperty, instance.out(labelProperty))
          }
        }
      }

      loadInstance().then(() => updateLoadingState()).catch(updateLoadingState)

      return false
    }
    if (!value.componentState.ready) {
      updateLoadingState()
    }

    return !!value.componentState.ready
  },
  async lazyRender () {
    await import('./AutoCompleteEditor.vue').then(createCustomElement('auto-complete'))

    return (params, { update }) => {
      const { property, value, form } = params
      async function load (this: typeof autoComplete, e: CustomEvent) {
        const [filter, loading] = e.detail

        if (!this.shouldLoad(params, filter)) {
          return
        }

        loading?.(true)
        const pointers = await this.loadChoices(params, filter)
        const instances = pointers.map<Item>(p => [p, this.label(p, params.form)])
        params.updateComponentState({
          instances,
        })
        loading?.(false)
      }

      const label = value.object ? this.label(property.shape.pointer.node(value.object), form) : 'Select'

      return html`<auto-complete .property="${Object.freeze(property.shape)}"
                            .update="${update}"
                            .options="${value.componentState.instances}"
                            .value="${value.object?.term}"
                            .placeholder="${label}"
                            @search="${load.bind(this)}"></auto-complete>`
    }
  }
}

export const radioButtons: Lazy<SingleEditorComponent> = {
  editor: ns.editor.RadioButtons,
  async lazyRender () {
    await import('./RadioButtons.vue').then(createCustomElement('radio-buttons'))

    return ({ property, value }, { update }) => {
      const items = property.shape.pointer.node(property.shape.in)

      return html`<radio-buttons .options="${items}" .value="${value.object}" .update="${update}"></radio-buttons>`
    }
  }
}

export const colorPicker: Lazy<SingleEditorComponent> = {
  editor: ns.editor.ColorPicker,
  async lazyRender () {
    await import('./ColorPicker.vue').then(createCustomElement('color-picker'))

    return ({ value }, { update }) => html`<color-picker .value="${value.object?.value || ''}" .update="${update}"></color-picker>`
  }
}

const trueTerm = $rdf.literal('true', xsd.boolean)

export const checkBox: Lazy<SingleEditorComponent> = {
  editor: ns.editor.Checkbox,
  async lazyRender () {
    await import('./CheckboxEditor.vue').then(createCustomElement('cc-checkbox'))

    return ({ value }, { update }) => {
      const booleanValue = trueTerm.equals(value.object?.term)
      return html`<cc-checkbox .value="${booleanValue}" .update="${update}"></cc-checkbox>`
    }
  },
}

export const uriEditor: Lazy<SingleEditorComponent> = {
  editor: dash.URIEditor,
  async lazyRender () {
    await import('./URIInput.vue').then(createCustomElement('cc-uri-input'))

    return ({ value }, { update }) => html`<cc-uri-input .value="${value.object}" .update="${update}"></cc-uri-input>`
  }
}

export const datePickerEditor: Lazy<SingleEditorComponent> = {
  editor: dash.DatePickerEditor,
  async lazyRender () {
    await import('./DatePickerEditor.vue').then(createCustomElement('cc-date-picker'))

    return ({ value }, { update }) => html`<cc-date-picker .value="${value.object?.value}" .update="${update}"></cc-date-picker>`
  },
}

export const dateTimePickerEditor: Lazy<SingleEditorComponent> = {
  editor: dash.DateTimePickerEditor,
  async lazyRender () {
    await import('./DateTimePickerEditor.vue').then(createCustomElement('cc-date-time-picker'))

    return ({ value }, { update }) => html`<cc-date-time-picker .value="${value.object?.value}" .update="${update}"></cc-date-time-picker>`
  },
}

export const propertyEditor: Lazy<SingleEditorComponent> = {
  editor: ns.editor.PropertyEditor,
  async lazyRender () {
    await import('./PropertyInput.vue').then(createCustomElement('cc-property-input'))

    return ({ value }, { update }) => html`<cc-property-input .value="${value.object?.term}" .update="${update}"></cc-property-input>`
  },
}

function isFocusNode (value?: GraphPointer): value is FocusNode {
  return value?.term.termType === 'NamedNode' || value?.term.termType === 'BlankNode'
}

export const nestedForm: SingleEditorComponent = {
  editor: dash.DetailsEditor,
  render ({ property: { shape: { node } }, value, renderer }) {
    const focusNode = value.object

    if (isFocusNode(focusNode)) {
      return html`<div class="box">${renderer.renderFocusNode({ focusNode, shape: node })}</div>`
    }

    return html``
  }
}

export const identifierTemplateEditor: Lazy<SingleEditorComponent> = {
  editor: ns.editor.IdentifierTemplateEditor,
  async lazyRender () {
    await import('./IdentifierTemplateEditor.vue').then(createCustomElement('identifier-template-editor'))

    return ({ value, updateComponentState, focusNode }, { update }) => {
      let { tableName, isObservationTable, sourceId } = value.componentState

      if (tableName !== focusNode.out(schema.name).value) {
        tableName = focusNode.out(schema.name).value
        updateComponentState({ tableName })
      }

      if (isObservationTable !== focusNode.out(ns.cc.isObservationTable).value) {
        isObservationTable = focusNode.out(ns.cc.isObservationTable).value === 'true'
        updateComponentState({ isObservationTable })
      }

      if (sourceId !== focusNode.out(ns.cc.csvSource).term) {
        sourceId = focusNode.out(ns.cc.csvSource).term
        updateComponentState({ sourceId })
      }

      return html`<identifier-template-editor
        .value="${value.object?.value || ''}"
        .update="${update}"
        .tableName="${tableName}"
        .isObservationTable="${isObservationTable}"
        .sourceId="${sourceId}"
      ></identifier-template-editor>`
    }
  }
}

interface DictionaryTable {
  show?: Literal
}

export const dictionaryTable: Lazy<MultiEditorComponent<DictionaryTable>> = {
  editor: ns.editor.DictionaryTableEditor,
  lazyRender: async function () {
    await import('./DictionaryTableEditor.vue').then(createCustomElement('dictionary-table-editor'))

    return ({ renderer, property: { objects, shape } }) => {
      return html`<dictionary-table-editor
        .shape="${Object.freeze(shape)}"
        .objects="${objects}"
        .renderer="${renderer}"
      ></dictionary-table-editor>`
    }
  }
}

export const tagsWithLanguage: Lazy<MultiEditorComponent> = {
  editor: ns.editor.TagsWithLanguageEditor,
  async lazyRender () {
    await import('./TagsWithLanguageEditor.vue').then(createCustomElement('tags-with-language-editor'))

    return ({ property }, { update }) => {
      return html`<tags-with-language-editor
        .property="${property}"
        .update="${update}"
      ></tags-with-language-editor>`
    }
  }
}

export const fileUpload: Lazy<SingleEditorComponent> = {
  editor: ns.editor.FileUpload,
  async lazyRender () {
    await import('./FileUploadEditor.vue').then(createCustomElement('file-upload-editor'))

    return (arg, { update }) => {
      return html`<file-upload-editor .update="${update}"></file-upload-editor>`
    }
  }
}

export const checkboxList: Lazy<MultiEditorComponent> = {
  editor: ns.editor.CheckboxListEditor,
  async lazyRender () {
    await import('./CheckboxListEditor.vue').then(createCustomElement('checkbox-list'))

    return ({ property }, { update }) => {
      const values = property.objects.map(obj => obj.object?.term).filter(Boolean)
      const choices = property.shape.in.map(term => [term, property.shape.pointer.node(term).out(rdfs.label, { language: '*' })])
      return html`<checkbox-list .value="${values}"
                                 .choices="${choices}"
                                 .update="${update}"></checkbox-list>`
    }
  }
}

interface HierarchyPathComponentState extends InstancesSelect {
  client?: StreamClient
  queryUi?: string
  example?: GraphPointer
}

interface HierarchyPathEditor extends SingleEditorComponent<HierarchyPathComponentState> {
  loadExample(arg: SingleEditorRenderParams<HierarchyPathComponentState>): Promise<void>
  _init(arg: SingleEditorRenderParams): void
}

export const hierarchyPath: Lazy<HierarchyPathEditor> = {
  ...loader(hierarchyQueries.properties, instanceSelect),
  editor: ns.editor.HierarchyPathEditor,
  _init (context) {
    if (context.value.object && !context.value.componentState.example) {
      this.loadExample(context)
    }
  },
  async loadExample ({ value, focusNode, updateComponentState }) {
    const client = value.componentState.client
    const queryUi = value.componentState.queryUi
    const query = hierarchyQueries.example(focusNode)
    if (!client || !query) return

    let moreExamples: URL | undefined
    if (queryUi) {
      moreExamples = new URL(queryUi)
      const params = new URLSearchParams({
        query: hierarchyQueries.example(focusNode, 20)
      })
      moreExamples.hash = params.toString()
    }

    const stream = await client.query.construct(query)
    const dataset = await $rdf.dataset().import(stream)
    updateComponentState({
      example: clownface({ dataset }).in().toArray().shift(),
      moreExamples: moreExamples?.toString()
    })
  },
  async lazyRender () {
    await import('./HierarchyPathEditor.vue').then(createCustomElement('hierarchy-path'))

    return ({ value, updateComponentState }, { update }) => {
      const onUpdate: typeof update = (arg) => {
        update(arg)
        updateComponentState({
          example: undefined
        })
      }

      return html`<hierarchy-path .update="${onUpdate}"
                                  .value="${value.object}"
                                  .properties="${value.componentState.instances}"
                                  .example="${value.componentState.example}"
                                  .moreExamples="${value.componentState.moreExamples}"></hierarchy-path>`
    }
  }
}

export const hierarchyLevelTarget: Lazy<InstancesSelectEditor> = {
  ...loader(hierarchyQueries.types, instanceSelect),
  editor: ns.editor.HierarchyLevelTargetEditor,
}
