import { cc } from '@cube-creator/core/namespace'
import { Project } from '@cube-creator/model/Project'
import { SELECT } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import type { NamedNode, Stream, Term } from 'rdf-js'
import StreamClient from 'sparql-http-client'
import through2 from 'through2'
import $rdf from 'rdf-ext'
import { streamClient } from '../../query-client'
import { ResourceStore } from '../../ResourceStore'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import { rdfs } from '@tpluscode/rdf-ns-builders/strict'

interface GetExportedProject {
  resource: NamedNode
  store: ResourceStore
  client?: StreamClient
}

interface ExportedProject {
  project: Project
  data: Stream
}

export async function getExportedProject({ resource, store, client = streamClient }: GetExportedProject): Promise<ExportedProject> {
  const project = await store.getResource<Project>(resource)

  const quads = await SELECT`?s ?p ?o ?g`
    .WHERE`{
      select distinct ?g {
        GRAPH ${project.id} {
          ${project.id} ${cc.cubeGraph} ?cubeData
        }
        GRAPH ?g { ?s1 ?p1 ?o1 }

        FILTER ( ?g != ?cubeData )
        FILTER (
          STRSTARTS(STR(?g), "${project.id.value}" )
        )

        MINUS {
          # Exclude jobs
          GRAPH ?g { ?s a ${cc.Job} }
        }
      }
    }

    GRAPH ?g { ?s ?p ?o }

    FILTER (
      # Exclude properties added on creation
      ?g != ${project.id} || ?p NOT ${IN(dcterms.creator, schema.maintainer, cc.latestPublishedRevision, rdfs.label)}
    )

    # Exclude source's link to S3
    MINUS {
      GRAPH ?g {
        ?s a ${cc.CSVSource} .
        ?o ^${schema.associatedMedia} ?s .
      }
    }
    MINUS {
      GRAPH ?g { ?s ?p ?o }
      FILTER (
        EXISTS { GRAPH ?g { [] ${schema.associatedMedia} ?s } }
      )
    }

    FILTER (
      # Exclude project creator
      ?g != ${project.id} || ( ?g = ${project.id} && ?s = ${project.id} )
    )
    `
    .execute(client.query)

  const projectNamespace = new RegExp(`^${project.id.value}/?`)
  function removeBase<T extends Term>(term: T): T {
    if (term.termType === 'NamedNode') {
      return $rdf.namedNode(term.value.replace(projectNamespace, '')) as any
    }

    return term
  }

  const transformToQuads = through2.obj(function ({ s, p, o, g }, _, callback) {
    this.push($rdf.quad(removeBase(s), removeBase(p), removeBase(o), removeBase(g)))
    callback()
  })

  return {
    project,
    data: quads.pipe(transformToQuads),
  }
}
