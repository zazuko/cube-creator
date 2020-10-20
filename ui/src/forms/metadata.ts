import { dataset, literal, quad } from '@rdf-esm/dataset'
import { editor } from '@/forms/bulma'
import { rdfs } from '@tpluscode/rdf-ns-builders'

export const Metadata = dataset([
  quad(editor.RadioButtons, rdfs.label, literal('Radio buttons'))
])
