import $rdf from 'rdf-ext'
import { TransformJob } from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { Quad } from 'rdf-js'
import map from 'barnard59-base/lib/map'
import { Dictionary } from '@rdfine/prov'
import * as Prov from '@rdfine/prov'
import { hydra, prov } from '@tpluscode/rdf-ns-builders'
import * as Models from '@cube-creator/model'

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(...Object.values(Prov))

async function loadMetadata(jobUri: string) {
  const jobResource = await Hydra.loadResource<TransformJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  if (!job.dimensionMetadata.load) {
    throw new Error(`Dimension Metadata ${job.dimensionMetadata} can not be loaded`)
  }

  const dimensionMetadataResource = await job.dimensionMetadata?.load()
  if (!dimensionMetadataResource.representation) {
    throw new Error(`Dimension Metadata ${job.dimensionMetadata} not loaded`)
  }

  return dimensionMetadataResource.representation.root
}

async function loadDimensionMapping(mappingUri:string) {
  const mappingResource = await Hydra.loadResource<Dictionary>(mappingUri)
  if (!mappingResource.representation) {
    throw new Error(`Mapping ${mappingUri} not loaded`)
  }

  return mappingResource.representation.root?.hadDictionaryMember
}

export async function mapDimensions(this: Pick<Context, 'variables'>) {
  Hydra.cacheStrategy.shouldLoad = (previous) => {
    return !previous.representation.root?.types.has(prov.Dictionary) ||
    !previous.representation.root?.types.has(hydra.ApiDocumentation)
  }

  const jobUri = this.variables.get('jobUri')
  const dimensionMetadataCollection = await loadMetadata(jobUri)
  const dimensionMetadataList = dimensionMetadataCollection?.hasPart

  return map(async ({ subject, predicate, object, graph }: Quad) => {
    const dimensionMetadata = dimensionMetadataList?.find(part => predicate.equals(part.about))
    if (dimensionMetadata) {
      const mappingTerm = dimensionMetadata.mappings
      if (mappingTerm) {
        const dict = await loadDimensionMapping(mappingTerm.value)
        const mappedValue = dict?.find(key => key.pairKey?.equals(object))
        if (mappedValue?.pairEntity) {
          object = mappedValue.pairEntity.id
        }
      }
    }

    return $rdf.quad(subject, predicate, object, graph)
  })
}
