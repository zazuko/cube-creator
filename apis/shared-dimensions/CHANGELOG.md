# @cube-creator/shared-dimensions-api

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
