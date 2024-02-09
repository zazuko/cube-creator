import { Transform } from 'stream'
import type { DatasetCore, NamedNode, Quad, Term } from '@rdfjs/types'
import { BadRequest } from 'http-errors'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { Files } from '@cube-creator/express/multipart'
import { createMinimalProject, Project } from '@cube-creator/model/Project'
import { dcterms, rdfs, schema, rdf } from '@tpluscode/rdf-ns-builders/strict'
import clownface, { GraphPointer } from 'clownface'
import { obj } from 'through2'
import TermSet from '@rdfjs/term-set'
import { Organization } from '@rdfine/schema'
import QuadExt from 'rdf-ext/lib/Quad'
import { DomainError } from '../../../../errors/domain'
import * as id from '../identifiers'
import { ResourceStore } from '../../ResourceStore'
import { exists } from './queries'

interface ImportProject {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  files: Files
  store: ResourceStore
  user: NamedNode
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

function alignCubeNamespace(before: string, after: string) {
  function rewrite<T extends Term>(term: T): T {
    if (term.termType === 'NamedNode' && term.value.startsWith(before)) {
      return $rdf.namedNode(term.value.replace(before, after)) as any
    }

    return term
  }

  return ({ subject, predicate, object, graph }: QuadExt): QuadExt => {
    return $rdf.quad(rewrite(subject), rewrite(predicate), rewrite(object), graph)
  }
}

function setCsvSourceErrors(dataset: DatasetCore) {
  // errors will notify users that CSVs need to be uploaded
  clownface({ dataset })
    .has(rdf.type, cc.CSVSource)
    .forEach(source => {
      clownface({ dataset, graph: source.term })
        .node(source)
        .addOut(schema.error, 'CSV must be uploaded after importing project')
    })
}

export async function importProject({
  projectsCollection,
  store,
  resource,
  files,
  user,
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
    creator: user,
    maintainer,
    label,
  })

  let importedDataset = $rdf.dataset()
  for (const file of resource.out(cc.export).toArray()) {
    const next = files[file.value]
    if (!next) {
      throw new BadRequest(`Missing file ${file.value}`)
    }

    await importedDataset.import(next(project.id.value + '/').pipe(adjustTerms(project)))
  }

  const importedProject = clownface({ dataset: importedDataset, graph: project.id }).node(project.id)
  const cubeIdentifier = resource.out(dcterms.identifier).value || importedProject.out(dcterms.identifier).value
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

  setCsvSourceErrors(importedDataset)

  // ensure no duplicates for properties
  importedProject
    .deleteOut([
      dcterms.creator,
      schema.maintainer,
      rdfs.label,
      cc.latestPublishedRevision,
      dcterms.identifier,
    ])
    .addOut(dcterms.identifier, cubeIdentifier)

  if (project.sourceKind.equals(cc['projectSourceKind/CSV'])) {
    const originalCubeId = clownface({ dataset: importedDataset })
      .has(rdf.type, schema.Dataset)
      .out(schema.hasPart)
      .term

    if (!originalCubeId) {
      throw new BadRequest('Cube dataset resource not found in imported data')
    }

    const orgProfile = await store.getResource<Organization>(maintainer)
    const cubeId = orgProfile.createIdentifier({ cubeIdentifier })
    importedDataset = importedDataset.map(alignCubeNamespace(originalCubeId.value, cubeId.value))
  }

  return {
    project,
    importedDataset,
  }
}
