import { obj } from 'through2'
import { Quad, Quad_Object as QuadObject } from 'rdf-js'
import $rdf from 'rdf-ext'
import { dcterms, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { Project, PublishJob } from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import * as Models from '@cube-creator/model'
import TermSet from '@rdfjs/term-set'
import type { Context } from 'barnard59-core/lib/Pipeline'

Hydra.resources.factory.addMixin(...Object.values(Models))

async function loadDataset(jobUri: string) {
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
  if (!project.dataset.load) {
    throw new Error(`Dataset ${project.dataset} can not be loaded`)
  }

  const datasetResource = await project.dataset?.load()
  const dataset = datasetResource.representation?.root
  if (!dataset) {
    throw new Error(`Dataset ${project.dataset} not loaded`)
  }

  return dataset
}

export async function injectMetadata(this: Context, jobUri: string) {
  const revision = this.variables.get('revision')
  const cubeIdentifier = this.variables.get('cubeIdentifier')
  const dataset = await loadDataset(jobUri)
  const datasetTriples = dataset.pointer.dataset.match(null, null, null, dataset.id)
  const previousCubes = this.variables.get('previousCubes')
  const timestamp = this.variables.get('timestamp')
  const mappedCubeTerms = this.variables.get('mappedCubeTerms')

  return obj(function (quad: Quad, _, callback) {
    const visited = new TermSet()
    const copyChildren = (subject: QuadObject) => {
      if (subject && subject.termType !== 'Literal' && !visited.has(subject)) {
        [...datasetTriples.match(subject)].forEach(item => {
          this.push($rdf.triple(subject, item.predicate, item.object))
          visited.add(subject)
          copyChildren(item.object)
        })
      }
    }

    // Cube Metadata
    if (rdf.type.equals(quad.predicate) && quad.object.equals(cube.Cube)) {
      this.push($rdf.quad(quad.subject, schema.version, $rdf.literal(revision.toString(), xsd.integer)))
      this.push($rdf.quad(quad.subject, schema.dateModified, timestamp))
      this.push($rdf.quad(quad.subject, dcterms.modified, timestamp))
      this.push($rdf.quad(quad.subject, dcterms.identifier, $rdf.literal(cubeIdentifier)))

      if (revision === 1) {
        this.push($rdf.quad(quad.subject, schema.datePublished, timestamp))
      }

      const previousCube = previousCubes.get(quad.subject)
      if (previousCube) {
        this.push($rdf.quad(previousCube, schema.validThrough, timestamp))
      }

      [...datasetTriples.match(dataset.id)]
        .filter(q => !q.predicate.equals(schema.hasPart) && !q.predicate.equals(cc.dimensionMetadata))
        .forEach(metadata => {
          this.push($rdf.triple(quad.subject, metadata.predicate, metadata.object))
          visited.add(quad.subject)
          copyChildren(metadata.object)
        })
    }

    // Dimension Metadata
    if (quad.predicate.equals(sh.path)) {
      const baseDimensionId = mappedCubeTerms.get(quad.object)
      if (baseDimensionId) {
        [...datasetTriples.match(null, schema.about, baseDimensionId)].forEach(dim => {
          [...datasetTriples.match(dim.subject)]
            .filter(c => !c.predicate.equals(schema.about))
            .forEach(item2 => {
              this.push($rdf.triple(quad.subject, item2.predicate, item2.object))
              visited.add(quad.subject)
              copyChildren(item2.object)
            })
        })
      }
    }

    this.push(quad)
    callback()
  })
}
