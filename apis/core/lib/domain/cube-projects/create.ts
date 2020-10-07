import { GraphPointer } from 'clownface'
import { rdfs, rdf, hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { cubeProject, csvMapping } from '../identifiers'
import $rdf from 'rdf-ext'

interface CreateProjectCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function createProject({
  resource,
  store,
}: CreateProjectCommand): Promise<GraphPointer> {
  const label = resource.out(rdfs.label).term!

  const project = store
    .create(cubeProject(label.value))
    .addOut(rdfs.label, label)
    .addOut(rdf.type, [cc.CubeProject, hydra.Resource])

  if (resource.out(cc.projectSourceKind).value === 'CSV') {
    const mapping = store
      .create(csvMapping(project))
      .addOut(rdf.type, [cc.CsvMapping, hydra.Resource])

    project.addOut(cc.csvMapping, mapping)

    store
      .create($rdf.namedNode(mapping.value + '/source'))
      .addOut(rdf.type, [cc.CSVSourceCollection, hydra.Collection])
      .addOut(hydra.title, 'CSV-Sources')
      .addOut(hydra.manages, manages => {
        manages.addOut([hydra.property, rdf.type], [rdf.type, cc.CSVSource])
      })
  }

  await store.save()
  return project
}
