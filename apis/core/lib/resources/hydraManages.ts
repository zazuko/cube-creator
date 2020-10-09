import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { hydra } from '@tpluscode/rdf-ns-builders'

type ManagesBlock = {
  object: NamedNode
  property: NamedNode
} | {
  subject: NamedNode
  property: NamedNode
}

export function manages(manages: ManagesBlock): [NamedNode, (manages: GraphPointer) => void] {
  return [hydra.manages, (managesPointer: GraphPointer) => {
    managesPointer.addOut(hydra.property, manages.property)

    if ('subject' in manages) {
      managesPointer.addOut(hydra.subject, manages.subject)
    } else if ('object' in manages) {
      managesPointer.addOut(hydra.object, manages.object)
    }
  }]
}
