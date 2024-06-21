import type { Quad, Term } from '@rdfjs/types'
import { describe, it, beforeEach, before } from 'mocha'
import { expect } from 'chai'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { IriTemplate } from '@rdfine/hydra'
import sinon from 'sinon'
import Cube from 'rdf-cube-view-query/lib/Cube.js'
import Source from 'rdf-cube-view-query/lib/Source.js'
import esmock from 'esmock'
// import { getObservations } from '../../../lib/domain/observations/index.js'
// import * as lib from '../../../lib/domain/observations/lib/index.js'

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

  let createView: sinon.SinonStub
  let getObservations: typeof import('../../../lib/domain/observations/index.js').getObservations

  before(async () => {
    createView = sinon.stub().returns({
      async observations() {
        return observations
      },
      async observationCount() {
        return observations.length
      },
    })

    ;({ getObservations } = (await esmock('../../../lib/domain/observations/index.js', {
      '../../../lib/domain/observations/lib/index.js': {
        createSource: sinon.stub().returns(sinon.createStubInstance(Source, {
          cubes: sinon.stub().callsFake(async () => cubes) as any,
        })),
        createHydraCollection: sinon.stub(),
        createView,
      },
    })))
  })

  beforeEach(() => {
    observations = []
    templateParams = $rdf.clownface().blankNode()

    cubes = [
      new Cube({
        term: $rdf.namedNode('cube'),
        source,
      }),
    ]
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
    expect(createView).to.have.been.calledWith(sinon.match.any, 20, sinon.match.any)
  })

  it('passes offset 0 if pageIndex is not provided', async () => {
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
    expect(createView).to.have.been.calledWith(sinon.match.any, sinon.match.any, 0)
  })

  it('computes offset from pageSize and pageIndex', async () => {
    // given
    for (let i = 0; i < 100; i++) {
      observations.push({})
    }
    const pageSize = 10
    const pageIndex = 5

    // when
    await getObservations({
      cubeId: 'cube',
      sourceGraph: 'cube-data',
      templateParams,
      template,
      pageSize,
      pageIndex,
      loadResourceLabels,
    })

    // then
    expect(createView).to.have.been.calledWith(sinon.match.any, 10, 40)
  })
})
