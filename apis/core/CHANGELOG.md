# @cube-creator/core-api

## 1.4.0

### Minor Changes

- 6970ccf0: Create a project by importing backed up resources

### Patch Changes

- 9273ef4c: Add SFA and SFOE organizations

## 1.3.0

### Minor Changes

- 6872eb8e: Exporting project

### Patch Changes

- 271cb671: Ability to map a CSV file hosted on a remote server via URL
- b793194e: Add void dataset link to cubes published with "Published" status (re. #730)
- Updated dependencies [271cb671]
- Updated dependencies [7ec5b557]
- Updated dependencies [b793194e]
- Updated dependencies [6872eb8e]
- Updated dependencies [ae6f3354]
  - @cube-creator/core@0.3.3
  - @cube-creator/model@0.1.20
  - @cube-creator/shared-dimensions-api@2.2.0
  - @cube-creator/api-errors@0.0.4

## 1.2.7

### Patch Changes

- 38c1d3bc: Add LINDAS contact point to dataset
- 8ecf3bc9: Add LINDAS query interface and SPARQL endpoint to dataset

## 1.2.6

### Patch Changes

- 68e85c61: Add support for very large CSV files
- ee9d6dbd: Switch to GHCR
- Updated dependencies [acf4f50d]
- Updated dependencies [800233c8]
  - @cube-creator/shared-dimensions-api@2.1.3

## 1.2.5

### Patch Changes

- ce492488: Long loading times of dimension mapping drawer

## 1.2.4

### Patch Changes

- d82750e5: Cube Designer tab failed to load for large cubes. Reworked the source queries (closes #586)

## 1.2.3

### Patch Changes

- Updated dependencies [9bcbe22e]
  - @cube-creator/shared-dimensions-api@2.1.2

## 1.2.2

### Patch Changes

- Updated dependencies [8c6c07c8]
  - @cube-creator/shared-dimensions-api@2.1.1

## 1.2.1

### Patch Changes

- 506cb9b3: Apostrophe in column names would cause CSVW to fail to generate (fixes #728)
- 8b966918: Regression: changing name of CSV Project was impossible (fixes #749)
- Updated dependencies [fb4ffc0c]
  - @cube-creator/shared-dimensions-api@2.1.0

## 1.2.0

### Minor Changes

- c68b6857: Extracted the model of import project from CSV mapping project
- fc796075: Add ImportJob type and API capability

### Patch Changes

- Updated dependencies [fc796075]
  - @cube-creator/core@0.3.2
  - @cube-creator/model@0.1.19
  - @cube-creator/api-errors@0.0.3
  - @cube-creator/shared-dimensions-api@2.0.2

## 1.1.4

### Patch Changes

- ead96fe: Add public query endpoint to API entrypoint

## 1.1.3

### Patch Changes

- Updated dependencies [10929b6]
  - @cube-creator/shared-dimensions-api@2.0.1

## 1.1.2

### Patch Changes

- dba0e25: Output canonical dimension URIs from cube transformation

## 1.1.1

### Patch Changes

- Updated dependencies [eda0757]
  - @cube-creator/shared-dimensions-api@2.0.0

## 1.1.0

### Minor Changes

- 868093e: Show more details about publish jobs:
  - cube version
  - cube status
  - "publish to" application
  - link to query the cube in Lindas

### Patch Changes

- c6d95ee: Load details of shared terms on preview panel (#685)
- Updated dependencies [fef89f5]
  - @cube-creator/shared-dimensions-api@1.1.0

## 1.0.4

### Patch Changes

- 646a9c2: Add flags to mapping to indicate key/measure dimensions
- 30c4e1d: Add dimension type (Key/Measure)
- Updated dependencies [646a9c2]
- Updated dependencies [30c4e1d]
  - @cube-creator/core@0.3.1
  - @cube-creator/model@0.1.18
  - @cube-creator/api-errors@0.0.2
  - @cube-creator/shared-dimensions-api@1.0.1

## 1.0.3

### Patch Changes

- 6928ea3: Add currencies in the list of units

## 1.0.2

### Patch Changes

- c3a08dd: Remove any previous CSV parsing error on source when replacing it with a new file (#639)

## 1.0.1

### Patch Changes

- 09f0160: Ensure that superfluous quads are remove when cube meta is saved

## 1.0.0

### Major Changes

- 535de57: First major release

### Patch Changes

- 9fbf2a0: App fails when uploading CSV files with spaces in name (#629)
- feaea43: Fix escaping issue for CSV columns with non-ascii characters (#621)
- 141151a: Fix stackoverflow (#632)
- Updated dependencies [535de57]
- Updated dependencies [3154255]
  - @cube-creator/shared-dimensions-api@1.0.0

## 0.3.1

### Patch Changes

- 1a35826: Cube Metadata: License and Category (#514)
- 060fdf2: Transform missing csv values into cube:Undefined terms (#481)
- 1a31678: Fixes a problem when saving property with uni custom defined in Lindas
- Updated dependencies [6c379b6]
- Updated dependencies [47e9609]
- Updated dependencies [68ab7e8]
- Updated dependencies [6c379b6]
- Updated dependencies [5a27616]
  - @cube-creator/shared-dimensions-api@0.3.0

## 0.3.0

### Minor Changes

- 7253116: Change the term Managed Dimension to Shared Dimension everywhere

### Patch Changes

- ec2ddbb: Project: prevent projects with same cube identifier (#549)
- bc2efae: Project: Disallow trailing slash in cube identifier
- Updated dependencies [444decc]
- Updated dependencies [7253116]
  - @cube-creator/shared-dimensions-api@0.2.0
  - @cube-creator/core@0.3.0
  - @cube-creator/api-errors@0.0.1
  - @cube-creator/model@0.1.17

## 0.2.2

### Patch Changes

- d96a3da: Transformation: pipeline would fail on fetching shared dimensions
- 6af426f: Output the default value for empty CSV cells
- fb600a6: Shared dimensions: Core API to save mappings with dimension metadata
- 8c82ec5: Do not show error when there is no cube (yet)
- Updated dependencies [bc22b24]
- Updated dependencies [fb600a6]
- Updated dependencies [876d7c0]
- Updated dependencies [3a25d90]
  - express-rdf-request@0.1.0
  - hydra-box-middleware-shacl@1.0.0
  - @cube-creator/shared-dimensions-api@0.1.0

## 0.2.1

### Patch Changes

- 0035c7d: Observations not loading on Cube Designer

## 0.2.0

### Minor Changes

- 47619a1: Vocabulary: use https://cube.link/ vocabulary (#510)

### Patch Changes

- 3574501: Metadata: use `dct:creator` for opendata.swiss publisher
- 77aa964: Redefine supported languages and their order (#393)
- 02a5b51: Metadata: added Data Kind field to dimension metadata (#490)
- 3574501: Metadata: fixed the `CreativeWorkStatus` terms (wrong case)
- 8ef5ec4: Metadata: Gram and kilogram were not available as units to select
- 3574501: Metadata: changed `dcterms:publisher` to simple text field
- Updated dependencies [47619a1]
- Updated dependencies [77aa964]
  - @cube-creator/core@0.2.0
  - @cube-creator/model@0.1.16
