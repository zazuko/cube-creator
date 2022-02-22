import type * as Pipeline from 'barnard59-core/lib/Pipeline'
import { Stream, PassThrough } from 'stream'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import tempy from 'tempy'
import { spawnSync } from 'child_process'
import fromFile from 'rdf-utils-fs/fromFile'
import { loadProject } from './project'
import { tracer } from './otel/tracer'

interface Params {
  jobUri: string
  endpoint: string
  user: string
  password: string
}

/**
 * Opens a SPARQL stream reading the cube, excluding the Cube Constraint subgraph,
 * which will be processed alongside the rest of cube metadata
 */
export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const project = await loadProject(jobUri, this)

  const patterns = sparql`
    ?cube a ${cube.Cube} ; !${cube.observationConstraint}* ?s .
    ?s ?p ?o .

    filter (?p != ${csvw.describes})

    // Filter out original values of mapped dimensions from published data
    filter(not exists{ ?p a ${cc.OriginalValuePredicate} })
  `

  const combined = new PassThrough({
    objectMode: true,
  })

  tempy.file.task(async tempFile => {
    this.logger.info('Saving cube data to temp file %s', tempFile)
    const query = CONSTRUCT`?s ?p ?o`
      .FROM(project.cubeGraph)
      .WHERE`${patterns}`
      .build()

    const params = new URLSearchParams({ query }).toString()

    tracer.startActiveSpan('download cube data', span => {
      spawnSync('curl', [
        endpoint,
        '-X', 'POST',
        '-u', `${user}:${password}`,
        '--data', params,
        '-H', 'Accept:text/turtle',
        '-o', tempFile,
      ],
      { stdio: [process.stdin, process.stdout, process.stderr] })
      span.end()
    })

    this.logger.info('Reading cube data to temp file')
    const localQuads: any = fromFile(tempFile)
    localQuads.pipe(combined)

    return new Promise((resolve, reject) => {
      localQuads.on('end', resolve)
      localQuads.on('error', reject)
    })
  }, {
    extension: 'ttl',
  })

  return combined
}
