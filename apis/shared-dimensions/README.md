# Cube Curator Shared Dimensions API

This Hydra-driven API provides functionality for creating and finding dimensions (dictionaries) share between all Cube Creator's cubes.

It is not standalone and deployed together with the [Core API](../core) under a sub path `/shared-dimensions`.

Please refer to the latter for authentication and debugging information.

## RDF namespaces

| `meta` | `https://cube.link/meta/` |

## Resource organization

The API provides two distinct of functionalities:

1. Retrieving Shared Dimensions from the store
2. Managing user-defined Shared Dimensions

The API operates on instances of shared dimensions. A Shared Dimension is an RDF resource, found anywhere in the store, which is defined as

```turtle
?dimension a schema:DefinedTermSet , meta:SharedDimension .
```

### Retrieving Shared Dimensions

There are two endpoints: `/term-sets` and `/terms{?dimension}` which return collections of Shared Dimensions, and the terms they define respectively.

Any resource which has both `schema:DefinedTermSet` and `meta:SharedDimension` RDF Types will be returned.

The `/terms{?dimension}` endpoint requires the URI of a Shared Dimension as the query string parameter.

### Managing Shared Dimensions

TBD

## Configuration

These environment variables are required for the API to function correctly:

| Variable | Description |
| -- | -- |
| `MANAGED_DIMENSIONS_TERM_BASE` | Base URI for term sets and terms |
| `MANAGED_DIMENSIONS_GRAPH` | Named Graph in the database which contains user-created **Shared Dimensions** |
| `MANAGED_DIMENSIONS_API_BASE` | Base URI for API resources. Must be `API_CORE_BASE` + `/shared-dimensions` |

And of course, these variables need to be provided to configure database connection:

- `MANAGED_DIMENSIONS_STORE_ENDPOINT`
- `MANAGED_DIMENSIONS_STORE_UPDATE_ENDPOINT`
- `MANAGED_DIMENSIONS_STORE_GRAPH_ENDPOINT`
- `MANAGED_DIMENSIONS_STORE_USERNAME`
- `MANAGED_DIMENSIONS_STORE_PASSWORD`

