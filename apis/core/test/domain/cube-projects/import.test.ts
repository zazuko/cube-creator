import { describe, it, beforeEach, afterEach } from 'mocha'
import clownface, { GraphPointer } from 'clownface'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { BadRequest } from 'http-errors'
import { dcterms, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders/strict'
import { ex } from '@cube-creator/testing/lib/namespace'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { fromPointer, Project } from '@cube-creator/model/Project'
import { cc, shape } from '@cube-creator/core/namespace'
import namespace from '@rdfjs/namespace'
import * as sinon from 'sinon'
import * as projectQueries from '../../../lib/domain/cube-projects/queries'
import { TestResourceStore } from '../../support/TestResourceStore'
import { ResourceStore } from '../../../lib/ResourceStore'
import { adjustTerms, importProject } from '../../../lib/domain/cube-projects/import'
import { DomainError } from '../../../../errors/domain'
import '../../../lib/domain'

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
      store = new TestResourceStore([
        projectsCollection,
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
        userName: 'John Doe',
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

    it('throws identifier is already used', async () => {
      // given
      const exported = (project: Project) => {
        const dataset = $rdf.dataset()

        clownface({ dataset, graph: project.id })
          .node(project.id)
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
      const exported = (project: Project) => {
        const dataset = $rdf.dataset()

        clownface({ dataset, graph: project.id })
          .node(project.id)
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
        const exported = (project: Project) => {
          const dataset = $rdf.dataset()

          const ptr = clownface({ dataset, graph: project.id })
            .node(project.id)
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
      const exported = (project: Project) => {
        const dataset = $rdf.dataset()

        clownface({ dataset, graph: project.id })
          .node(project.id)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

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
          hasValue: shape('cube-project/create#CSV'),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('removes properties which are created as part of project', async () => {
      // given
      const exported = (project: Project) => {
        const dataset = $rdf.dataset()

        clownface({ dataset, graph: project.id })
          .node(project.id)
          .addOut(dcterms.identifier, 'UBD')
          .addOut(dcterms.creator, $rdf.namedNode('previous creator'))
          .addOut(cc.latestPublishedRevision, 10)
          .addOut(schema.maintainer, ex.Bar)
          .addOut(rdfs.label, 'UBD29')
          .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

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
      const importedProject = clownface({ dataset: importedDataset, graph: project.id, term: project.id })
      expect(importedProject.out([
        dcterms.creator,
        schema.maintainer,
        cc.latestPublishedRevision,
        rdfs.label,
      ]).terms).to.be.empty
    })
  })

  describe('adjustTerms', () => {
    it('rewrites project URI at all quad terms', async () => {
      // given
      const ns = namespace('https://example.com/project/')
      const project = fromPointer(namedNode(ns.ubd))
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
