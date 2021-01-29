import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension-mapping/update'
import { getUnmappedValues } from '../domain/queries/dimension-mappings'
import { prov } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const dimensionMapping = await update({
      resource: req.hydra.resource.term,
      mappings: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    return res.dataset(dimensionMapping.dataset)
  }))

export const prepareEntries: Enrichment = async (req, pointer) => {
  const dictionary = fromPointer(pointer)
  const unmappedValues = await getUnmappedValues(dictionary.id, dictionary.about)

  dictionary.addMissingEntries(unmappedValues)

  pointer.out(prov.hadDictionaryMember)
    .addOut(cc.managedDimension, dictionary.managedDimension)
}
