import { Hydra } from 'alcaeus/node'
import { HydraResponse } from 'alcaeus'
import { cc } from '@cube-creator/core/namespace'

Hydra.cacheStrategy.shouldLoad = (previous: HydraResponse) => {
  if (previous.representation?.root?.types.has(cc.CSVSource)) {
    return true
  }

  return false
}
