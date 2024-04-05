import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import $rdf from '@zazuko/env'
import { query } from '@cube-creator/core/namespace'
import { shaclValidate } from '../../middleware/shacl.js'
import { updateTable } from '../../domain/table/update.js'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const table = await updateTable({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    // Include resources defined with `query:include`
    const types = $rdf.clownface({
      dataset: req.hydra.api.dataset,
      term: [...req.hydra.resource.types],
    })
    const linkedResources = await loadLinkedResources(table, types.out(query.include).toArray(), req.labyrinth.sparql)
    return res.dataset($rdf.dataset([...table.dataset, ...linkedResources]))
  }),
)
