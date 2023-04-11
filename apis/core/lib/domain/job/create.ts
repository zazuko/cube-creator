import { NamedNode, Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import * as Job from '@cube-creator/model/Job'
import * as ImportJob from '@cube-creator/model/ImportJob'
import { CsvMapping, Project, Dataset, ImportProject, CsvProject } from '@cube-creator/model'
import { DomainError } from '@cube-creator/api-errors'
import env from '@cube-creator/core/env'
import { schema } from '@tpluscode/rdf-ns-builders'
import { isCsvProject } from '@cube-creator/model/Project'
import * as id from '../identifiers'
import { ResourceStore } from '../../ResourceStore'
import * as TableQueries from '../queries/table'

interface StartTransformationCommand {
  resource: NamedNode
  store: ResourceStore
}

interface StartPublicationCommand {
  resource: NamedNode
  store: ResourceStore
  queries?: Pick<typeof TableQueries, 'getCubeTable'>
}

interface StartImportCommand {
  resource: Term
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
  queries: { getCubeTable } = TableQueries,
}: StartPublicationCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = (await store.get(resource))!
  const projectPointer = jobCollection.out(cc.project).term

  if (!projectPointer || projectPointer.termType !== 'NamedNode') {
    throw new Error('Project not found from jobs collection')
  }

  const project = await store.getResource<CsvProject | ImportProject>(projectPointer)
  const organization = await store.getResource(project.maintainer)

  if (!organization.publishGraph) {
    throw new DomainError('Cannot publish cube. Project does not have publish graph')
  }

  const table = await getCubeTable(project.csvMapping!)
  if (!table) {
    throw new DomainError('Cannot publish cube. It must have exactly one cube table')
  }

  const metadata = await store.getResource(project.dataset)

  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))
  const job = Job.createPublish(jobPointer, {
    project: projectPointer,
    name: 'Publish job',
    revision: project.nextRevision,
    publishGraph: organization.publishGraph,
    status: metadata?.pointer.out(schema.creativeWorkStatus).term,
    publishedTo: metadata?.pointer.out(schema.workExample).term,
  })

  const cubeId = isCsvProject(project)
    ? organization.createIdentifier({
      cubeIdentifier: project.cubeIdentifier,
    })
    : project.sourceCube

  const dataset = await store.getResource<Dataset>(project.dataset.id)
  const workExamples = prepareWorkExamples(cubeId, job, dataset)
  workExamples.forEach(workExample => job.addWorkExample(workExample))

  return jobPointer
}

export async function createUnlistJob({
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
    throw new DomainError('Cannot unlist cube. Project does not have publish graph')
  }

  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))
  Job.createUnlist(jobPointer, {
    project: projectPointer,
    name: 'Unlist job',
    publishGraph: organization.publishGraph,
  })

  return jobPointer
}

export function prepareWorkExamples(cubeId: NamedNode, job: Job.PublishJob, dataset: Dataset): Job.WorkExampleInput[] {
  const workExamples = []

  if (env.has('TRIFID_UI')) {
    workExamples.push({
      url: $rdf.namedNode(lindasWebQueryLink(cubeId, job.revision, job.publishGraph)),
      encodingFormat: $rdf.literal('application/sparql-query'),
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
    workExamples.push({
      url: $rdf.namedNode(visualizeLink(cubeId)),
      encodingFormat: $rdf.literal('text/html'),
      name: [
        $rdf.literal('visualize.admin.ch'),
      ],
    })
  }

  return workExamples
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
  const visualizeLink = new URL(env.VISUALIZE_UI)
  visualizeLink.searchParams.set('dataset', cube.value)
  return visualizeLink.toString()
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
    dataset: project.dataset.id as any,
  })

  return jobPointer
}
