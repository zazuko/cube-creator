import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import { cc } from '@cube-creator/core/namespace'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { ccClients } from '@cube-creator/testing/lib'
import clownface from 'clownface'
import { DatasetCore } from 'rdf-js'
import $rdf from 'rdf-ext'
import { dcterms, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders/strict'
import { getExportedProject } from '../../../lib/domain/cube-projects/export'
import ResourceStore from '../../../lib/ResourceStore'

describe('@cube-creator/core-api/lib/domain/cube-projects/export @SPARQL', () => {
  let dataset: DatasetCore
  const projectId = $rdf.namedNode('')

  before(async function () {
    this.timeout(20000)
    await insertTestProject()

    const { data } = await getExportedProject({
      resource: $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd'),
      store: new ResourceStore(ccClients.streamClient),
    })
    dataset = await $rdf.dataset().import(data)
  })

  describe('cc:CubeProject', () => {
    it('exports data', () => {
      // given
      const projectId = $rdf.namedNode('')
      const project = dataset.match(null, null, null, projectId)

      // then
      expect(project).to.matchShape({
        targetNode: [projectId],
        property: [{
          path: cc.projectSourceKind,
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    describe('cc:dataset', () => {
      it('exports properties', () => {
        // given
        const project = clownface({ dataset, term: projectId })

        // when
        const cubeDataset = project.out(cc.dataset)

        // then
        expect(cubeDataset).to.matchShape({
          property: [{
            path: dcterms.title,
            minCount: 1,
            maxCount: 1,
          }],
        })
      })

      describe('cc:dimensionMetadata', () => {
        it('exports all metadata', () => {
          // given
          const project = clownface({ dataset, term: projectId })

          // when
          const dimensionMetadata = project.out(cc.dataset).out(cc.dimensionMetadata)

          // then
          expect(dimensionMetadata).to.matchShape({
            property: [{
              path: schema.hasPart,
              minCount: 5,
              maxCount: 5,
              node: {
                property: [{
                  path: schema.about,
                  minCount: 1,
                  maxCount: 1,
                }],
              },
            }],
          })
        })
      })
    })

    it('does not export published version', () => {
      // given
      const project = clownface({ dataset, graph: projectId, term: projectId })

      // then
      expect(project.out(cc.latestPublishedRevision).terms).to.have.length(0)
    })

    it('does not export creator', () => {
      // given
      const creator = clownface({ dataset, graph: projectId })
        .namedNode('https://cube-creator.lndo.site/user')

      // then
      expect(creator.in().values).to.be.empty
      expect(creator.out().values).to.be.empty
    })

    it('does not export maintainer (organization)', () => {
      // given
      const project = clownface({ dataset, graph: projectId, term: projectId })

      // then
      expect(project.out(schema.maintainer).terms).to.have.length(0)
    })
  })

  describe('cc:Job', () => {
    it('are not exported', () => {
      // given
      const jobs = dataset.match(null, rdf.type, cc.Job)

      // then
      expect(jobs.size).to.eq(0)
    })
  })
})
