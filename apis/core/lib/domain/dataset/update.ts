import type { NamedNode } from '@rdfjs/types'
import { cc, lindasSchema } from '@cube-creator/core/namespace'
import { dcat, hydra, rdf, schema, vcard, _void } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { ResourceStore } from '../../ResourceStore'
import * as projectQuery from '../cube-projects/queries'

interface AddMetaDataCommand {
  dataset: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  findProject?(arg: { dataset: GraphPointer }): Promise<NamedNode | undefined>
}

export async function update({
  dataset,
  resource,
  store,
  findProject = projectQuery.findProject,
}: AddMetaDataCommand): Promise<GraphPointer> {
  const datasetResource = await store.get(dataset.term)

  const hasPart = datasetResource.out(schema.hasPart)
  const dimensionMetadata = datasetResource.out(cc.dimensionMetadata)

  for (const quad of datasetResource.dataset) {
    datasetResource.dataset.delete(quad)
  }
  for (const quad of resource.dataset) {
    datasetResource.dataset.add(quad)
  }

  // Make sure the type is correct
  datasetResource.addOut(rdf.type, hydra.Resource)
    .addOut(rdf.type, schema.Dataset)
    .addOut(rdf.type, _void.Dataset)
    .addOut(rdf.type, dcat.Dataset)

  datasetResource.deleteOut(schema.hasPart).addOut(schema.hasPart, hasPart.terms)
  datasetResource.deleteOut(cc.dimensionMetadata).addOut(cc.dimensionMetadata, dimensionMetadata.terms)

  // Set schema.org contact point
  datasetResource.out(schema.contactPoint).deleteOut()
  datasetResource.deleteOut(schema.contactPoint)
  datasetResource.out(dcat.contactPoint).forEach(contact => {
    datasetResource.addOut(schema.contactPoint, schemaContact => {
      schemaContact.addOut(rdf.type, schema.ContactPoint)

      const name = contact.out(vcard.fn).term
      if (name) {
        schemaContact.addOut(schema.name, name)
      }

      const email = contact.out(vcard.hasEmail).term
      if (email) {
        schemaContact.addOut(schema.email, email)
      }
    })
  })

  const project = await store.get(await findProject({ dataset }), { allowMissing: true })
  project
    ?.deleteOut(lindasSchema.datasetNextDateModified)
    .addOut(lindasSchema.datasetNextDateModified, datasetResource.out(lindasSchema.datasetNextDateModified))

  return datasetResource
}
