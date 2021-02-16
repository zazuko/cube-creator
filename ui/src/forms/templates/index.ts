import { RenderTemplate } from '@hydrofoil/shaperone-wc/templates'

export function decorate<T extends RenderTemplate> (renderer: T, decorator: (renderer: T) => T): T {
  const wrapped = decorator(renderer)

  wrapped.loadDependencies = renderer.loadDependencies
  wrapped.styles = renderer.styles

  return wrapped
}
