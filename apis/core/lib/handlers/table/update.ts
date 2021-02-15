import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import $rdf from 'rdf-ext'
import { query } from '@cube-creator/core/namespace'
import { shaclValidate } from '../../middleware/shacl'
import { updateTable } from '../../domain/table/update'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const table = await updateTable({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    // Include resources defined with `query:include`
    const types = clownface({
      dataset: req.hydra.api.dataset,
      term: [...req.hydra.resource.types],
    })
    const linkedResources = await loadLinkedResources(table, types.out(query.include).toArray(), req.labyrinth.sparql)
    return res.dataset($rdf.dataset([...table.dataset, ...linkedResources]))
  }),
)
