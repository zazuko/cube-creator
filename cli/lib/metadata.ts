import type { Literal, NamedNode } from '@rdfjs/types'
import $rdf from 'rdf-ext'
import { dcat, dcterms, rdf, schema, sh, _void, foaf, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { Dataset, Project, PublishJob } from '@cube-creator/model'
import { HydraClient } from 'alcaeus/alcaeus'
import type { Context } from 'barnard59-core'
import { Published } from '@cube-creator/model/Cube'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import { Readable } from 'readable-stream'
import { fromRdf, toRdf } from 'rdf-literal'
import { tracer } from './otel/tracer'
import { loadProject } from './project'

export async function loadDataset(jobUri: string, Hydra: HydraClient) {
  const jobResource = await Hydra.loadResource<PublishJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  const projectResource = await Hydra.loadResource<Project>(job.project)
  const project = projectResource.representation?.root
  if (!project) {
    throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
  }

  const datasetResource = await Hydra.loadResource<Dataset>(project.dataset.id as any, {
    Prefer: 'include-in-lists',
  })
  const dataset = datasetResource.representation?.root
  if (!dataset) {
    throw new Error(`Dataset ${project.dataset} not loaded`)
  }

  const maintainer = (await project.maintainer.load?.())?.representation?.root
  if (!maintainer) {
    throw new Error(`Organization profile for ${project.maintainer.id.value} not loaded`)
  }

  return { dataset, maintainer }
}

interface Params {
  jobUri: string
  endpoint: string
  user?: string
  password?: string
}

interface QueryParams {
  project: Project
  revision: Literal
  cubeIdentifier: string
  timestamp: Literal
}

function sourceCubeAndShape({ project, revision, cubeIdentifier }: QueryParams) {
  return sparql`
    graph ${project.cubeGraph} {
        ?cube a ${cube.Cube} ;
              !(${cube.observation}|${cube.observationSet})* ?s .
        ?s ?p ?o .

        # add cube version to identifiers
        BIND(IRI(CONCAT(STR(?cube), "/${revision}")) as ?cubeVersion)
        BIND(IF(
          isiri(?s),
          IRI(REPLACE(STR(?s), "${cubeIdentifier}", "${cubeIdentifier}/${revision.value}")),
          ?s
        ) as ?s1)

        BIND(IF(
          isiri(?o) && ?p != ${sh.path}, # do not inject revision into dimension URI used in Constraint Shape
          IRI(REPLACE(STR(?o), "${cubeIdentifier}", "${cubeIdentifier}/${revision.value}")),
          ?o
        ) as ?o1)

        # exclude properties of sh:in values (concept dimensions)
        MINUS {
          ?cube ${cube.observationConstraint}/${sh.property} ?prop .
          ?prop ${sh.in}/${rdf.rest}*/${rdf.first} ?s .
          ?s ?conceptP ?conceptO .
        }
    }
  `
}

function cubeMetadata({ project, revision, timestamp }: QueryParams) {
  const defaultDatePublished = toRdf(fromRdf(timestamp), { datatype: xsd.date })
  return sparql`
  graph ${project.cubeGraph} {
    ?cube a ${cube.Cube} .
        BIND(IRI(CONCAT(STR(?cube), "/${revision}")) as ?cubeVersion)
  }

  graph ${project.dataset.id} {
    ${project.dataset.id} ?cubeProp ?cubeMeta .
    FILTER (?cubeProp != ${schema.datePublished})
    OPTIONAL { ${project.dataset.id} ${schema.datePublished} ?d }
    BIND(COALESCE(?d, ${defaultDatePublished}) AS ?datePublished)

    MINUS {
        ${project.dataset.id} ${schema.hasPart}|${cc.dimensionMetadata} ?cubeMeta
    }

    ?cubeMeta !<>* ?deepMetaS .
    optional {
      ?deepMetaS ?deepMetaP ?deepMetaO .
    }
  }
  `
}

function propertyMetadata({ project }: QueryParams) {
  return sparql`
    graph ${project.cubeGraph} {
      ?propShape ${sh.path} ?path .
    }

    graph ${project.dataset.id} {
      ${project.dataset.id} ${cc.dimensionMetadata} ?dimensionMetadata .
    }

    graph ?dimensionMetadata {
      ?dimensionMetadata ${schema.hasPart} ?dimension .
      ?dimension ${schema.about} ?path ; ?dimensionP ?dimensionO ;
        !<>+ ?dimensionMetaDeepS .
      optional {
        ?dimensionMetaDeepS ?dimensionMetaDeepP ?dimensionMetaDeepO .
      }
      MINUS {
        ?dimension ${cc.dimensionMapping} ?dimensionO .
      }
      MINUS {
        ?dimension ${schema.about} ?dimensionO .
      }
    }
  `
}

function annotateSharedDimensions({ project }: QueryParams) {
  return sparql`
    graph ${project.cubeGraph} {
      ?sharedDimension ${sh.path} ?path .
    }

    graph ${project.dataset.id} {
      ${project.dataset.id} ${cc.dimensionMetadata} ?dimensionMetadata .
    }

    graph ?dimensionMetadata {
      ?dimensionMetadata ${schema.hasPart} ?dimension .
      ?dimension ${schema.about} ?path ;
        ${cc.dimensionMapping} ?dimensionMapping .
    }

    graph ?dimensionMapping {
      ?dimensionMapping ${cc.sharedDimension} ?any
    }

    BIND(${cube.SharedDimension} as ?SharedDimension)
  `
}

export async function loadCubeMetadata(this: Context, { jobUri, endpoint, user, password }: Params) {
  const Hydra = this.variables.get('apiClient')
  const baseCube = $rdf.namedNode(this.variables.get('namespace'))
  const revision = toRdf(this.variables.get('revision'))
  const cubeIdentifier = this.variables.get('cubeIdentifier')
  const timestamp = this.variables.get('timestamp')
  const { project, job } = await loadProject(jobUri, this)

  const attributes = {
    baseCube: baseCube.value,
    revision: revision.value,
    cubeIdentifier,
    timestamp: timestamp.value,
  }
  const { maintainer } = await tracer.startActiveSpan('injectMetadata#setup', { attributes }, async span => {
    try {
      return await loadDataset(jobUri, Hydra)
    } finally {
      span.end()
    }
  })

  const span = tracer.startSpan('injectMetadata#stream', { attributes })

  const queryParams = {
    project,
    cubeIdentifier,
    revision,
    timestamp,
  }

  const stream = await CONSTRUCT`
    ?s1 ?p ?o1 .
    ?cubeVersion
      a ${cube.Cube} ;
      ${schema.version} ${revision} ;
      ${schema.dateModified} ${timestamp} ;
      ${dcterms.modified} ${timestamp} ;
      ${dcterms.identifier} ${$rdf.literal(cubeIdentifier)} ;
      # Set LINDAS query interface and sparql endpoint
      ${dcat.accessURL} ${maintainer.accessURL} ;
      ${_void.sparqlEndpoint} ${maintainer.sparqlEndpoint} ;

      ${schema.datePublished} ?datePublished ;
    .
    ?cube a ${schema.CreativeWork} ; ${schema.hasPart} ?cubeVersion .

    ${(job.status?.equals(Published) && maintainer.dataset)
    ? sparql`
      # add </.well-known/void> link to cubes with published status
      ${maintainer.dataset} ${schema.dataset} ?cubeVersion ; ${foaf.topic} ?cubeVersion.`
    : ''}

    ?cubeVersion ?cubeMetaP ?cubeMetaO ; ?cubeProp ?cubeMeta.
    ?deepMetaS ?deepMetaP ?deepMetaO .
    ?propShape ?dimensionP ?dimensionO .

    ?dimensionMetaDeepS ?dimensionMetaDeepP ?dimensionMetaDeepO .
    ?propShape a ?SharedDimension .
  `
    .WHERE`
    {
      ${sourceCubeAndShape(queryParams)}
    }
    UNION
    {
      # cube metadata
      ${cubeMetadata(queryParams)}
    }
    UNION
    {
      # property metadata
      ${propertyMetadata(queryParams)}
    }
    UNION {
      # 6216a06: Add type cube:SharedDimension to mapped dimensions
      # https://github.com/zazuko/cube-creator/blob/f7dbadff15c706789a58e003551a2c4d1e07efb0/cli/CHANGELOG.md#patch-changes-20
      ${annotateSharedDimensions(queryParams)}
    }
    `.execute(new StreamClient({
    endpointUrl: endpoint,
    user,
    password,
  }).query)

  stream.on('end', span.end.bind(span)).on('error', span.end.bind(span))

  const metadata = await this.variables.get('metadata').import(stream)

  const [{ subject: cubeId }] = metadata.match(null, rdf.type, cube.Cube).toArray()

  const predicatesToCopy = [rdf.type, schema.name, schema.url, schema.encodingFormat]
  job.workExamples.forEach(jobWorkExample => {
    const workExample = $rdf.blankNode()
    metadata.add($rdf.quad(cubeId, schema.workExample, workExample))
    predicatesToCopy.forEach(predicate => {
      jobWorkExample.pointer.out(predicate).forEach(object => {
        metadata.add($rdf.quad(workExample, predicate, object.term as NamedNode | Literal))
      })
    })
  })

  return new Readable({
    objectMode: true,
    read() {
      this.push(metadata)
      this.push(null)
    },
  })
}
