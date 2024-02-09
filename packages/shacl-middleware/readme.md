# hydra-box-middleware-shacl

Express middleware which extends a hydra-box with SHACL-based request validation.

When the validation fails, responds status code 400 with an `application/problem+json` payload.

## Prerequisite

The middleware expects the express `RequestHandler` to provide an async `req.resource()` function which returns a Graph Pointer to the request resource parsed from the body.

Unless custom implementation is needed, use `express-rdf-request`:

```js
import { resource } from 'express-rdf-request'
import express from 'express'

const app = express()
app.use(resource)
```

## Usage

Exported from the package's main module, a factory function requires configuration object to

```typescript
import { shaclMiddleware } from 'hydra-box-middleware-shacl' 
import express from 'express'
import type { NamedNode, Term, Quad } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'

const app = express()
app.use(shaclMiddleware({
  loadResource(id: NamedNode): Promise<GraphPointer<NamedNode>> {
    // loads (Shape) resources which will be used for validation   
  },
  loadResourcesTypes(ids: Term[]): Promise<Quad[]> {
    // when validating property shapes using sh:class,
    // loads RDF Types of the associated resource
    // useful when the request links to resources outside its own representation 
  },
  getTargetNode(req: Request, res: Response): NamedNode {
    // (Optional)
    // Allows overriding the target node which will be validated  
  },
}))
```

## How it works

1. The SHACL Shapes are determined by looking at the hydra-box operation's `hydra:expects`. Any URI term which has a type `sh:NodeShape` will be loaded using the configured function
2. If a shape does not have a target, `sh:targetNode` will be used. It's either the requested resource URI or one returned by the `getTargetNode` option
3. RDF types are loaded for values of properties whose shapes have the `sh:class` constraint
