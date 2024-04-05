import { PassThrough } from 'stream'
import type { NamedNode } from '@rdfjs/types'
import { SELECT } from '@tpluscode/sparql-builder'
import type HydraBox from 'hydra-box'
import { rdf } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { StreamClient } from 'sparql-http-client/StreamClient.js'
import once from 'once'
import toStream from 'rdf-dataset-ext/toStream.js'
import { store } from './store.js'

interface LoaderOptions {
  graph: NamedNode
  sparql: ParsingClient
  stream: StreamClient
}

export default class Loader implements HydraBox.ResourceLoader {
  constructor(private options: LoaderOptions) {
  }

  async forClassOperation(term: NamedNode): Promise<HydraBox.Resource[]> {
    const results = await SELECT`?type`
      .WHERE`GRAPH ${this.options.graph} { ${term} ${rdf.type} ?type }`
      .execute(this.options.sparql)

    if (results.length === 0) {
      return []
    }

    const types = results.reduce((set, { type }) => {
      return type.termType !== 'NamedNode' ? set : set.add(type)
    }, $rdf.termSet<NamedNode>())

    const prefetchDataset = $rdf.dataset([...types].map(type => {
      return $rdf.quad(term, rdf.type, type)
    }))

    const fullDataset = async () => {
      const pointer = await store().load(term)
      return toStream(pointer.dataset)
    }

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
