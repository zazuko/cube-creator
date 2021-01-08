import { describe, it, beforeEach, before, after } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import { Quad, Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import { IriTemplate } from '@rdfine/hydra'
import * as sinon from 'sinon'
import Cube from 'rdf-cube-view-query/lib/Cube'
import Source from 'rdf-cube-view-query/lib/Source'
import { DomainError } from '../../../lib/errors'
import { getObservations } from '../../../lib/domain/observations'
import * as lib from '../../../lib/domain/observations/lib'

describe('lib/domain/observations', () => {
  let templateParams: GraphPointer
  const template: IriTemplate = {} as any
  let cubes: Cube[]
  let observations: Record<string, Term>[]
  const source: Source.Source = {
    children: new Set(),
    endpoint: $rdf.namedNode('endpoint'),
    client: {
      query: {
        select: () => [],
      },
    },
  } as any
  const loadResourceLabels = () => new Promise<Quad[]>((resolve) => resolve([]))

  before(() => {
    sinon.stub(lib, 'createSource').returns(sinon.createStubInstance(Source, {
      cubes: sinon.stub().callsFake(async () => cubes) as any,
    }))
    sinon.stub(lib, 'createHydraCollection')
    sinon.stub(lib, 'createView').returns({
      async observations() {
        return observations
      },
    } as any)
  })

  after(() => {
    sinon.restore()
  })

  beforeEach(() => {
    observations = []
    templateParams = clownface({ dataset: $rdf.dataset() }).blankNode()

    cubes = [
      new Cube({
        term: $rdf.namedNode('cube'),
        source,
      }),
    ]
  })

  it('throws if cube is not found in source', async () => {
    // when
    const promise = getObservations({
      cubeId: 'no-such-cube',
      sourceGraph: 'cube-data',
      templateParams,
      template,
      loadResourceLabels,
    })

    // then
    await expect(promise).to.be.rejectedWith(DomainError)
  })

  it('passes default page size if missing from params', async () => {
    // given
    for (let i = 0; i < 100; i++) {
      observations.push({})
    }

    // when
    await getObservations({
      cubeId: 'cube',
      sourceGraph: 'cube-data',
      templateParams,
      template,
      loadResourceLabels,
    })

    // then
    expect(lib.createView).to.have.been.calledWith(sinon.match.any, 20)
  })
})
