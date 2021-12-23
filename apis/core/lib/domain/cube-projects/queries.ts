import { ASK, SELECT } from '@tpluscode/sparql-builder'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { NamedNode, Term } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { DimensionMetadataCollection, Project } from '@cube-creator/model'
import { parsingClient } from '../../query-client'
import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'

export async function findProject(metadataCollection: DimensionMetadataCollection): Promise<NamedNode | undefined> {
  const result = await SELECT`?project`
    .WHERE`
      GRAPH ?dataset {
        ?dataset ${cc.dimensionMetadata} ${metadataCollection.id}
      }

      GRAPH ?project {
        ?project ${cc.dataset} ?dataset .
      }
    `
    .execute(parsingClient.query)

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
