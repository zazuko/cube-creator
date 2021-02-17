# express-rdf-request

Middleware which attaches a `req.resource()` to simplify getting a Graph Pointer to the request payload.

## Usage

```js
import { resource } from 'express-rdf-request'
import express from 'express'

const app = express()
app.use(resource)

app.use(async (req) => {
  const resource = await req.resource()
})
```

## What it does

Uses [@rdfjs/express-handler](https://npm.im/@rdfjs/express-handler) to parse the incoming request as RDF.

It will first try to find the node exactly matching the requested URI. If there are no statements about that resource, it will return an empty string resource `<>`.

Given a [hydra-box](https://npm.im/hydra-box) API, it will assert that the resource has `rdf:type`s found in the operation's `hydra:expects`, but only those which are explicitly typed as `hydra:Class`.
