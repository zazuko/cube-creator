import { Literal, NamedNode, Term } from 'rdf-js'
import { HydraClient } from 'alcaeus/alcaeus'
import { PublishJob, UnlistJob } from '../../packages/model/Job'

declare module 'barnard59-core/lib/Pipeline' {
  interface VariableNames {
    apiClient: HydraClient
    jobUri: string
    executionUrl: string
    'graph-store-endpoint': string
    'graph-store-user': string
    'graph-store-password': string
    'publish-graph-query-endpoint': string
    'publish-graph-store-endpoint': string
    'publish-graph-store-user': string
    'publish-graph-store-password': string
    'publish-job': PublishJob
    'unlist-job': UnlistJob
    'target-graph': string
    revision: number
    namespace: string
    cubeIdentifier: string
    timestamp: Literal
    isObservationTable: boolean
    graph: string
    bnodeUuid: string
    versionedDimensions: Set<Term>
    sourceCube: NamedNode
    sourceEndpoint: NamedNode
    sourceGraph: NamedNode | undefined
    metadataResource: string
    datasetResource: string
  }
}
