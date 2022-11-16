import { NamedNode, Term } from 'rdf-js'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { DimensionMetadataCollection, Project } from '@cube-creator/model'
import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import { GraphPointer } from 'clownface'
import { parsingClient } from '../../query-client'

type FindProject = {
  metadataCollection: DimensionMetadataCollection
} | {
  dataset: GraphPointer
}

export async function findProject(arg: FindProject): Promise<NamedNode | undefined> {
  let query = SELECT`?project`

  let dataset: Term
  if ('dataset' in arg) {
    dataset = arg.dataset.term
  } else {
    dataset = $rdf.variable('dataset')
    query = query.WHERE`
      GRAPH ${dataset} {
        ${dataset} ${cc.dimensionMetadata} ${arg.metadataCollection.id}
      }
    `
  }

  query = query
    .WHERE`
      GRAPH ?project {
        ?project ${cc.dataset} ${dataset} .
      }
    `

  const result = await query.execute(parsingClient.query)

  return result[0]?.project as any
}

export function exists(cubeIdentifierOrUri: string | NamedNode, maintainer: Term, client = parsingClient): Promise<boolean> {
  let patterns: SparqlTemplateResult[]

  if (typeof cubeIdentifierOrUri === 'string') {
    const cubeIdentifier = $rdf.literal(cubeIdentifierOrUri)

    const clashingIdentifiers = sparql`graph ?project {
      ?project ${dcterms.identifier} ${cubeIdentifier} .
      ?project ${schema.maintainer} ${maintainer}
    }`

    const identifierClashesWithImportedCube = sparql`graph ?project {
      ?project ${schema.maintainer} ${maintainer} .
      ?project ${cc['CubeProject/sourceCube']} ?cube .
    }

    graph ${maintainer} {
      ?org ${cc.namespace} ?ns

      bind(iri(concat(str(?ns), ${cubeIdentifier})) as ?cube1)
    }

    filter ( ?cube = ?cube1 )`

    patterns = [clashingIdentifiers, identifierClashesWithImportedCube]
  } else {
    const importedCubeClashedWithCsvCube = sparql`graph ?project {
      ?project ${dcterms.identifier} ?cubeIdentifier .
      ?project ${schema.maintainer} ?org .
    }

    graph ?org {
      ?org ${cc.namespace} ?ns
    }

    bind(iri(concat(str(?ns), ?cubeIdentifier)) as ?cube)

    filter (?cube = ${cubeIdentifierOrUri})`

    const projectAlreadyImported = sparql`graph ?project {
      ?project ${cc['CubeProject/sourceCube']} ${cubeIdentifierOrUri} .
    }`

    patterns = [importedCubeClashedWithCsvCube, projectAlreadyImported]
  }

  const [first, ...rest] = patterns
  const union = rest.reduce((current, pattern) => sparql`${current} union { ${pattern} }`, sparql`{ ${first} }`)

  return ASK`${union}`.execute(client.query)
}

export async function previouslyPublished(project: Project, client = parsingClient): Promise<boolean> {
  return ASK`graph ?job {
    ?job a ${cc.PublishJob} ;
         ${schema.actionStatus} ${schema.CompletedActionStatus} ;
         ${cc.project} ${project.id} ;
    .
  }`.execute(client.query)
}
