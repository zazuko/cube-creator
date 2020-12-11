import { NamedNode, Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import { Constructor } from '@tpluscode/rdfine'
import { _void, schema } from '@tpluscode/rdf-ns-builders'
import { Dataset } from '@cube-creator/model'
import * as Cube from '@cube-creator/model/Cube'

interface ApiDataset {
  addCube(cube: NamedNode, creator: NamedNode): void
  renameCube(cube: NamedNode, newId: NamedNode): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Dataset extends ApiDataset {}
}

export default function Mixin<Base extends Constructor<Omit<Dataset, keyof ApiDataset>>>(Resource: Base) {
  return class extends Resource implements ApiDataset {
    addCube(cube: NamedNode, creator: NamedNode) {
      Cube.create(this.pointer.node(cube), { creator })

      this.pointer.addOut(schema.hasPart, cube)
    }

    renameCube(cube: NamedNode, newId: NamedNode): void {
      if (!newId) return

      const rename = <T extends Term>(term: Term): T => (term.equals(cube) ? newId : term) as T

      for (const quad of [...this.pointer.dataset]) {
        this.pointer.dataset.delete(quad)
        this.pointer.dataset.add($rdf.quad(
          rename(quad.subject),
          quad.predicate,
          rename(quad.object),
          quad.graph,
        ))
      }
    }
  }
}

Mixin.appliesTo = _void.Dataset
