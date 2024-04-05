import { describe, it } from 'mocha'
import $rdf from '@zazuko/env'
import { Parser, ConstructQuery, GroupPattern } from 'sparqljs'
import { expect } from 'chai'
import { SELECT } from '@tpluscode/sparql-builder'
import sinon from 'sinon'
import { schema } from '@tpluscode/rdf-ns-builders'
import { getProjectDetails, ProjectDetailPart } from '../../../lib/domain/cube-projects/details.js'

describe('@cube-creator/core-api/lib/domain/cube-projects/details', () => {
  const project = $rdf.namedNode('project')
  const resource = $rdf.namedNode('project/details')
  const parser = new Parser({
    baseIRI: 'http://example.com/',
  })

  it('combines all part in CONSTRUCT subqueries', () => {
    // given
    const parts: ProjectDetailPart[] = [
      () => [SELECT`?foo`.WHERE`?s ?p ?o`, $rdf.literal('foo part')],
      () => [SELECT`?bar`.WHERE`?s ?p ?o`, $rdf.literal('bar part')],
    ]

    // when
    const queryStr = getProjectDetails({
      project,
      resource,
      parts,
    }).build()
    const construct: ConstructQuery = parser.parse(queryStr) as any

    // then
    const subselects = construct.where
      ?.filter((pattern): pattern is GroupPattern => pattern.type === 'optional')
      .flatMap(group => group.patterns.filter(pattern => pattern.type === 'query'))
    expect(subselects).to.have.length(2)
  })

  it('calls parts with sequence of variables', () => {
    // given
    const fooPart = sinon.stub().returns([SELECT`?foo`.WHERE`?s ?p ?o`, $rdf.literal('foo part')])
    const barPart = sinon.stub().returns([SELECT`?bar`.WHERE`?s ?p ?o`, $rdf.literal('foo part')])

    // when
    getProjectDetails({
      project,
      resource,
      parts: [
        fooPart,
        barPart,
      ],
    })

    // then
    expect(fooPart).to.have.been.calledWithMatch(project, $rdf.variable('part1'))
    expect(barPart).to.have.been.calledWithMatch(project, $rdf.variable('part2'))
  })

  it('constructs schema:hasPart for every part', () => {
    // given
    const parts: ProjectDetailPart[] = [
      () => [SELECT`?foo`.WHERE`?s ?p ?o`, $rdf.literal('foo part')],
      () => [SELECT`?bar`.WHERE`?s ?p ?o`, $rdf.literal('bar part')],
    ]

    // when
    const queryStr = getProjectDetails({
      project,
      resource,
      parts,
    }).build()
    const construct: ConstructQuery = parser.parse(queryStr) as any

    // then
    const constructedParts = construct.template
      ?.filter(({ predicate }) => 'termType' in predicate && predicate.equals(schema.hasPart))
    expect(constructedParts).to.have.length(2)
  })
})
