import { NamedNode } from 'rdf-js'
import { Constructor } from '@tpluscode/rdfine'
import { _void, schema } from '@tpluscode/rdf-ns-builders'
import { Dataset } from '@cube-creator/model'
import * as Cube from '@cube-creator/model/Cube'

interface ApiDataset {
  addCube(cube: NamedNode, creator: NamedNode): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Dataset extends ApiDataset {}
}

export default function Mixin<Base extends Constructor<Omit<Dataset, keyof ApiDataset>>>(Resource: Base) {
  return class extends Resource {
    addCube(cube: NamedNode, creator: NamedNode) {
      Cube.create(this.pointer.node(cube), { creator })

      this.pointer.addOut(schema.hasPart, cube)
    }
  }
}

Mixin.appliesTo = _void.Dataset
