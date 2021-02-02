import { DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import type HydraBox from 'hydra-box'
import { NamedNode } from 'rdf-js'
import { rdf } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { StreamClient } from 'sparql-http-client/StreamClient'
import once from 'once'
import { PassThrough } from 'stream'

interface LoaderOptions {
  graph: NamedNode
  sparql: ParsingClient
  stream: StreamClient
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

    const fullDataset = () => DESCRIBE`${term}`.FROM(this.options.graph).execute(this.options.stream.query)

    return [{
      term,
      types,
      prefetchDataset,
      dataset: once(async () => $rdf.dataset().import(await fullDataset())),
      quadStream() {
        const forward = new PassThrough({
          objectMode: true,
        })

        fullDataset()
          .then(stream => stream.pipe(forward))
          .catch(err => forward.emit('error', err))

        return forward
      },
    }]
  }

  forPropertyOperation(): Promise<HydraBox.PropertyResource[]> {
    return Promise.resolve([])
  }
}
