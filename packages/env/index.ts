import parent from '@zazuko/env'
import type { Environment as E } from '@rdfjs/environment/Environment.js'
import Environment from '@zazuko/env/Environment.js'
import { RdfineFactory } from '@tpluscode/rdfine'
import { ShFactory } from '@rdfine/shacl/Factory'
import { CsvwFactory } from '@rdfine/csvw/Factory'
import { HydraFactory } from '@rdfine/hydra/Factory'
import { ProvFactory } from '@rdfine/prov/Factory'
import { RdfsFactory } from '@rdfine/rdfs/Factory'
import { SchemaFactory } from '@rdfine/schema/Factory'
import alcaeus, { AlcaeusFactory } from 'alcaeus/Factory.js'
import CubeCreatorModelFactory from '@cube-creator/model/Factory'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import * as Models from '@cube-creator/model'

const env = new Environment([
  RdfineFactory,
  ShFactory,
  CsvwFactory,
  ProvFactory,
  RdfsFactory,
  HydraFactory,
  SchemaFactory,
  alcaeus<DatasetExt>(),
  CubeCreatorModelFactory,
], { parent })

env.rdfine().factory.addMixin(...Object.values(Models))

declare module 'barnard59-env' {
  interface AdditionalFactories extends E<AlcaeusFactory | RdfineFactory> {
  }
}

export default env
