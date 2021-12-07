# @cube-creator/shared-dimensions-api

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
