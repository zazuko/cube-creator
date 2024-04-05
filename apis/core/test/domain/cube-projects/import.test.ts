import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach, afterEach } from 'mocha'
import type { GraphPointer } from 'clownface'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import $rdf from '@cube-creator/env'
import { expect } from 'chai'
import httpError from 'http-errors'
import { dcterms, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { ex } from '@cube-creator/testing/lib/namespace'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { cc, cube } from '@cube-creator/core/namespace'
import { Project } from '@cube-creator/model'
import sinon from 'sinon'
import * as projectQueries from '../../../lib/domain/cube-projects/queries.js'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import { ResourceStore } from '../../../lib/ResourceStore.js'
import { adjustTerms, importProject } from '../../../lib/domain/cube-projects/import.js'
import { DomainError } from '../../../../errors/domain.js'
import '../../../lib/domain/index.js'

const { BadRequest } = httpError

describe('@cube-creator/core-api/lib/domain/cube-projects/import', () => {
  describe('importProject', () => {
    let projectsCollection: GraphPointer<NamedNode, DatasetExt>
    let resource: GraphPointer
    let store: ResourceStore
    let projectExists: sinon.SinonStub

    beforeEach(() => {
      projectExists = sinon.stub(projectQueries, 'exists').resolves(false)
      projectsCollection = namedNode('projects')
      resource = blankNode()
        .addOut(rdfs.label, 'UBD Imported')
        .addOut(schema.maintainer, ex.Bafu)
      const organization = namedNode(ex.Bafu)
        .addOut(rdf.type, schema.Organization)
        .addOut(cc.namespace, $rdf.namedNode('https://test.ld.admin.ch/org/'))
      store = new TestResourceStore([
        projectsCollection,
        organization,
      ])
    })

    afterEach(() => {
      projectExists.restore()
    })

    function testImportProject({ files }: Pick<Parameters<typeof importProject>[0], 'files'>) {
      return importProject({
        projectsCollection,
        resource,
        user: $rdf.namedNode('john-doe'),
        store,
        files,
      })
    }

    it('throws when exported data does not have an identifier', async () => {
      // given
      resource.addOut(cc.export, 'ubd.trig')

      // when
      const promise = testImportProject({
        files: {
          'ubd.trig': () => $rdf.dataset().toStream(),
        },
      })

      // then
      await expect(promise).eventually.rejectedWith(BadRequest, /^Missing cube identifier/)
    })

    it('throws when identifier is already used', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')

        return dataset.toStream()
      }
      resource.addOut(cc.export, 'ubd.trig')
      projectExists.withArgs('UBD', ex.Bafu).resolves(true)

      // when
      const promise = testImportProject({
        files: {
          'ubd.trig': exported,
        },
      })

      // then
      await expect(promise).eventually.rejectedWith(DomainError, /already using/)
    })

    it('throws when exported file is missing', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')

        return dataset.toStream()
      }
      resource.addOut(cc.export, 'ubd.trig')

      // when
      const promise = testImportProject({
        files: {
          'ubd_1.trig': exported,
        },
      })

      // then
      await expect(promise).eventually.rejectedWith(BadRequest, /^Missing file/)
    })

    it('throws when project does not have a label', async () => {
      // given
      const exported = () => $rdf.dataset().toStream()
      resource.deleteOut(rdfs.label)

      // when
      const promise = testImportProject({
        files: {
          'ubd_1.trig': exported,
        },
      })

      // then
      await expect(promise).eventually.rejectedWith(BadRequest, /^Missing project name/)
    })

    it('throws when project does not have an organization', async () => {
      // given
      const exported = () => $rdf.dataset().toStream()
      resource.deleteOut(schema.maintainer)

      // when
      const promise = testImportProject({
        files: {
          'ubd_1.trig': exported,
        },
      })

      // then
      await expect(promise).eventually.rejectedWith(BadRequest, /^Missing organization/)
    })

    ;[
      ['blank node', $rdf.blankNode()],
      ['missing', undefined],
      ['unexpected URI', ex.somethingElse],
    ].forEach(([what, term]) => {
      it('it throws when exported project source kind is ' + what, async () => {
      // given
        const exported = (project: string) => {
          const dataset = $rdf.dataset()

          const ptr = $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
            .namedNode(project)
            .addOut(dcterms.identifier, 'UBD')
          if (term) {
            ptr.addOut(cc.projectSourceKind, term)
          }

          return dataset.toStream()
        }
        resource.addOut(cc.export, 'ubd.trig')

        // when
        const promise = testImportProject({
          files: {
            'ubd.trig': exported,
          },
        })

        // then
        await expect(promise).eventually.rejectedWith(BadRequest, /^Missing or invalid cc:projectSourceKind/)
      })
    })

    it('it returns created project when successful', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        $rdf.clownface({ dataset, graph: $rdf.namedNode(`${project}dataset`) })
          .namedNode(`${project}dataset`)
          .addOut(rdf.type, schema.Dataset)
          .addOut(schema.hasPart, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28'))

        return dataset.toStream()
      }
      resource.addOut(cc.export, 'ubd.trig')

      // when
      const { project } = await testImportProject({
        files: {
          'ubd.trig': exported,
        },
      })

      // then
      expect(project.pointer).to.matchShape({
        property: [{
          path: rdfs.label,
          hasValue: 'UBD Imported',
          minCount: 1,
          maxCount: 1,
        }, {
          path: schema.maintainer,
          hasValue: ex.Bafu,
          minCount: 1,
          maxCount: 1,
        }, {
          path: dcterms.creator,
          minCount: 1,
          maxCount: 1,
        }, {
          path: cc.projectSourceKind,
          hasValue: cc['projectSourceKind/CSV'],
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('adjusts all cube-derived URIs to match organization and cube identifier', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
          .addOut(cc.csvMapping, $rdf.namedNode(`${project}mapping`))
        $rdf.clownface({ dataset, graph: $rdf.namedNode(`${project}dataset`) })
          .namedNode(`${project}dataset`)
          .addOut(rdf.type, schema.Dataset)
          .addOut(schema.hasPart, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28'))
          .namedNode('https://environment.ld.admin.ch/foen/ubd/28')
          .addOut(rdf.type, cube.Cube)
        $rdf.clownface({ dataset, graph: $rdf.namedNode(`${project}dimensions-metadata`) })
          .namedNode(`${project}dimensions-metadata/dimension-year`)
          .addOut(schema.about, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/year'))

        return dataset.toStream()
      }
      resource
        .addOut(cc.export, 'ubd.trig')
        .addOut(dcterms.identifier, 'cube/id')

      // when
      const { project, importedDataset } = await testImportProject({
        files: {
          'ubd.trig': exported,
        },
      })

      // then
      const ns = $rdf.namespace(project.id.value)
      const data = $rdf.clownface({ dataset: importedDataset })
      expect(
        data.namedNode(ns('/dimensions-metadata/dimension-year')).out(schema.about).term,
      ).to.deep.equal($rdf.namedNode('https://test.ld.admin.ch/org/cube/id/dimension/year'))
      expect(
        data.namedNode(ns('/dataset')).out(schema.hasPart).term,
      ).to.deep.equal($rdf.namedNode('https://test.ld.admin.ch/org/cube/id'))
      expect(
        data.namedNode('https://test.ld.admin.ch/org/cube/id').out(rdf.type).term,
      ).to.deep.equal(cube.Cube)
      expect(data.node(project.id)).to.matchShape({
        property: {
          path: dcterms.identifier,
          hasValue: 'cube/id',
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('removes properties which are created as part of project', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(dcterms.creator, $rdf.namedNode('previous creator'))
          .addOut(cc.latestPublishedRevision, 10)
          .addOut(schema.maintainer, ex.Bar)
          .addOut(rdfs.label, 'UBD29')
          .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        $rdf.clownface({ dataset, graph: $rdf.namedNode(`${project}dataset`) })
          .namedNode(`${project}dataset`)
          .addOut(rdf.type, schema.Dataset)
          .addOut(schema.hasPart, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28'))

        return dataset.toStream()
      }
      resource.addOut(cc.export, 'ubd.trig')

      // when
      const { project, importedDataset } = await testImportProject({
        files: {
          'ubd.trig': exported,
        },
      })

      // then
      const importedProject = $rdf.clownface({ dataset: importedDataset, graph: project.id, term: project.id })
      expect(importedProject.out([
        dcterms.creator,
        schema.maintainer,
        cc.latestPublishedRevision,
        rdfs.label,
      ]).terms).to.be.empty
    })

    it('sets error message to CSV source', async () => {
      // given
      const exported = (project: string) => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset, graph: $rdf.namedNode(project) })
          .namedNode(project)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(dcterms.creator, $rdf.namedNode('previous creator'))
          .addOut(cc.latestPublishedRevision, 10)
          .addOut(schema.maintainer, ex.Bar)
          .addOut(rdfs.label, 'UBD29')
          .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

        const csvSource = $rdf.namedNode(`${project}source`)
        $rdf.clownface({ dataset, graph: csvSource })
          .namedNode(csvSource)
          .addOut(rdf.type, cc.CSVSource)
        $rdf.clownface({ dataset, graph: $rdf.namedNode(`${project}dataset`) })
          .namedNode(`${project}dataset`)
          .addOut(rdf.type, schema.Dataset)
          .addOut(schema.hasPart, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28'))

        return dataset.toStream()
      }
      resource.addOut(cc.export, 'ubd.trig')

      // when
      const { project, importedDataset } = await testImportProject({
        files: {
          'ubd.trig': exported,
        },
      })

      // then
      const importedCsvSource = $rdf.clownface({
        dataset: importedDataset,
        graph: $rdf.namedNode(`${project.id.value}/source`),
        term: $rdf.namedNode(`${project.id.value}/source`),
      })
      expect(importedCsvSource.out(schema.error).terms).to.be.not.empty
    })
  })

  describe('adjustTerms', () => {
    it('rewrites project URI at all quad terms', async () => {
      // given
      const ns = $rdf.namespace('https://example.com/project/')
      const project = $rdf.rdfine.cc.Project(namedNode(ns.ubd)) as unknown as Project
      const dataset = $rdf.dataset([
        $rdf.quad(ns('ubd/'), rdf.type, cc.CubeProject, ns('ubd/')),
        $rdf.quad(ns('ubd/'), cc.dataset, ns('ubd/data'), ns('ubd/')),
        $rdf.quad(ns('ubd/data'), cc.project, ns('ubd/'), ns('ubd/data')),
      ])

      // when
      const result = await $rdf.dataset().import(dataset.toStream().pipe(adjustTerms(project)))

      // then
      const expected = $rdf.dataset([
        $rdf.quad(ns('ubd'), rdf.type, cc.CubeProject, ns('ubd')),
        $rdf.quad(ns('ubd'), cc.dataset, ns('ubd/data'), ns('ubd')),
        $rdf.quad(ns('ubd/data'), cc.project, ns('ubd'), ns('ubd/data')),
      ])
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })
  })
})
