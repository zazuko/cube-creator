import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { rdfs, rdf, dcterms } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { cubeProject, csvMapping } from '../identifiers'

interface CreateProjectCommand {
  projectsCollection: NamedNode
  resource: GraphPointer
  store: ResourceStore
  user: NamedNode
}

export async function createProject({ projectsCollection, resource, store, user }: CreateProjectCommand): Promise<GraphPointer> {
  const label = resource.out(rdfs.label).term!

  const project = await store.createMember(projectsCollection, cubeProject(label.value))

  project.addOut(rdfs.label, label)
    .addOut(dcterms.creator, user)

  if (resource.out(cc.projectSourceKind).value === 'CSV') {
    const mapping = store.create(csvMapping(project))
      .addOut(rdf.type, cc.CsvMapping)

    project.addOut(cc.csvMapping, mapping)
  }

  await store.save()
  return project
}
