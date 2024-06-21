import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import { query } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { createTable } from '../../domain/table/create.js'
import { shaclValidate } from '../../middleware/shacl.js'

export const post = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const table = await createTable({
      tableCollection: await req.hydra.resource.clownface(),
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(201)
    res.header('Location', table.value)

    // Include resources defined with `query:include`
    const types = $rdf.clownface({
      dataset: req.hydra.api.dataset,
      term: table.out(rdf.type).terms,
    })
    const linkedResources = await loadLinkedResources($rdf, table, types.out(query.include).toArray(), req.labyrinth.sparql)
    await res.dataset($rdf.dataset([...table.dataset, ...linkedResources]))
  }),
)
