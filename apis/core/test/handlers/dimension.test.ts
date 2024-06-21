import type { NamedNode } from '@rdfjs/types'
import { before, beforeEach, describe, it } from 'mocha'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { namedNode } from '@cube-creator/testing/clownface'
import type { GraphPointer } from 'clownface'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { expect } from 'chai'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import { preselectDimensionType } from '../../lib/handlers/dimension.js'
import { TestResourceStore } from '../support/TestResourceStore.js'
import '../../lib/domain/index.js'

const ns = $rdf.namespace('https://cube-creator.lndo.site/cube-project/ubd/')

describe('lib/handlers/dimension @SPARQL', function () {
  this.timeout(20000)
  let organization: GraphPointer<NamedNode, DatasetExt>

  before(() => {
    organization = namedNode('https://cube-creator.lndo.site/organization/bafu')
      .addOut(rdf.type, schema.Organization)
      .addOut(cc.namespace, 'https://environment.ld.admin.ch/foen/')
  })

  beforeEach(async () => {
    await insertTestProject()
  })

  it('sets dimension type for mapping which has it', async () => {
    // given
    const req: any = {
      resourceStore: () => new TestResourceStore([
        organization,
      ]),
    }
    const dimension = ns('dimensions-metadata/unit')
    const pointer = namedNode(ns('dimensions-metadata'))
      .addOut(schema.hasPart, dimension, dimension => {
        dimension.addOut(schema.about, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/unit'))
      })

    // when
    await preselectDimensionType(req, pointer, ccClients.parsingClient)

    // then
    const type = pointer.has(schema.hasPart, dimension)
      .out(schema.hasPart)
      .out(rdf.type).term
    expect(type).to.deep.equal(cube.KeyDimension)
  })

  it('does not set dimension type if it is already set', async () => {
    // given
    const req: any = {
      resourceStore: () => new TestResourceStore([
        organization,
      ]),
    }
    const dimension = ns('dimensions-metadata/unit')
    const pointer = namedNode(ns('dimensions-metadata'))
      .addOut(schema.hasPart, dimension, dimension => {
        dimension.addOut(rdf.type, cube.MeasureDimension)
        dimension.addOut(schema.about, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/unit'))
      })

    // when
    await preselectDimensionType(req, pointer, ccClients.parsingClient)

    // then
    const type = pointer.has(schema.hasPart, dimension)
      .out(schema.hasPart)
      .out(rdf.type).term
    expect(type).to.deep.equal(cube.MeasureDimension)
  })
})
