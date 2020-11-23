/* eslint-disable import/no-duplicates */
declare module 'rdf-cube-view-query' {
  import View = require('rdf-cube-view-query/lib/View')
  import Cube = require('rdf-cube-view-query/lib/Cube')
  import Source = require('rdf-cube-view-query/lib/Source')

  interface Lib {
    View: typeof View
    Cube: typeof Cube
    Source: typeof Source
  }

  const _export: Lib

  export = _export
}

declare module 'rdf-cube-view-query/lib/View' {
  import { DatasetCore, NamedNode, Term } from 'rdf-js'
  import type { GraphPointer } from 'clownface'
  import Node = require('rdf-cube-view-query/lib/Node')
  import Cube = require('rdf-cube-view-query/lib/Cube')
  import Dimension = require('rdf-cube-view-query/lib/Dimension')

  type Observation = Record<string, Term>

  class View extends Node {
    constructor (arg?: { parent: View; term: Term; dataset: DatasetCore; graph: NamedNode; dimensions: any[]; filters: any[] })
    static fromCube(cube: Cube): View

    dimension(arg: { cubeDimension: string | Term | GraphPointer | undefined }): Dimension | null
    observations(): Promise<Observation[]>
  }

  export = View
}

declare module 'rdf-cube-view-query/lib/Source' {
  import Cube = require('rdf-cube-view-query/lib/Cube')
  import Node = require('rdf-cube-view-query/lib/Node')

  class Source extends Node {
    constructor(arg: {
      endpointUrl: string
      user?: string
      password?: string
      sourceGraph?: string
    })

    cubes(): Promise<Cube[]>
  }

  export = Source
}

declare module 'rdf-cube-view-query/lib/Cube' {
  import Node = require('rdf-cube-view-query/lib/Node')

  class Cube extends Node {

  }

  export = Cube
}

declare module 'rdf-cube-view-query/lib/Node' {
  import { DatasetCore, NamedNode, Term } from 'rdf-js'
  import type { GraphPointer } from 'clownface'

  class Node {
    constructor (arg: { parent: Node; term?: Term; dataset: DatasetCore; graph: NamedNode })

    parent: Node
    children: Set<Node>
    ptr: GraphPointer
    term: Term
    dataset: DatasetCore

    clear(): void
  }

  export = Node
}

declare module 'rdf-cube-view-query/lib/Dimension' {
  import Node = require('rdf-cube-view-query/lib/Node')

  class Dimension extends Node {

  }

  export = Dimension
}
