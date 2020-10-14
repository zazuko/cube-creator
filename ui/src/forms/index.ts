import { renderer, components, editors } from '@hydrofoil/shaperone-wc/configure'
import { DefaultStrategy } from '@hydrofoil/shaperone-wc/renderer/DefaultStrategy'
import * as MaterialRenderStrategy from '@hydrofoil/shaperone-wc-material/renderer'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import { css } from '@hydrofoil/shaperone-wc'
import * as Components from './components'
import * as Matchers from './matchers'
import { Metadata } from './metadata'

renderer.setStrategy({
  ...DefaultStrategy,
  ...MaterialRenderStrategy,
  focusNode: MaterialRenderStrategy.focusNode(DefaultStrategy.focusNode),
})
components.pushComponents(Components)

editors.addMatchers(Matchers)
editors.addMetadata(Metadata)

class Form extends ShaperoneForm {
  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }
}

customElements.define('cc-form', Form)
