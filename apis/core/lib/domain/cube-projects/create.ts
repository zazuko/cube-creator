import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { rdfs, rdf, hydra, dcterms } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { cubeProject, csvMapping, csvSourceCollection } from '../identifiers'

interface CreateProjectCommand {
  projectsCollection: NamedNode
  resource: GraphPointer
  store: ResourceStore
  user: NamedNode
}

export async function createProject({
  projectsCollection,
  resource,
  store,
  user,
}: CreateProjectCommand): Promise<GraphPointer> {
  const label = resource.out(rdfs.label).term!

  const project = await store
    .createMember(projectsCollection, cubeProject(label.value))

  project.addOut(rdfs.label, label)
    .addOut(dcterms.creator, user)

  if (resource.out(cc.projectSourceKind).value === 'CSV') {
    const mapping = store
      .create(csvMapping(project))
      .addOut(rdf.type, cc.CsvMapping)

    project.addOut(cc.csvMapping, mapping)

    const collection = store
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

    mapping.addOut(cc.csvSourceCollection, collection)
  }

  await store.save()
  return project
}
