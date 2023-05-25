import onetime from 'onetime'
import { md } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { Parameters, PropertyShape } from '@hydrofoil/shape-to-query/model/constraint/ConstraintComponent'
import namespace from '@rdfjs/namespace'
import { sparql } from '@tpluscode/sparql-builder'
import env from './env'

/*
 The @hydrofoil/shape-to-query is an ES Module and as long as we compile to CJS, it needs to be loaded dynamically
 using this ugly TS hack
 */
// eslint-disable-next-line no-new-func
const _importDynamic = new Function('modulePath', 'return import(modulePath)')

export default async function shapeToQuery() {
  await setup()

  const { constructQuery, deleteQuery } = await _importDynamic('@hydrofoil/shape-to-query')

  return {
    constructQuery,
    deleteQuery,
  }
}

const setup = onetime(async () => {
  await defineConstraintComponents()
})

async function defineConstraintComponents() {
  const { ConstraintComponent } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/ConstraintComponent.js')
  const { constraintComponents } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/index.js')
  const { PatternConstraintComponent } = await _importDynamic('@hydrofoil/shape-to-query/model/constraint/pattern.js')

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
            yield new PatternConstraintComponent('^' + patternElement.pointer.value)
        }
      }
    }

    constructor(private readonly vendor: 'stardog' | 'fuseki', private readonly pattern: string) {
      super(md.FreeTextSearchConstraintComponent)
    }

    buildPatterns({ focusNode, valueNode, propertyPath }: Parameters): any {
      if (this.vendor === 'stardog') {
        const fts = namespace('tag:stardog:api:search:')
        return sparql`
        service ${fts.textMatch} {
          [] ${fts.query} '${this.pattern + '*'}';
             ${fts.result} ${valueNode} ;
        }
        ${focusNode} ${propertyPath} ${valueNode} .
      `
      }

      if (this.vendor === 'fuseki') {
        return sparql`
        ${focusNode} <http://jena.apache.org/text#query> (${propertyPath} '${this.pattern + '*'}') .

        # Second filtering to make sure the word starts with the given query
        ${focusNode} ${propertyPath} ${valueNode} .
        FILTER (REGEX(${valueNode}, "^${this.pattern}", "i"))
      `
      }

      throw new Error('Unsupported vendor')
    }
  })
}
