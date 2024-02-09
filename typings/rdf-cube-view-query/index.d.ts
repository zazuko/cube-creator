/* eslint-disable import/no-duplicates,@typescript-eslint/no-empty-interface,no-use-before-define */
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

declare module 'rdf-cube-view-query/lib/query/ViewQuery' {
  import type { GraphPointer } from 'clownface'

  namespace ViewQuery {
    interface ViewQuery {
      view: GraphPointer
      build(): void
      query: any
      countQuery: any
    }
  }

  interface ViewQuery extends ViewQuery.ViewQuery {}
  class ViewQuery implements ViewQuery.ViewQuery {
    constructor(viewPointer: GraphPointer)
  }

  export = ViewQuery
}

declare module 'rdf-cube-view-query/lib/View' {
  import type { DatasetCore, NamedNode, Term } from '@rdfjs/types'
  import type { GraphPointer } from 'clownface'
  import ViewQuery = require('rdf-cube-view-query/lib/query/ViewQuery')
  import Node = require('rdf-cube-view-query/lib/Node')
  import Cube = require('rdf-cube-view-query/lib/Cube')
  import Dimension = require('rdf-cube-view-query/lib/Dimension')

  type Observation = Record<string, Term>

  namespace View {
    interface View extends Node.Node {
      dimensions: Dimension[]
      dimension(arg: { cubeDimension: string | Term | GraphPointer | undefined }): Dimension | null
      observations(options?: { disableDistinct: boolean }): Promise<Observation[]>
      observationCount(options?: { disableDistinct: boolean }): Promise<number>
      observationsQuery(options?: { disableDistinct: boolean }): ViewQuery
      limit(limit: number): View
      offset(offset: number): View
    }
  }

  interface View extends View.View {}
  class View extends Node implements View.View {
    constructor (arg?: { parent: Node.Node; term: Term; dataset: DatasetCore; graph: NamedNode; dimensions: any[]; filters: any[] })
    static fromCube(cube: Cube.Cube): View.View
  }

  export = View
}

declare module 'rdf-cube-view-query/lib/Source' {
  import Cube = require('rdf-cube-view-query/lib/Cube')
  import Node = require('rdf-cube-view-query/lib/Node')

  namespace Source {
    interface Source extends Node.Node {
      cubes(): Promise<Cube[]>
    }
  }

  class Source extends Node implements Source.Source {
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
  import type { DatasetCore, NamedNode, Term } from '@rdfjs/types'
  import Node = require('rdf-cube-view-query/lib/Node')
  import Source = require('rdf-cube-view-query/lib/Source')

  namespace Cube {
    interface Cube extends Node.Node {
      clear(): void
      source: Source
    }
  }

  interface Cube extends Cube.Cube {}
  class Cube extends Node implements Cube.Cube {
    constructor(arg: { parent?: Node.Node; term?: Term; dataset?: DatasetCore; graph?: NamedNode; source: Source.Source })
  }

  export = Cube
}

declare module 'rdf-cube-view-query/lib/Node' {
  import type { DatasetCore, NamedNode, Term } from '@rdfjs/types'
  import type { GraphPointer } from 'clownface'

  namespace Node {
    interface Node {
      parent: Node
      children: Set<Node>
      ptr: GraphPointer
      term: Term
      dataset: DatasetCore

      clear(): void
    }
  }

  class Node implements Node.Node {
    constructor (arg: { parent?: Node.Node; term?: Term; dataset?: DatasetCore; graph?: NamedNode })

    parent: Node.Node
    children: Set<Node.Node>
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
