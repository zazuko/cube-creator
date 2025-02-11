import onetime from 'onetime'
import { md } from '@cube-creator/core/namespace'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { hydra, sh } from '@tpluscode/rdf-ns-builders'
import { Parameters, PropertyShape } from '@hydrofoil/shape-to-query/model/constraint/ConstraintComponent'
import evalTemplateLiteral from 'rdf-loader-code/evalTemplateLiteral.js'
import namespace from '@rdfjs/namespace'
import $rdf from 'rdf-ext'
import type { Literal } from '@rdfjs/types'
import type { ServicePattern, GroupPattern } from 'sparqljs'
import env from './env'

/*
 The @hydrofoil/shape-to-query is an ES Module and as long as we compile to CJS, it needs to be loaded dynamically
 using this ugly TS hack
 */
// eslint-disable-next-line no-new-func
const _importDynamic = new Function('modulePath', 'return import(modulePath)')

export default async function shapeToQuery(): Promise<Pick<typeof import('@hydrofoil/shape-to-query'), 'constructQuery' | 'deleteQuery' | 's2q'>> {
  await setup()

  const {
    constructQuery,
    deleteQuery,
    s2q,
  } = await _importDynamic('@hydrofoil/shape-to-query') as typeof import('@hydrofoil/shape-to-query')

  return {
    constructQuery,
    deleteQuery,
    s2q,
  }
}

export async function rewriteTemplates(shape: AnyPointer, variables: Map<string, unknown>) {
  const { s2q } = await shapeToQuery()

  shape.any().has(s2q('template' as any))
    .forEach(templateNode => {
      const template = templateNode.out(s2q('template' as any))
      if (!isGraphPointer(template)) {
        throw new Error('Template not found')
      }

      const value = evalTemplateLiteral(template.value, { variables })
      const literalOption = (template.term as Literal).language || (template.term as Literal).datatype

      ;[...shape.dataset.match(null, null, templateNode.term)].forEach(quad => {
        shape.dataset.delete(quad)
        shape.dataset.add($rdf.quad(quad.subject, quad.predicate, $rdf.literal(value, literalOption), quad.graph))
      })

      templateNode.deleteOut()
    })

  shape.any().has(s2q('variable' as any))
    .forEach(templateNode => {
      const variableName = templateNode.out(s2q('variable' as any)).value
      if (!variableName) {
        return
      }

      const value: any = variables.get(variableName) || templateNode.out(sh.defaultValue).term

      ;[...shape.dataset.match(null, null, templateNode.term)].forEach(quad => {
        shape.dataset.delete(quad)
        if (value) {
          shape.dataset.add($rdf.quad(quad.subject, quad.predicate, value, quad.graph))
        }
      })

      templateNode.deleteOut()
    })
}

const setup = onetime(async () => {
  await defineConstraintComponents()
})

async function defineConstraintComponents() {
  const { default: ConstraintComponent } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/ConstraintComponent.js') as typeof import('@hydrofoil/shape-to-query/model/constraint/ConstraintComponent.js')
  const { constraintComponents } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/index.js') as typeof import('@hydrofoil/shape-to-query/model/constraint/index.js')
  const { PatternConstraintComponent } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/pattern.js') as typeof import('@hydrofoil/shape-to-query/model/constraint/pattern.js')

  constraintComponents.set(md.FreeTextSearchConstraintComponent, class TextSearch extends ConstraintComponent {
    static match(pointer: GraphPointer) {
      return isGraphPointer(pointer.out(hydra.freetextQuery))
    }

    static * fromShape(shape: PropertyShape) {
      const pattern = shape.get(hydra.freetextQuery) || []

      for (const patternElement of pattern) {
        if (!('pointer' in patternElement)) {
          continue
        }

        switch (env.maybe.MANAGED_DIMENSIONS_STORE_ENGINE) {
          case 'stardog':
            yield new TextSearch('stardog', patternElement.pointer.value)
            break
          case 'fuseki':
            yield new TextSearch('fuseki', patternElement.pointer.value)
            break
          default:
            yield new PatternConstraintComponent(patternElement.pointer.term as Literal)
        }
      }
    }

    constructor(private readonly vendor: 'stardog' | 'fuseki', private readonly pattern: string) {
      super(md.FreeTextSearchConstraintComponent)
    }

    buildPropertyShapePatterns(args: Parameters) {
      if (this.vendor === 'stardog') {
        return [this.stardogServiceGroup(args)]
      }

      if (this.vendor === 'fuseki') {
        return [this.fusekiPatterns(args)]
      }

      throw new Error('Unsupported vendor')
    }

    stardogServiceGroup({ focusNode, valueNode, propertyPath }: Parameters): ServicePattern {
      if (!propertyPath || !('value' in propertyPath)) {
        throw new Error('Property path must be a named node')
      }

      const fts = namespace('tag:stardog:api:search:')

      const patterns = clownface({ dataset: $rdf.dataset() })
        .blankNode()
        .addOut(fts.query, $rdf.literal(this.pattern + '*'))
        .addOut(fts.result, valueNode)
        .node(focusNode).addOut(propertyPath, valueNode)

      return {
        type: 'service',
        name: fts.textMatch,
        silent: false,
        patterns: [{
          type: 'bgp',
          triples: [...patterns.dataset],
        }],
      }
    }

    fusekiPatterns({ focusNode, valueNode, propertyPath }: Parameters): GroupPattern {
      if (!propertyPath || !('value' in propertyPath)) {
        throw new Error('Property path must be a named node')
      }

      const patterns = clownface({ dataset: $rdf.dataset() })
        .node(focusNode)
        .addList($rdf.namedNode('http://jena.apache.org/text#query'), [propertyPath, $rdf.literal(this.pattern + '*')])
        .addOut(propertyPath, valueNode) // Second filtering to make sure the word starts with the given query

      return {
        type: 'group',
        patterns: [{
          type: 'bgp',
          triples: [...patterns.dataset],
        }, {
          type: 'filter',
          expression: {
            type: 'operation',
            operator: 'regex',
            args: [valueNode, $rdf.literal('^' + this.pattern), $rdf.literal('i')],
          },
        }],
      }
    }
  })
}
