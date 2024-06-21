import type { Literal, NamedNode } from '@rdfjs/types'
import * as Csvw from '@rdfine/csvw'
import { Dataset as DatasetExt } from '@zazuko/env/lib/DatasetExt.js'
import { PublishJob, UnlistJob } from '../../packages/model/Job.js'

declare module 'barnard59-core' {
  interface Variables {
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
    targetFile: string
    revision: number
    namespace: string
    cubeIdentifier: string
    timestamp: Literal
    graph: string
    bnodeUuid: string
    metadata: DatasetExt
    shapesPath: string
    sourceCube: NamedNode
    sourceEndpoint: NamedNode
    sourceGraph: NamedNode | undefined
    metadataResource: string
    datasetResource: string
    transformed: { csvwResource: Csvw.Table<DatasetExt> ; isObservationTable: boolean }
    lastTransformed: { csv?: string; row?: number }
    messages: string[]
    originalValueQuads: DatasetExt
    cubeCreatorVersion: string
    cliVersion: string
  }
}
