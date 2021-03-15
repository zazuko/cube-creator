# @cube-creator/core-api

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
