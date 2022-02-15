import { CONSTRUCT, SELECT, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { GraphPointer, MultiPointer } from 'clownface'
import { meta } from '@cube-creator/core/namespace'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { Term } from 'rdf-js'

interface HierarchyPath {
  inverse: boolean
  property: MultiPointer
}

function propertiesQuery (root: Term, paths: HierarchyPath[]) {
  const [thisLevel, ...rest] = paths
  let patterns
  if (rest.length) {
    const path = rest.reduceRight<SparqlTemplateResult | string>((previous, { property, inverse }) => {
      const next = sparql`${inverse ? '^' : ''}${property.term}`
      if (!previous) {
        return next
      }

      return sparql`${previous}/${next}`
    }, '')

    const propertyPattern = thisLevel.inverse
      ? sparql`?parent ?property ?this .`
      : sparql`?this ?parent ?property .`

    patterns = sparql`${root} ${path} ?parent .\n${propertyPattern}`
  } else {
    patterns = thisLevel.inverse
      ? sparql`?this ?property ${root} .`
      : sparql`${root} ?property ?this .`
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

function getProperty (value: MultiPointer | undefined): HierarchyPath | null {
  if (!value) {
    return null
  }

  const inverse = value.out(sh.inversePath).terms.length > 0
  const property = inverse
    ? value?.out(sh.inversePath).toArray().shift()
    : value

  if (!property) {
    return null
  }

  return { property, inverse }
}

function getPathAndRoot (focusNode: MultiPointer) {
  let currentLevel = focusNode
  let root = focusNode.out(meta.hierarchyRoot).term
  const properties: HierarchyPath[] = []

  // walk up meta:nextInHierarchy and collect all paths
  while (!root && currentLevel.in(meta.nextInHierarchy).term) {
    const pathAtLevel = getProperty(currentLevel.out(sh.path))
    if (!pathAtLevel) {
      return {}
    }

    properties.push(pathAtLevel)
    currentLevel = currentLevel.in(meta.nextInHierarchy)
    root = currentLevel.out(meta.hierarchyRoot).term
  }

  const lastPath = getProperty(currentLevel.out(sh.path))

  if (!root || !lastPath) {
    return {}
  }

  properties.push(lastPath)

  return { root, properties }
}

export function buildQuery (focusNode: GraphPointer) {
  const { root, properties } = getPathAndRoot(focusNode)
  if (root && properties) {
    return propertiesQuery(root, properties)
  }
  return ''
}
