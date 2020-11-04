import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import * as id from '../identifiers'
import { rdfs } from '@tpluscode/rdf-ns-builders'

interface StartTransformationCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function createJob({
  resource,
  store = resourceStore(),
}: StartTransformationCommand): Promise<GraphPointer<NamedNode>> {
  const jobCollection = (await store.get(resource))!
  const csvMapping = jobCollection.out(cc.csvMapping).term

  if (!csvMapping || csvMapping.termType !== 'NamedNode') {
    throw new Error('CSV-Mapping is missing')
  }

  const csvMappingResource = (await store.get(csvMapping))!
  const project = csvMappingResource.out(cc.project).term
  if (project?.termType !== 'NamedNode') {
    throw new Error('Project is missing')
  }

  const projectResource = (await store.get(project))!
  const cubeGraph = projectResource.out(cc.cubeGraph)

  const job = await store.createMember(jobCollection.term, id.job(jobCollection))

  job.addOut(cc.cubeGraph, cubeGraph)
    .addOut(cc.tables, csvMappingResource.out(cc.tables))
    .addOut(rdfs.label, projectResource.out(rdfs.label))

  await store.save()

  return job
}
