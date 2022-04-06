import { DESCRIBE, CONSTRUCT, SELECT, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
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

interface GetHierarchyPatterns {
  restrictTypes?: boolean
  firstLevel(subject: Term, path: MultiPointer, level: number): SparqlTemplateResult
  initialRoots?: Term[]
}

function anyPath (subject: Term, path: MultiPointer, level: number) {
  const inverse = path.term?.termType === 'BlankNode'
  if (inverse) {
    return sparql`${subject} ?property ${parent(level)} .`
  }

  return sparql`${parent(level)} ?property ${subject} .`
}

function requiredPath (subject: Term, path: MultiPointer, level: number) {
  return sparql`${parent(level)} ${toSparql(path)} ${subject} .`
}

function getHierarchyPatterns (focusNode: MultiPointer, { restrictTypes = true, firstLevel, initialRoots = [] }: GetHierarchyPatterns) {
  let currentLevel = focusNode
  let roots: Term[] = initialRoots
  let patterns = sparql``
  let subject = variable('this')
  let level = 1

  // walk up meta:nextInHierarchy and collect all paths
  while (currentLevel.term) {
    roots = currentLevel.out(meta.hierarchyRoot).terms
    if (roots.length) {
      break
    }

    let nextPattern: SparqlTemplateResult
    try {
      const path = currentLevel.out(sh.path)
      if (level === 1) {
        nextPattern = firstLevel(subject, path, level)
      } else {
        nextPattern = requiredPath(subject, path, level)
      }
    } catch {
      break
    }

    const targetClass = currentLevel.out(sh.targetClass).term
    if (targetClass && restrictTypes) {
      nextPattern = sparql`${nextPattern}\n${subject} a ${targetClass} .`
    }

    patterns = sparql`${nextPattern}\n${patterns}`

    currentLevel = currentLevel.in(meta.nextInHierarchy)
    subject = parent(level)
    level++
  }

  if (!roots.length) {
    return null
  }

  patterns = sparql`
    VALUES ${subject} { ${roots} }
    ${patterns}
  `

  return patterns
}

export function properties (focusNode: GraphPointer): string {
  const patterns = getHierarchyPatterns(focusNode, {
    firstLevel: anyPath,
  })
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
  const patterns = getHierarchyPatterns(focusNode, {
    restrictTypes: false,
    firstLevel: anyPath,
  })
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
          minus {
            ?this a ${meta.Hierarchy}
          }
        `}
      }

      optional { ?type ${rdfs.label} ?rdfsLabel }

      bind(if(bound(?rdfsLabel), concat(?rdfsLabel, " (", str(?type), ")"), str(?type)) as ?label)
    `
    .build()
}

export function example (focusNode: GraphPointer, limit = 1, offset = 0, parents: Term[] = []): string {
  const patterns = getHierarchyPatterns(focusNode, {
    firstLevel: requiredPath,
    initialRoots: parents,
  })
  if (!patterns) {
    return ''
  }

  return DESCRIBE`?this`
    .WHERE`
      ${patterns}
      filter(isiri(?this))
    `
    .LIMIT(limit)
    .OFFSET(offset)
    .build()
}
