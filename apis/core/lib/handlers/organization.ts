import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import { getOrganizationDatasets } from '../domain/organization/datasets'

export const getDatasets = protectedResource(asyncMiddleware(async (req, res) => {
  const organization = req.hydra.resource.term
  const content = await getOrganizationDatasets(organization)

  const format = 'application/rdf+xml'
  res.setHeader('Content-Type', format)
  return res.send(content)
}))
