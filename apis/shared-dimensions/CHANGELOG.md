# @cube-creator/shared-dimensions-api

## 3.3.0

### Minor Changes

- 48f3f2c: Added I14Y properties to Shared Dimensions (re https://gitlab.ldbar.ch/zazuko/misc/-/issues/195)
- 1fe9ee2: Searching and paging Shared Dimensions
- cb0abb1: Hierarchies can now exist in any graph in Lindas

### Patch Changes

- 2d4d9d1: Added `Contributors` to shared dimension

## 3.2.0

### Minor Changes

- 47b072a: Choose validation profile based on publishing target

### Patch Changes

- eb83409: Querying hierarchies could cause `414 (URI Too Long)` error (re #1544)

## 3.1.0

### Minor Changes

- 88f2cbb: Improve loading speed of Shared Dimensions in UI (closes #1509)
- 88f2cbb: Shared dimensions are now searchable and paginated in search results on dimension mapping and hierarchy screens (re #1509, closes #1481)

### Patch Changes

- 78de1cd: Correct links to shared dimension terms (fixes #1498)

## 3.0.4

### Patch Changes

- 090df410: Fixes a problem with shared dimension terms not appearing when they did not have the type `schema:DefinedTerm` as was the case with municipalities

## 3.0.3

### Patch Changes

- 5a3ead58: Missing functionality for search when selecting Shared Dimension terms in dynamic properties (fixes #1450)
- a9caebfd: Added a better validation message to literal column's datatype (fixes #1434)

## 3.0.2

### Patch Changes

- 4f98fed7: Shared dimension terms could not be found if they contained an apostrophe (fixes #1435)
- 52daab58: Improve performance of shared terms query (fixes #1432)

## 3.0.1

### Patch Changes

- bb8d1fc2: Allow upper case letters in share dimensions (fixes #1386)

## 3.0.0

### Major Changes

- df579c67: Deep refactoring of the internals of shared dimensions data storage
  fixes #1288 fixes #1276

  This is a big change which requires manual, one-time update of the shared dimensions graph:

  1. Export data-only using prepared queries (see PR #1357)
  2. Clear shared dimensions graph
  3. Upload exported data
  4. Restart api

## 2.7.0

### Minor Changes

- 537106b3: Added abbreviation property to Shared Dimensions (closes #1321)

### Patch Changes

- 66006fc8: Allow underscores in shared dimension identifiers (fixes #1319)

## 2.6.11

### Patch Changes

- b9069bfb: When editing some shared dimension terms, the form would not load (fixes #1276)

## 2.6.10

### Patch Changes

- Updated dependencies [8ef2b8b4]
  - @cube-creator/core@1.0.0
  - @cube-creator/api-errors@0.0.6

## 2.6.9

### Patch Changes

- c1819825: Problems with forms in Shared Dimensions (fixes #1233)

## 2.6.8

### Patch Changes

- 15b15b12: Improve shared dimension editing experience

## 2.6.7

### Patch Changes

- 985a863f: Further reduce the Shared Dimension export query (re #1184)

## 2.6.6

### Patch Changes

- 382bd415: Hierarchy roots would be shown in wrong domain (cube-creator instead of `ld.admin.ch`)

## 2.6.5

### Patch Changes

- 360ee49e: Hierarchies instantiated in cubes would show in the list (fixes #1202)

## 2.6.4

### Patch Changes

- 25c1260a: Security: update node-forge
- d5e95a6a: `Payload too large` when exporting shared dimensions (fixes #1184)

## 2.6.3

### Patch Changes

- ccc3116c: When editing a hierarchy, no properties would show for dimensions defined inside Cube Creator

## 2.6.2

### Patch Changes

- bffaa5e2: Security: update dependency `minimist`

## 2.6.1

### Patch Changes

- cadcaa37: Missing ability to actually create a new hierarchy
- 1c358a03: Display shared dimension name when mapping terms (closes #1112)
- b1e11a9d: List of hierarchies would show instances used in individual cubes

## 2.6.0

### Minor Changes

- 75d4b4b2: Added hierarchies API

## 2.5.3

### Patch Changes

- 37a8a356: Allow mapping dimension to multiple shared dimensions

## 2.5.2

### Patch Changes

- f3303abf: Fix missing prefix in Stardog-specific query (fixes #1050)
- Updated dependencies [b01ca6d7]
  - @cube-creator/core@0.3.4
  - @cube-creator/api-errors@0.0.5

## 2.5.1

### Patch Changes

- 3d9464b3: The shared dimension API would query the store ineffectively, ultimately preventing the server from starting
- f492fb44: Editing shared dimensions was not working
- 044c46be: Optimize full-text query when mapping shared dimension terms (closes #1050)

## 2.5.0

### Minor Changes

- 796eec17: Add flag to allow multiple values of dynamic property (re #1024)
- 615cee07: Add URI type to dynamic property (re #1024)
- d5fb5838: Add "lang string" type of dynamic property (re #1024)

## 2.4.2

### Patch Changes

- 1734d838: Move dimension dynamic properties to separate tabs

## 2.4.1

### Patch Changes

- d9db7ae0: Once saved, numbers would fail validation on subsequent edits (fixes #982)
- bb6469bf: Add Shared Dimension term canonical URI when retrieving single term

## 2.4.0

### Minor Changes

- d36febf6: Add dynamic properties to Shared Dimension Terms (closes #939)
- 32afda97: Defining custom properties for shared dimension terms (closes #939)

### Patch Changes

- 649f353c: It was possible to save a dynamic property with both datatype and class selected
- d93fad65: Simplifies the Shared Dimension export to not include the SHACL shapes and resolve the `Every term and term set must have a shape` error on import
- Updated dependencies [d36febf6]
  - hydra-box-middleware-shacl@1.1.0

## 2.3.2

### Patch Changes

- 424009b9: Add pagination to shared dimension terms (close #936)

## 2.3.1

### Patch Changes

- cf174afb: Shared Dimension could not have been imported (fixes #871)
- 6268e069: Minimize the exported trig of a Shared Dimension (re #912)
- 86396403: Shared term identifiers would fail validation on import (re #912)

## 2.3.0

### Minor Changes

- 227a5743: Shared dimension import (closes #814)

### Patch Changes

- dcca674b: Validation would not fire when creating shared dimension

## 2.2.0

### Minor Changes

- 7ec5b557: Add API resource to export entire shared dimension

### Patch Changes

- ae6f3354: Remove ignored properties when saving shared dimension
- Updated dependencies [271cb671]
- Updated dependencies [6872eb8e]
  - @cube-creator/core@0.3.3
  - @cube-creator/api-errors@0.0.4

## 2.1.3

### Patch Changes

- acf4f50d: Only load 10 shared terms when mapping
- 800233c8: Displaying the canonical term URI on Shared Dimension screen (closes #787)

## 2.1.2

### Patch Changes

- 9bcbe22e: Techy: resources are stored without any blank nodes to avoid conflicts

## 2.1.1

### Patch Changes

- 8c6c07c8: Techy: improve read/write of shared dimensions terms

## 2.1.0

### Minor Changes

- fb4ffc0c: Add free-text search to the dimension terms collection

## 2.0.2

### Patch Changes

- Updated dependencies [fc796075]
  - @cube-creator/core@0.3.2
  - @cube-creator/api-errors@0.0.3

## 2.0.1

### Patch Changes

- 10929b6: Saving shared dimension would leave multiple "default metadata"

## 2.0.0

### Major Changes

- eda0757: Extends configuration to store shared dimensions using a different base URL

  - The API is served and consumer by the app on URL configured by `MANAGED_DIMENSIONS_API_BASE`
  - All resources are saved using a different base URL `MANAGED_DIMENSIONS_BASE`

## 1.1.0

### Minor Changes

- fef89f5: Split configuration to generate defined terms in any arbitrary namespace

## 1.0.1

### Patch Changes

- Updated dependencies [646a9c2]
  - @cube-creator/core@0.3.1
  - @cube-creator/api-errors@0.0.2

## 1.0.0

### Major Changes

- 535de57: First major release

### Patch Changes

- 3154255: Ability to edit Shared Dimension and Cube Metadata as raw RDF

## 0.3.0

### Minor Changes

- 68ab7e8: Change the resoure naming scheme

### Patch Changes

- 6c379b6: Add schema:validThrough to Shared Dimension
- 47e9609: Create shared dimension URIs from user-provided identifier
- 6c379b6: Allow modifying Shared Dimensions
- 5a27616: Various fixes for Shared Dimensions

## 0.2.0

### Minor Changes

- 7253116: Change the term Managed Dimension to Shared Dimension everywhere

### Patch Changes

- 444decc: Deleting shared dimensions and terms
- Updated dependencies [7253116]
  - @cube-creator/core@0.3.0
  - @cube-creator/api-errors@0.0.1

## 0.1.0

### Minor Changes

- fb600a6: Shared dimensions: first version - read-only dimensions API
- 876d7c0: Creating new shared dimension (schema:DefinedTermSet) (#418)
- 3a25d90: Endpoint to create shared dimension terms

### Patch Changes

- Updated dependencies [bc22b24]
  - hydra-box-middleware-shacl@1.0.0
