import { GraphPointer } from 'clownface'
import { rdfs, rdf, hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { cubeProject, csvMapping, csvSourceCollection } from '../identifiers'

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
      .create(csvSourceCollection(mapping))
      .addOut(rdf.type, [cc.CSVSourceCollection, hydra.Collection])
      .addOut(hydra.title, 'CSV-Sources')
      .addOut(cc.csvMapping, mapping)
      .addOut(hydra.manages, manages => {
        // ?member rdf:type cc:CSVSource
        manages.addOut([hydra.property], [rdf.type])
        manages.addOut([hydra.object], [cc.CSVSource])
      })
      .addOut(hydra.manages, manages => {
        // ?member cc:csvMapping <mapping>
        manages.addOut([hydra.object], mapping)
        manages.addOut([hydra.property], [cc.csvMapping])
      })
  }

  await store.save()
  return project
}
