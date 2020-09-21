import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { rdfs, rdf, hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../indentifiers'

interface CreateProjectCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function createProject({ resource, store }: CreateProjectCommand): Promise<GraphPointer> {
  const label = resource.out(rdfs.label).term!

  const project = clownface({ dataset: $rdf.dataset() })
    .namedNode(id.cubeProject(label.value))
    .addOut(rdfs.label, label)
    .addOut(rdf.type, [cc.CubeProject, hydra.Resource])

  if (resource.out(cc.projectSourceKind).value === 'CSV') {
    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode(id.csvMapping(project))
      .addOut(rdf.type, [cc.CsvMapping, hydra.Resource])

    project.addOut(cc.csvMapping, csvMapping)

    await store.put(csvMapping)
  }

  await store.put(project)
  return project
}
