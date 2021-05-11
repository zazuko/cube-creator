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

      if (env.has('TRIFID_UI')) {
        const cubeId = isCsvProject(project)
          ? organization.createIdentifier({
            cubeIdentifier: project.cubeIdentifier,
          })
          : project.sourceCube

        job.query = lindasWebQueryLink(cubeId, job.revision, job.publishGraph)
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
