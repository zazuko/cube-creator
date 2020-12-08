import { GraphPointer } from 'clownface'
import { Dataset, Literal, NamedNode, Quad } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { CsvMapping, Project } from '@cube-creator/model'
import { NotFoundError } from '../../errors'

interface UpdateProjectCommand {
  resource: GraphPointer
  project: GraphPointer<NamedNode>
  store?: ResourceStore
}

export async function updateProject({
  resource,
  project,
  store = resourceStore(),
}: UpdateProjectCommand): Promise<Project> {
  const storedProject = await store.getResource<Project>(resource.term)

  if (!storedProject) {
    throw new NotFoundError(resource.term)
  }

  const oldLabel = storedProject.pointer.out(rdfs.label).term as Literal

  const newLabel = resource.out(rdfs.label).term
  if (newLabel && oldLabel) {
    const dataset = storedProject.pointer.dataset as Dataset<Quad, Quad>
    dataset.delete($rdf.quad(project.term, rdfs.label, oldLabel))
  }
  if (newLabel) {
    storedProject.pointer.addOut(rdfs.label, newLabel)
  }

  const newNamespace = resource.out(cc.csvMapping).out(cc.namespace).term as NamedNode
  if (newNamespace) {
    const csvMapping = await store.getResource<CsvMapping>(project.out(cc.csvMapping).term)

    if (csvMapping) {
      csvMapping.namespace = newNamespace
    }
  }

  await store.save()

  return storedProject
}
