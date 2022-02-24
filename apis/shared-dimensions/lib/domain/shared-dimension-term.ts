import { NamedNode } from 'rdf-js'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { DomainError } from '@cube-creator/api-errors'
import { SharedDimensionsStore } from '../store'

interface UpdateTerm {
  store: SharedDimensionsStore
  term: GraphPointer<NamedNode>
}

export async function updateTerm({ term, store } : UpdateTerm): Promise<GraphPointer<NamedNode>> {
  const current = await store.load(term.term)

  const termSetId = term.out(schema.inDefinedTermSet).term
  if (current.has(schema.inDefinedTermSet, termSetId).terms.length === 0) {
    throw new DomainError('Cannot change the term set')
  }

  if (!term.out(schema.validFrom).term) {
    const termSet = await store.load(termSetId)
    term.addOut(schema.validFrom, termSet.out(schema.validFrom))
  }

  term.addOut(rdf.type, hydra.Resource)

  await store.save(term)
  return term
}
