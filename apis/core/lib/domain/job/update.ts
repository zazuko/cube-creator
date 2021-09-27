import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { Job, JobMixin, ImportProject, Dataset, CsvProject } from '@cube-creator/model'
import { isPublishJob } from '@cube-creator/model/Job'
import RdfResource from '@tpluscode/rdfine'
import env from '@cube-creator/core/env'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import type { Organization } from '@rdfine/schema'
import { ResourceStore } from '../../ResourceStore'
import { schema } from '@tpluscode/rdf-ns-builders'
import { isCsvProject } from '@cube-creator/model/Project'

interface JobUpdateParams {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
}

function lindasWebQueryLink(cube: NamedNode, version: number, cubeGraph: NamedNode) {
  const describe = DESCRIBE`?cube`
    .FROM(cubeGraph)
    .WHERE`
      ${cube} ${schema.hasPart} ?cube .
      ?cube ${schema.version} ${version} .
    `.build()

  const queryLink = new URL(env.TRIFID_UI)
  queryLink.hash = new URLSearchParams([
    ['query', describe],
    ['endpoint', env.PUBLIC_QUERY_ENDPOINT],
  ]).toString()

  return queryLink.toString()
}

function visualizeLink(cube: NamedNode) {
  const language = 'en'
  const visualizeLink = new URL(`/${language}/create/new`, env.VISUALIZE_UI)

  visualizeLink.searchParams.set('cube', cube.value)

  return visualizeLink.toString()
}

export async function update({ resource, store }: JobUpdateParams): Promise<GraphPointer> {
  const changes = RdfResource.factory.createEntity<Job>(resource, [JobMixin])
  const job = await store.getResource<Job>(resource.term)

  job.modified = changes.modified

  if (changes.actionStatus) {
    job.actionStatus = changes.actionStatus

    if (changes.actionStatus.equals(schema.CompletedActionStatus) && isPublishJob(job)) {
      const project = await store.getResource<CsvProject | ImportProject>(job.project)
      project.incrementPublishedRevision()

      const dataset = await store.getResource<Dataset>(project.dataset.id)
      if (job.revision === 1) {
        dataset.setPublishedDate(job.modified)
      }

      const organization = await store.getResource<Organization>(project.maintainer)
      const cubeId = isCsvProject(project)
        ? organization.createIdentifier({
          cubeIdentifier: project.cubeIdentifier,
        })
        : project.sourceCube

      if (env.has('TRIFID_UI')) {
        job.addWorkExample({
          url: $rdf.namedNode(lindasWebQueryLink(cubeId, job.revision, job.publishGraph)),
          encodingFormat: 'Application/Sparql-query',
          name: [
            $rdf.literal('SPARQL Endpoint mit Vorauswahl des Graph', 'de'),
            $rdf.literal('SPARQL Endpoint with graph preselection', 'en'),
            $rdf.literal('SPARQL Endpoint avec présélection du graphe', 'fr'),
          ],
        })
      }

      const visualize = $rdf.namedNode('https://ld.admin.ch/application/visualize')
      const isPublishedToVisualize = dataset.pointer.has(schema.workExample, visualize).terms.length > 0
      if (env.has('VISUALIZE_UI') && isPublishedToVisualize) {
        job.addWorkExample({
          url: $rdf.namedNode(visualizeLink(cubeId)),
          encodingFormat: 'text/html',
          name: [
            $rdf.literal('visualize.admin.ch'),
          ],
        })
      }
    }
  }

  if (changes.seeAlso.length) {
    job.seeAlso = changes.seeAlso
  }

  if (changes.error) {
    job.error = {
      ...changes.error.toJSON(),
      types: [schema.Thing],
    } as any
  } else {
    job.error?.pointer.deleteOut()
    job.error = undefined
  }

  return job.pointer
}
