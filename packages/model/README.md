# @cube-curator/model

This package defines strongly-typed interfaces for all our resources. Most of those interface+class pairs represents an atomic resource (à la DDD's [Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).

This means that any such resource is self-contained as a single representation (when dereferenced from the API) as well as stored in a single Named Graph; always updated as a whole.

## Embedded resources

An aggregate does not have to be a single resource but a also deep graph. The associated resources can be accessible through the interfaces as resource objects. One such example is the `CsvSource` which directly embeds the CSVW Dialect and the `schema:MediaObject` resource of the uploaded file:

```typescript
export interface CsvSource extends RdfResourceCore {
  associatedMedia: Schema.MediaObject
  name: string
  dialect: Csvw.Dialect
}
```

## Linked resources

On the other hand, some resources will only be linked to others. This means that additional triples about the link target are not desired in the "parent's" graph.

An example of this is the `CsvMapping` which has a link to the table collection but its graph contains no information about the collection itself. The link could be a `NamedNode` but for better coding experience a `Link` type can be used to have direct access to a strongly-type `Load` method.

```typescript
export interface CsvMapping extends RdfResourceCore {
  // only a link
  tableCollection: Link<TableCollection>
}
```

This way the resource will be directly dereferencable when `alcaeus` is used:

```typescript
const mapping: CsvMapping

const tableCollection = await mapping.tableCollection.load()
```
