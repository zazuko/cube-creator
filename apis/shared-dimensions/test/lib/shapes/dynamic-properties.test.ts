import type { NamedNode, Quad } from '@rdfjs/types'
import { describe, before, beforeEach, it } from 'mocha'
import sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import { namedNode } from '@cube-creator/testing/clownface'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import $rdf from 'rdf-ext'
import { hydra, qb, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { expect } from 'chai'
import { toRdf } from 'rdf-literal'
import { DynamicPropertiesQuery, loadDynamicTermProperties } from '../../../lib/shapes/dynamic-properties'

describe('@cube-creator/shared-dimensions-api/lib/shapes/dynamic-properties @SPARQL', () => {
  let shape: GraphPointer<NamedNode>

  const targetClass = 'https://ld.admin.ch/cube/dimension/technologies'

  before(async () => {
    await insertTestDimensions()
  })

  beforeEach(() => {
    shape = namedNode('')
  })

  it('sets sh:minCount=1 when dynamic property is required', async () => {
    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([
        ...await loadDynamicTermProperties(targetClass, shape),
      ]),
    })

    // then
    const colorProp = dynamicProperties.has(sh.path, schema.color)
    expect(colorProp.out(sh.minCount).term).to.deep.eq(toRdf(1))
  })

  it('sets sh:minCount=0 when dynamic property is not required', async () => {
    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([
        ...await loadDynamicTermProperties(targetClass, shape),
      ]),
    })

    // then
    const orderProp = dynamicProperties.has(sh.path, qb.order)
    expect(orderProp.out(sh.minCount).term).to.deep.eq(toRdf(0))
  })

  it('transforms dynamic literal property into SHACL Property', async () => {
    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([
        ...await loadDynamicTermProperties(targetClass, shape),
      ]),
    })

    // then
    const orderProp = dynamicProperties.has(sh.path, qb.order)
    expect(orderProp).to.matchShape({
      property: [{
        path: sh.name,
        hasValue: 'Order',
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.path,
        hasValue: qb.order,
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.datatype,
        hasValue: xsd.integer,
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.minCount,
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.maxCount,
        hasValue: 1,
        minCount: 1,
        maxCount: 1,
      }],
    })
  })

  it('transforms dynamic dimension property into SHACL Property', async () => {
    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([
        ...await loadDynamicTermProperties(targetClass, shape),
      ]),
    })

    // then
    const colorProp = dynamicProperties.has(sh.path, schema.color)
    expect(colorProp).to.matchShape({
      property: [{
        path: sh.name,
        hasValue: 'Color',
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.path,
        hasValue: schema.color,
        minCount: 1,
        maxCount: 1,
      }, {
        path: hydra.search,
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.minCount,
        minCount: 1,
        maxCount: 1,
      }, {
        path: sh.maxCount,
        maxCount: 0,
      }],
    })
  })

  it('populates sh:languageIn as list from queried values', async () => {
    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([
        ...await loadDynamicTermProperties(targetClass, shape),
      ]),
    })

    // then
    const colorProp = dynamicProperties.has(sh.path, rdfs.comment).out(sh.languageIn).list()!
    expect([...colorProp].map(p => p.value)).to.contain.all.members(['fr', 'de', 'en'])
  })
})

describe('@cube-creator/shared-dimensions-api/lib/shapes/dynamic-properties', () => {
  let shape: GraphPointer<NamedNode>
  let dynamicPropertiesQuery: sinon.SinonStub<Parameters<DynamicPropertiesQuery>, Promise<Quad[]>>

  beforeEach(() => {
    dynamicPropertiesQuery = sinon.stub()
    dynamicPropertiesQuery.resolves([])
    shape = namedNode('')
  })

  it('adds dynamic properties ordered by label', async () => {
    // given
    const dataset = $rdf.dataset()
    clownface({ dataset })
      .blankNode()
      .addOut(sh.path, hydra.last)
      .addOut(rdfs.label, 'Last property')
      .blankNode()
      .addOut(sh.path, rdfs.label)
      .addOut(rdfs.label, 'Middle property')
      .blankNode()
      .addOut(sh.path, hydra.first)
      .addOut(rdfs.label, 'First property')
    dynamicPropertiesQuery.resolves(dataset.toArray())

    // when
    const dynamicProperties = clownface({
      dataset: $rdf.dataset([...await loadDynamicTermProperties('http://target.node', shape, dynamicPropertiesQuery)]),
    })

    // then
    expect(dynamicProperties.has(sh.path, hydra.first).out(sh.order).value).to.eq('100')
    expect(dynamicProperties.has(sh.path, hydra.last).out(sh.order).value).to.eq('101')
    expect(dynamicProperties.has(sh.path, rdfs.label).out(sh.order).value).to.eq('102')
  })

  it('calls query for correct target class when Prefer header is given', async () => {
    // given
    const prefer = 'https://cube-creator.lndo.site/target-class'

    // when
    await loadDynamicTermProperties(prefer, shape, dynamicPropertiesQuery)

    // then
    expect(dynamicPropertiesQuery).to.have.been.calledWithMatch($rdf.namedNode('https://ld.admin.ch/cube/target-class'))
  })
})
