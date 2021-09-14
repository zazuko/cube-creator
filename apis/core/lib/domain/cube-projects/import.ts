import { DatasetCore, NamedNode, Quad, Stream, Term } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { createMinimalProject, Project } from '@cube-creator/model/Project'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { exists } from './queries'
import { DomainError } from '../../../../errors/domain'
import { BadRequest } from 'http-errors'
import { Transform } from 'stream'
import { obj } from 'through2'
import TermSet from '@rdfjs/term-set'

export type Files = Record<string, (project: Project) => Stream>

interface ImportProject {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  files: Files
  store: ResourceStore
  user: NamedNode
  userName: string
}

interface ImportedProject {
  project: Project
  importedDataset: DatasetCore
}

const sourceKinds = new TermSet([
  cc['projectSourceKind/ExistingCube'],
  cc['projectSourceKind/CSV'],
])

/**
 * Ensures that URI of the project itself in the stream,
 * which should be parsed to an URI with a trailing slash,
 * has that slash removed
 */
export function adjustTerms(project: Project): Transform {
  const idWithSlash = $rdf.namedNode(project.id.value + '/')

  function rewrite<T extends Term>(term: T): T {
    if (term.equals(idWithSlash)) {
      return project.id as any
    }

    return term
  }

  return obj(function ({ subject, predicate, object, graph }: Quad, enc, next) {
    this.push($rdf.quad(rewrite(subject), rewrite(predicate), rewrite(object), rewrite(graph)))

    next()
  })
}

export async function importProject({
  projectsCollection,
  store,
  resource,
  files,
  user,
  userName,
}: ImportProject): Promise<ImportedProject> {
  const label = resource.out(rdfs.label).value
  if (!label) {
    throw new BadRequest('Missing project name')
  }
  const maintainer = resource.out(schema.maintainer).term
  if (!maintainer) {
    throw new BadRequest('Missing organization')
  }

  const projectNode = await store.createMember(projectsCollection.term, id.cubeProject(label))

  const project = createMinimalProject(projectNode, {
    creator: { id: user, name: userName },
    maintainer,
    label,
  })

  const importedDataset = $rdf.dataset()
  for (const file of resource.out(cc.export).toArray()) {
    const next = files[file.value]
    if (!next) {
      throw new BadRequest(`Missing file ${file.value}`)
    }

    await importedDataset.import(next(project))
  }

  const importedProject = clownface({ dataset: importedDataset, graph: project.id }).node(project.id)
  const cubeIdentifier = importedProject.out(dcterms.identifier).value
  if (!cubeIdentifier) {
    throw new BadRequest('Missing cube identifier name in imported data')
  }
  if (await exists(cubeIdentifier, maintainer)) {
    throw new DomainError('Another project is already using same identifier')
  }
  const sourceKind = importedProject.out(cc.projectSourceKind).term
  if (!sourceKind || sourceKind.termType !== 'NamedNode' || !sourceKinds.has(sourceKind)) {
    throw new BadRequest('Missing or invalid cc:projectSourceKind name in imported data')
  }
  project.sourceKind = sourceKind

  // ensure no duplicates for properties
  importedProject.deleteOut([
    dcterms.creator,
    schema.maintainer,
    rdfs.label,
    cc.latestPublishedRevision,
  ])

  return {
    project,
    importedDataset,
  }
}
