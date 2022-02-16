import { CONSTRUCT, SELECT, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { GraphPointer, MultiPointer } from 'clownface'
import { meta } from '@cube-creator/core/namespace'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { Term, Variable } from 'rdf-js'
import { variable } from '@rdf-esm/data-model'

function propertiesQuery (root: Term, patterns: SparqlTemplateResult) {
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

function parent (level: number): Variable {
  return variable(`parent${level}`)
}

function getHierarchyPatterns (focusNode: MultiPointer) {
  let currentLevel = focusNode
  const root = focusNode.out(meta.hierarchyRoot).term
  let patterns = sparql``
  let subject = variable('this')
  let level = 1

  // walk up meta:nextInHierarchy and collect all paths
  while (currentLevel.term) {
    const path = currentLevel.out(sh.path)
    const inverse = path.term?.termType === 'BlankNode'
    let property: Term | undefined = variable('property')
    if (level > 1) {
      property = inverse ? path.out(sh.inversePath).term : path.term
      if (!property) {
        break
      }
    }

    if (inverse) {
      patterns = sparql`${subject} ${property} ${parent(level)} .\n${patterns}`
    } else {
      patterns = sparql`${parent(level)} ${property} ${subject} .\n${patterns}`
    }

    currentLevel = currentLevel.in(meta.nextInHierarchy)
    subject = parent(level)
    level++
  }

  if (!root) {
    return {}
  }

  patterns = sparql`
    BIND ( ${root} as ${subject} )
    ${patterns}
  `

  return { root, patterns }
}

export function buildQuery (focusNode: GraphPointer) {
  const { root, patterns } = getHierarchyPatterns(focusNode)
  if (root && patterns) {
    return propertiesQuery(root, patterns)
  }
  return ''
}
