import { Literal, Term } from 'rdf-js'

declare module 'barnard59-core/lib/Pipeline' {
  interface VariableNames {
    jobUri: string
    executionUrl: string
    'graph-store-endpoint': string
    'graph-store-user': string
    'graph-store-password': string
    'publish-graph-query-endpoint': string
    'publish-graph-store-endpoint': string
    'publish-graph-store-user': string
    'publish-graph-store-password': string
    'target-graph': string
    revision: number
    namespace: string
    cubeIdentifier: string
    timestamp: Literal
    isObservationTable: boolean
    graph: string
    bnodeUuid: string
    versionedDimensions: Set<Term>
  }
}
