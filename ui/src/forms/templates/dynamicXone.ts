import { decorate, FocusNodeTemplate } from '@hydrofoil/shaperone-wc/templates'
import type { PropertyShape } from '@rdfine/shacl'
import { NamedNode, Term } from 'rdf-js'
import { sh1 } from '@cube-creator/core/namespace'
import { FocusNode } from '@hydrofoil/shaperone-core'
import { findNodes } from 'clownface-shacl-path'

function hasValueEquals (focusNode: FocusNode, discriminator: NamedNode, actualValue: Term | undefined) {
  return (shape: PropertyShape) => {
    return !Array.isArray(shape.path) &&
      shape.path?.equals(discriminator) &&
      shape.hasValue.some(hasValue => hasValue.equals(actualValue))
  }
}

/**
 * Focus node rendering decorator, which will choose properties to render by only showing those
 * matching a `sh1:xoneDiscriminator`.
 *
 * Add a hidden property to the items of `sh:xone`. Properties within its group will be shown onyl when
 * the focus node value of the discriminator matches the `sh:hasValue` of that hidden property
 *
 * <shape>
 *    sh1:discriminator <property> ;
 *    sh:xone (
 *      [
 *        sh:property [
 *          sh:path <property> ;
 *          sh:hasValue "foo" ;
 *          dash:hidden true ;
 *        ] ;
 *        sh:property <foo1> , <foo2> , <foo3>;
 *      ]
 *      [
 *        sh:property [
 *          sh:path <property> ;
 *          sh:hasValue "bar" ;
 *          dash:hidden true ;
 *        ] ;
 *        sh:property <bar1> , <bar2> , <bar3>;
 *      ]
 *    )
 * .
 */
export const focusNode = decorate((wrapped: FocusNodeTemplate): FocusNodeTemplate => {
  return function (context, args) {
    const { focusNode: { focusNode, logicalConstraints: { xone }, shape }, actions } = context

    const discriminator = shape?.pointer.out(sh1.xoneDiscriminator).term
    if (discriminator?.termType === 'NamedNode') {
      const [actualValue] = findNodes(focusNode, discriminator).terms

      for (const group of xone) {
        for (const { property: properties } of group.shapes) {
          const isSelectedGroup = properties.some(hasValueEquals(focusNode, discriminator, actualValue))

          requestAnimationFrame(() => {
            if (!isSelectedGroup) {
              properties.filter(({ hidden }) => !hidden).forEach(shape => actions.hideProperty(shape))
            } else {
              properties.filter(({ hidden }) => !hidden).forEach(shape => actions.showProperty(shape))
            }
          })
        }
      }
    }

    return wrapped(context, args)
  }
})
