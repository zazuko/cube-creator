import { SELECT } from '@tpluscode/sparql-builder'
import type HydraBox from 'hydra-box'
import { NamedNode } from 'rdf-js'
import { rdf } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { ParsingClient } from 'sparql-http-client/ParsingClient'

interface LoaderOptions {
  graph: NamedNode
  sparql: ParsingClient
}

export default class implements HydraBox.ResourceLoader {
  constructor(private options: LoaderOptions) {
  }

  async forClassOperation(term: NamedNode): Promise<HydraBox.Resource[]> {
    const results = await SELECT`?type`
      .WHERE`GRAPH ${this.options.graph} { ${term} ${rdf.type} ?type }`
      .execute(this.options.sparql.query)

    if (results.length === 0) {
      return []
    }

    const types = results.reduce((set, { type }) => {
      return type.termType !== 'NamedNode' ? set : set.add(type)
    }, new TermSet<NamedNode>())

    const prefetchDataset = $rdf.dataset([...types].map(type => {
      return $rdf.quad(term, rdf.type, type)
    }))

    return [{
      term,
      types,
      prefetchDataset,
      async dataset() {
        return $rdf.dataset()
      },
      quadStream() {
        return $rdf.dataset().toStream()
      },
    }]
  }

  forPropertyOperation(): Promise<HydraBox.PropertyResource[]> {
    return Promise.resolve([])
  }
}
