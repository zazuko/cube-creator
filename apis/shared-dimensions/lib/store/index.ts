import { NamedNode, Term } from 'rdf-js'
import ParsingClient from 'sparql-http-client/ParsingClient'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { ASK, INSERT, SELECT } from '@tpluscode/sparql-builder'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import onetime from 'onetime'
import { isGraphPointer } from 'is-graph-pointer'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/rdf-string'
import { SharedDimensionsStore } from '../store'
import shapeToQuery from '../shapeToQuery'
import { loadShapes } from './shapes'

export default class implements SharedDimensionsStore {
  private readonly loadShapes: () => Promise<AnyPointer>

  constructor(private client: ParsingClient, public graph: NamedNode) {
    this.loadShapes = onetime(loadShapes)
  }

  exists(id: NamedNode, type?: NamedNode): Promise<boolean> {
    return ASK`
      ${id} ${rdf.type} ${type || $rdf.variable('type')} .
    `.FROM(this.graph).execute(this.client.query)
  }

  async load(term: NamedNode): Promise<GraphPointer<NamedNode>> {
    const shape = await this.getShape(term)

    const { constructQuery } = await shapeToQuery()
    const query = constructQuery(shape, {
      focusNode: term,
    }).FROM(this.graph)

    const quads = await query.execute(this.client.query, {
      operation: 'postDirect',
    })
    return clownface({
      dataset: $rdf.dataset(quads),
      term,
    })
  }

  async save(resource: GraphPointer<NamedNode>): Promise<void> {
    let updateQuery = INSERT.DATA`
      GRAPH ${this.graph} {
        ${resource.dataset}
      }
    `._getTemplateResult()

    if (await this.exists(resource.term)) {
      const shape = await this.getShape(resource.term)
      const deleteQuery = await this.deleteQuery(shape, resource.term)
      updateQuery = sparql`${deleteQuery};\n${updateQuery}`
    }

    await this.client.query.update(updateQuery.toString())
  }

  async delete(id: NamedNode): Promise<void> {
    const shape = await this.getShape(id)
    await (await this.deleteQuery(shape, id)).execute(this.client.query)
  }

  private async deleteQuery(shape: GraphPointer, focusNode: NamedNode) {
    const { deleteQuery } = await shapeToQuery()
    return deleteQuery(shape, { focusNode, graph: this.graph })
  }

  private async getShape(term: NamedNode) {
    const shapes = await this.loadShapes()
    const types = await SELECT`?type`
      .WHERE`${term} a ?type`
      .execute(this.client.query)

    const graph = shapes.has(sh.targetClass, types.map(b => b.type))
    if (!isGraphPointer(graph)) {
      return clownface({ dataset: $rdf.dataset() })
        .blankNode()
        .addOut(sh.property, shp => {
          shp.addOut(sh.path, rdf.type)
        })
    }

    let shape: GraphPointer = graph
    shape = await this.createDynamicProperties(shape, term)

    return shape
  }

  private async createDynamicProperties({ dataset, term }: GraphPointer, sharedTerm: Term) {
    const shape = clownface({
      dataset: $rdf.dataset([...dataset]),
      term,
    })

    const dynamicPropertyPredicates = await SELECT`?predicate`
      .WHERE`
        ${sharedTerm} ${schema.inDefinedTermSet}/${schema.additionalProperty}/${rdf.predicate} ?predicate
      `
      .execute(this.client.query)

    for (const { predicate } of dynamicPropertyPredicates) {
      shape.addOut(sh.property, propShape => {
        propShape.addOut(sh.path, predicate)
      })
    }

    return shape
  }
}
