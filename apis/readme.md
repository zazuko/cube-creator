# Cube-creator Hydra APIs

The projects inside the `apis/` directory are express applications which use [Hydra Core][hydra] vocabulary to provide the necessary features for the Cube Creator application(s).

[hydra]: http://www.hydra-cg.com/spec/latest/core/

This document presents some important design and implementation choices to observe when working with the API as well as during implementation.

## Project structure

The directory tree below presents a preferred structure of an API project.

```
.
└── project/
    ├── bootstrap/
    │   ├── entrypoint.ts
    │   └── index.ts
    ├── hydra/
    │   └── entrypoint.ttl
    ├── lib/
    │   ├── domain/
    │   └── handlers/
    └── test/
```

### `bootstrap/`

Contains static resources which are inserted into the triple store at application start to ensure it is functional. This is because every resource exposed by the API requires its representation stored in the database. This includes the API root (entrypoint) as well as "virtual" resources such as [collections][collection] and write-only resources.

[collection]: http://www.hydra-cg.com/spec/latest/core/#collections

### `hydra/`

Contains Turtle sources of the API Documentation (`hydra:ApiDocumentation`) which describes all resources and operation (possible HTTP requests) understood by the API.

All those files get loaded and combined into a single dataset which `hydra-box` serves under the `/api` URL by default.

### `lib/domain/`

Contains the actual implementation of what is typically called "business logic". Creating new resources, interacting with the database and external systems should go here. This code should be easily testable in isolation and independent of the `express` middlewares.

### `lib/handlers/`

Exports express handlers which handle the incoming requests, orchestrate calls to the `domain` and then provide a response to the client.

## Resources

Any resource which requires its presence on the API surface has to be stored in a named graph identified by the same URL.

```trig
GRAPH <cube-project/foo> {
  <cube-project/foo> a cc:CubeProject , hydra:Resource ;
    rdfs:label "Foo mapping project" .
}
```

Whenever a request to `cube-project/foo` is handled, hydra-box loads that entire graph from the database.

Any modification of resource graph should also be atomic. That is, entire graph replaced in the store.

### Read (`GET`) requests

TL;DR; add `rdf:type hydra:Resource` triple to a resource in order to make it immediately dereferencable.

### Other requests

No write requests are served out of the box and have to be explicitly announced in the API Documentation graph.

For example, to have the `cc:CubeProject` handle a `PUT` request add the triples below to a `ttl` file anywhere in the `hydra/` directory.

```turtle
BASE          <urn:hydra-box:api>
PREFIX cc:    <https://cube-creator.zazuko.com/vocab#>
prefix hydra: <http://www.w3.org/ns/hydra/core#>
prefix code:  <https://code.described.at/>

cc:CubeProject
  hydra:supportedOperation [
    hydra:title "Update project" ;
    hydra:method "PUT" ;
    hydra:expects cc:CubeProject, <shape/CubeProject> ;
    code:implementedBy [
      a code:EcmaScript ;
      code:link <file:handlers/cube-project#update> ;
    ]
  ] .
```

hydra-box looks for such operations where the resource type and `hydra:method` match and then load the code referenced by `code:implementedBy`. That code, loaded as `const { update } = require("handlers/cube-project")` must export an express request handler function or a router object.

### Protecting resources

A reusable middleware can be imported from `@hydrofoil/labyrinth` to restrict access to a resource.

```typescript
import { protectedResource } from '@hydrofoil/labyrinth/resource'

export const update = protectedResource((req, res) => {
  // OK, authorized
  res.send(200).end()
})
```

Additional metadata in the API Documentation graph further narrows down the authorization to restrict access only to certain JWT scopes. Those restrictions can be annotated on the resource type or specific Hydra operations.

This will protect all requests to `cc:CubeProject` instances and additionally restrict access to the `PUT` operation only to users claiming `project:admin` or `project:write` scopes.

The permission check is handled by [`express-jwt-permissions`](https://npm.im/express-jwt-permissions) package, where the lists of `auth:scopes` become parameters to a `guard.check()` call.

```turtle
PREFIX cc:    <https://cube-creator.zazuko.com/vocab#>
prefix hydra: <http://www.w3.org/ns/hydra/core#>
PREFIX auth:  <http://hypermedia.app/auth#>

cc:CubeProject 
  auth:required true ;
  hydra:supportedOperation [
    hydra:method "PUT" ;
    auth:scopes ( "project:admin" ) , ( "project:write" ) ;
  ] .
```

Both `auth:required` and `auth:scopes` can be used on classes and supported operations.

### Collections

Hydra Collections come with a built-in support for convention based, declarative description to easily expose them on the API, including filtering, sorting and paging.

Necessary minimum to declare a resource a collection requires adding the correct type and at least one `hydra:manages` object.

To create a collection of the projects above:

```turtle
PREFIX cc:    <https://cube-creator.zazuko.com/vocab#>
PREFIX rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX hydra: <http://www.w3.org/ns/hydra/core#>

cc:CubeProjectCollection 
  a hydra:Collection ;
  hydra:manages [
    hydra:property rdf:type ;
    hydra:object cc:CubeProject
  ] ;
.
```

The `hydra:Collection` will have the resource executed by a generic express handler.

The `hydra:manages` property should be interpreted as a query patterns. There should always be two of the `hydra:subject`/`hydra:property`/`hydra:object` with the third part populated by a collection member variable.

The collection above would thus translate to a SPARQL pattern equivalent to `?project rdf:type cc:CubeProject`.

There can be multiple `hydra:manages` and the get all combined in the resulting query.
