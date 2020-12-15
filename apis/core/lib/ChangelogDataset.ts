import { DatasetCore, Quad } from 'rdf-js'
import $rdf from 'rdf-ext'

interface Changes {
  added: DatasetCore
  deleted: DatasetCore
}

export class ChangelogDataset<D extends DatasetCore = DatasetCore> implements DatasetCore {
  changes: Changes

  constructor(private dataset: D) {
    this.changes = {
      added: $rdf.dataset(),
      deleted: $rdf.dataset(),
    }
  }

  flush(): Changes {
    const lastChanges = this.changes

    this.changes = {
      added: $rdf.dataset(),
      deleted: $rdf.dataset(),
    }

    return lastChanges
  }

  add(quad: Quad): this {
    if (this.changes.deleted.has(quad)) {
      this.changes.deleted.delete(quad)
    } else {
      this.changes.added.add(quad)
    }

    this.dataset.add(quad)

    return this
  }

  delete(quad: Quad): this {
    if (!this.dataset.has(quad)) {
      return this
    }

    if (this.changes.added.has(quad)) {
      this.changes.added.delete(quad)
    } else {
      this.changes.deleted.add(quad)
    }

    this.dataset.delete(quad)

    return this
  }

  get size(): number {
    return this.dataset.size
  }

  [Symbol.iterator](): Iterator<Quad> {
    return this.dataset[Symbol.iterator]()
  }

  has(quad: Quad): boolean {
    return this.dataset.has(quad)
  }

  match(...args: Parameters<DatasetCore['match']>): DatasetCore<Quad, Quad> {
    return this.dataset.match(...args)
  }
}
