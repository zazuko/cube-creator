import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import { shaclValidate } from '../../middleware/shacl'
import { createTable } from '../../domain/table/create'
import { query } from '@cube-creator/core/namespace'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdf } from '@tpluscode/rdf-ns-builders'

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
    const types = clownface({
      dataset: req.hydra.api.dataset,
      term: table.out(rdf.type).terms,
    })
    const linkedResources = await loadLinkedResources(table, types.out(query.include).toArray(), req.labyrinth.sparql)
    await res.dataset($rdf.dataset([...table.dataset, ...linkedResources]))
  }),
)
