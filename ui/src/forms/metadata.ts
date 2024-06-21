import $rdf from '@cube-creator/env'
import { dash, rdf, rdfs } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'

export const Metadata = $rdf.dataset([
  $rdf.quad(ns.editor.RadioButtons, rdfs.label, $rdf.literal('Radio buttons')),
  $rdf.quad(ns.editor.DictionaryTableEditor, rdf.type, dash.MultiEditor),
  $rdf.quad(ns.editor.FileUpload, rdf.type, dash.MultiEditor),
  $rdf.quad(ns.editor.TagsWithLanguageEditor, rdf.type, dash.MultiEditor),
  $rdf.quad(ns.editor.CheckboxListEditor, rdf.type, dash.MultiEditor),
])
