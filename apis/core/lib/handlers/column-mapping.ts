import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl.js'
import { createColumnMapping } from '../domain/column-mapping/create.js'
import { updateLiteralColumnMapping, updateReferenceColumnMapping } from '../domain/column-mapping/update.js'
import { deleteColumnMapping } from '../domain/column-mapping/delete.js'

export const postLiteral = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await createColumnMapping({
    tableId: req.hydra.resource.term,
    resource: await req.resource(),
    store: req.resourceStore(),
  })
  await req.resourceStore().save()

  res.status(201)
  res.header('Location', columnMapping.value)
  await res.dataset(columnMapping.dataset)
}))

export const postReference = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await createColumnMapping({
    tableId: req.hydra.resource.term,
    resource: await req.resource(),
    store: req.resourceStore(),
  })
  await req.resourceStore().save()

  res.status(201)
  res.header('Location', columnMapping.value)
  await res.dataset(columnMapping.dataset)
}))

export const putLiteral = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await updateLiteralColumnMapping({
    resource: await req.resource(),
    store: req.resourceStore(),
  })
  await req.resourceStore().save()

  await res.dataset(columnMapping.dataset)
}))

export const putReference = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await updateReferenceColumnMapping({
    resource: await req.resource(),
    store: req.resourceStore(),
  })
  await req.resourceStore().save()

  await res.dataset(columnMapping.dataset)
}))

export const remove = labyrinth.protectedResource(
  asyncMiddleware(async (req, res) => {
    const columnMapping = req.hydra.resource
    await deleteColumnMapping({
      resource: columnMapping.term,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()
    res.sendStatus(204)
  }),
)
