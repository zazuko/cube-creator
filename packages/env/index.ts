import parent from '@zazuko/env'
import Environment from '@zazuko/env/Environment.js'
import { RdfineFactory } from '@tpluscode/rdfine'
import { ShFactory } from '@rdfine/shacl/Factory'
import { CsvwFactory } from '@rdfine/csvw/Factory'
import { HydraFactory } from '@rdfine/hydra/Factory'
import { ProvFactory } from '@rdfine/prov/Factory'
import { SchemaFactory } from '@rdfine/schema/Factory'
import alcaeus from 'alcaeus/Factory.js'
import CubeCreatorModelFactory from '@cube-creator/model/Factory'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'

const env = new Environment([
  RdfineFactory,
  ShFactory,
  CsvwFactory,
  ProvFactory,
  HydraFactory,
  SchemaFactory,
  alcaeus<DatasetExt>(),
  CubeCreatorModelFactory,
], { parent })

export default env
