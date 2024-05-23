import { Stream } from 'stream'
import { spawnSync } from 'child_process'
import type { Context } from 'barnard59-core'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import tempy from 'tempy'
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
export async function loadCube(this: Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const { project } = await loadProject(jobUri, this)

  const patterns = sparql`
    ?cube a ${cube.Cube} ; !${cube.observationConstraint}* ?s .
    ?s ?p ?o .

    filter (?p != ${csvw.describes})

    # Filter out original values of mapped dimensions from published data
    filter not exists { ?p a ${cc.OriginalValuePredicate} }
    filter not exists { ?s a ${cc.OriginalValuePredicate} }
  `

  return tempy.file.task(async tempFile => {
    this.logger.info('Saving cube data to temp file %s', tempFile)
    const query = CONSTRUCT`?s ?p ?o`
      .FROM(project.cubeGraph)
      .WHERE`${patterns}`
      .build()

    const params = new URLSearchParams({ query }).toString()

    const exit = tracer.startActiveSpan('download cube data', span => {
      const exit = spawnSync('curl', [
        endpoint,
        '-X', 'POST',
        '-u', `${user}:${password}`,
        '--data', params,
        '-H', 'Accept:text/turtle',
        '-o', tempFile,
        '--fail',
      ],
      { stdio: [process.stdin, process.stdout, process.stderr] })
      span.end()
      return exit
    })

    if (exit.status) {
      throw new Error(`Cube download failed. Curl exited with ${exit.status}`)
    }

    this.logger.info('Reading cube data from temp file')
    return fromFile(tempFile) as any
  }, {
    extension: 'ttl',
  })
}
