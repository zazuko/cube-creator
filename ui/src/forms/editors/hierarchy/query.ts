import { CONSTRUCT, SELECT, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { GraphPointer, MultiPointer } from 'clownface'
import { meta } from '@cube-creator/core/namespace'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { Term, Variable } from 'rdf-js'
import { variable } from '@rdf-esm/data-model'
import { toSparql } from 'clownface-shacl-path'

function parent (level: number): Variable {
  return variable(`parent${level}`)
}

function getHierarchyPatterns (focusNode: MultiPointer) {
  let currentLevel = focusNode
  let root: Term | undefined
  let patterns = sparql``
  let subject = variable('this')
  let level = 1

  // walk up meta:nextInHierarchy and collect all paths
  while (currentLevel.term) {
    root = currentLevel.out(meta.hierarchyRoot).term
    if (root) {
      break
    }

    let nextPattern: SparqlTemplateResult
    const path = currentLevel.out(sh.path)
    if (level === 1) {
      const inverse = path.term?.termType === 'BlankNode'
      if (inverse) {
        nextPattern = sparql`${subject} ?property ${parent(level)} .`
      } else {
        nextPattern = sparql`${parent(level)} ?property ${subject} .`
      }
    } else {
      try {
        nextPattern = sparql`${parent(level)} ${toSparql(path)} ${subject} .`
      } catch {
        break
      }
    }

    const targetClass = currentLevel.out(sh.targetClass).term
    if (targetClass) {
      nextPattern = sparql`${nextPattern}\n${subject} a ${targetClass} .`
    }

    patterns = sparql`${nextPattern}\n${patterns}`

    currentLevel = currentLevel.in(meta.nextInHierarchy)
    subject = parent(level)
    level++
  }

  if (!root) {
    return null
  }

  patterns = sparql`
    BIND ( ${root} as ${subject} )
    ${patterns}
  `

  return patterns
}

export function properties (focusNode: GraphPointer): string {
  const patterns = getHierarchyPatterns(focusNode)
  if (!patterns) {
    return ''
  }

  return CONSTRUCT`?property ${rdfs.label} ?label`
    .WHERE`
      {
        ${SELECT.DISTINCT`?property`.WHERE`
          ${patterns}
          filter(isiri(?this))
        `}
      }

      optional { ?property ${rdfs.label} ?rdfsLabel }

      bind(if(bound(?rdfsLabel), concat(?rdfsLabel, " (", str(?property), ")"), str(?property)) as ?label)
    `
    .build()
}

export function types (focusNode: GraphPointer): string {
  const patterns = getHierarchyPatterns(focusNode)
  if (!patterns) {
    return ''
  }

  return CONSTRUCT`?type ${rdfs.label} ?label`
    .WHERE`
      {
        ${SELECT.DISTINCT`?type`.WHERE`
          ${patterns}
          ?this a ?type
          filter(isiri(?this))
        `}
      }

      optional { ?type ${rdfs.label} ?rdfsLabel }

      bind(if(bound(?rdfsLabel), concat(?rdfsLabel, " (", str(?type), ")"), str(?type)) as ?label)
    `
    .build()
}
