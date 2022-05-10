import { Term } from 'rdf-js'
import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import env from '@cube-creator/shared-dimensions-api/lib/env'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { prov, rdfs } from '@tpluscode/rdf-ns-builders'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension-mapping/update'
import { getUnmappedValues } from '../domain/queries/dimension-mappings'

function rewrite<T extends Term>(term: T, from: string, to: string): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(new RegExp(`^${from}dimension/`), `${to}dimension/`)) as any
  }

  return term
}

function toCanonical<T extends Term>(term: T): T {
  return rewrite(term, env.MANAGED_DIMENSIONS_API_BASE, env.MANAGED_DIMENSIONS_BASE)
}

function fromCanonical<T extends Term>(term: T): T {
  return rewrite(term, env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE)
}

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const mappings = await req.resource()
    const dataset = $rdf.dataset([...mappings.dataset]).map(quad => {
      return $rdf.quad(
        toCanonical(quad.subject),
        quad.predicate,
        toCanonical(quad.object),
        quad.graph,
      )
    })

    const dimensionMapping = await update({
      resource: req.hydra.resource.term,
      mappings: clownface({ dataset }).node(mappings.term),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    return res.dataset(dimensionMapping.dataset)
  }))

export const prepareEntries: Enrichment = async (req, pointer) => {
  if (req.headers.prefer !== 'return=canonical') {
    for (const quad of [...pointer.dataset]) {
      const remapped = $rdf.quad(
        fromCanonical(quad.subject),
        quad.predicate,
        fromCanonical(quad.object),
        quad.graph,
      )

      if (!remapped.equals(quad)) {
        pointer.dataset.delete(quad).add(remapped)
      }
    }
  }

  const dictionary = fromPointer(pointer)
  const unmappedValues = await getUnmappedValues(dictionary.id, dictionary.about)

  dictionary.addMissingEntries(unmappedValues)
}
