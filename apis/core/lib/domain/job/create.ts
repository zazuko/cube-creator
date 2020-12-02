import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import * as Job from '@cube-creator/model/Job'
import { CsvMapping, Project } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import * as id from '../identifiers'

interface StartTransformationCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function createTransformJob({
  resource,
  store = resourceStore(),
}: StartTransformationCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = (await store.get(resource))!
  const project = await store.getResource<Project>(jobCollection.out(cc.project).term)
  const csvMapping = await store?.getResource<CsvMapping>(project?.csvMapping?.id)

  if (!project) {
    throw new Error('Project not found from jobs collection')
  }

  if (!csvMapping) {
    throw new Error('CSV Mapping not found from project')
  }

  const jobPointer = await store.createMember(jobCollection.term, id.job(jobCollection))
  Job.createTransform(jobPointer, {
    cubeGraph: project.cubeGraph,
    label: 'Transformation job',
    tableCollection: csvMapping.tableCollection,
  })

  await store.save()

  return jobPointer
}
