import { dataset, literal, quad } from '@rdf-esm/dataset'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'

export const Metadata = dataset([
  quad(ns.editor.RadioButtons, rdfs.label, literal('Radio buttons')),
])
