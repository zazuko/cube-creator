import { turtle } from '@tpluscode/rdf-string'
import { md } from '@cube-creator/core/namespace'

export default turtle`
<term-sets> a ${md.ManagedDimensions} .

<terms> a ${md.ManagedDimensionTerms} .
`
