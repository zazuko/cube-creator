import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import * as Job from '@cube-creator/model/Job'
import * as ImportJob from '@cube-creator/model/ImportJob'
import { CsvMapping, Project, Dataset, ImportProject } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { DomainError } from '@cube-creator/api-errors'
import { schema } from '@tpluscode/rdf-ns-builders'

interface StartTransformationCommand {
  resource: NamedNode
  store: ResourceStore
}

interface StartPublicationCommand {
  resource: NamedNode
  store: ResourceStore
}

interface StartImportCommand {
  resource: NamedNode
  store: ResourceStore
}

export async function createTransformJob({
  resource,
  store,
}: StartTransformationCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = await store.get(resource)
  const project = await store.getResource<Project>(jobCollection.out(cc.project).term)
  const csvMapping = await store.getResource<CsvMapping>(project?.csvMapping?.id)
  const dataset = await store.getResource<Dataset>(project.dataset.id)

  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))
  Job.createTransform(jobPointer, {
    cubeGraph: project.cubeGraph,
    name: 'Transformation job',
    tableCollection: csvMapping.tableCollection,
    dimensionMetadata: dataset.dimensionMetadata,
  })

  return jobPointer
}

export async function createPublishJob({
  resource,
  store,
}: StartPublicationCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = (await store.get(resource))!
  const projectPointer = jobCollection.out(cc.project).term

  if (!projectPointer || projectPointer.termType !== 'NamedNode') {
    throw new Error('Project not found from jobs collection')
  }

  const project = await store.getResource<Project>(projectPointer)
  const organization = await store.getResource(project.maintainer)

  if (!organization.publishGraph) {
    throw new DomainError('Cannot publish cube. Project does not have publish graph')
  }

  const metadata = await store.getResource(project.dataset)

  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))
  Job.createPublish(jobPointer, {
    project: projectPointer,
    name: 'Publish job',
    revision: project.nextRevision,
    publishGraph: organization.publishGraph,
    status: metadata?.pointer.out(schema.creativeWorkStatus).term,
    publishedTo: metadata?.pointer.out(schema.workExample).term,
  })

  return jobPointer
}

export async function createImportJob({ store, resource }: StartImportCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = await store.get(resource)
  const project = await store.getResource<ImportProject>(jobCollection.out(cc.project).term)
  const dataset = await store.getResource<Dataset>(project.dataset)
  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))

  ImportJob.create(jobPointer, {
    name: 'Import cube',
    sourceCube: project.sourceCube,
    sourceGraph: project.sourceGraph,
    sourceEndpoint: project.sourceEndpoint,
    cubeGraph: project.cubeGraph,
    dimensionMetadata: dataset.dimensionMetadata.id as any,
  })

  return jobPointer
}
