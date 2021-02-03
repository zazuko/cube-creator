import { hydra } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import { md } from '@cube-creator/core/namespace'

export default turtle`
<> a ${hydra.Resource} ;
  ${md.managedDimensions} <term-sets> ;
.`
