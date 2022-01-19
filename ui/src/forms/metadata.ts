import { dataset, literal, quad } from '@rdf-esm/dataset'
import { dash, rdf, rdfs } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'

export const Metadata = dataset([
  quad(ns.editor.RadioButtons, rdfs.label, literal('Radio buttons')),
  quad(ns.editor.DictionaryTableEditor, rdf.type, dash.MultiEditor),
  quad(ns.editor.FileUpload, rdf.type, dash.MultiEditor),
  quad(ns.editor.TagsWithLanguageEditor, rdf.type, dash.MultiEditor),
  quad(ns.editor.CheckboxListEditor, rdf.type, dash.MultiEditor),
])
