# @cube-creator/cli

## 1.4.3

### Patch Changes

- 9c34d544: Pipeline would not fail on `ECONNRESET` fetch error (closes #782)

## 1.4.2

### Patch Changes

- 9bb6292b: Shared dimension mappings applied during cube import
- e61b013c: In some cubes the `schema:version` was not applied to dimensions (re. #776)

## 1.4.1

### Patch Changes

- b6032193: Transform: Do not produce `"undefined"` literals (fixes #754)

## 1.4.0

### Minor Changes

- 508bf91b: Import: Copy cube, observations, and cube constraint to project (closes #705)

### Patch Changes

- 9f3ed377: Publish job was not updated to show its running status
- 201bf2fd: Apply mapped datatype to default value (fixes #717)
- 1a7c09f1: Trigger import immediately when project is created (fixes #720)
- 96e363e3: Better import cube metadata

## 1.3.0

### Minor Changes

- c68b6857: Extracted the model of import project from CSV mapping project
- e1fb39e7: Add `schema:version` to versioned dimensions (closes #711)

### Patch Changes

- 40642f88: Previous cubes would not be expired if there are gaps in version numbers (re. [visualize-admin/visualization-tool#80](https://github.com/visualize-admin/visualization-tool/issues/80)
- Updated dependencies [fc796075]
  - @cube-creator/core@0.3.2
  - @cube-creator/model@0.1.19

## 1.2.2

### Patch Changes

- dba0e25: Output canonical dimension URIs from cube transformation

## 1.2.1

### Patch Changes

- ba14b68: Prevent CSV links from timing-out in transformation pipeline
- b23127b: Some dimensions were wrongly marked as cube:SharedDimension

## 1.2.0

### Minor Changes

- ad69ec8: Add schema:sameAs to versioned "concept objects" (#658)

### Patch Changes

- 6216a06: Add type cube:SharedDimension to mapped dimensions
- Updated dependencies [646a9c2]
- Updated dependencies [30c4e1d]
  - @cube-creator/core@0.3.1
  - @cube-creator/model@0.1.18

## 1.1.0

### Minor Changes

- c6e10d8: Use temporary file before uploading to store

## 1.0.1

### Patch Changes

- 4f4b519: Revert incorrect import

## 1.0.0

### Major Changes

- 535de57: First major release

### Patch Changes

- 4ce6e97: Cube: do not generate sh:in for ""^^cube:Undefined literals
- 7024c73: fix(api): `xsd:gDay` and `xsd:gMonth` should produce dimension metadata with min/max range
- 4ce6e97: Cube: output contraint range for xsd:dateTime

## 0.1.19

### Patch Changes

- 060fdf2: Transform missing csv values into cube:Undefined terms (#481)
- 4598093: Validate datatype of produced quads (#561)

## 0.1.18

### Patch Changes

- 2a63dd9: Generate min/max shape constraints for xsd:int dimensions (#570)
- 7253116: Change the term Managed Dimension to Shared Dimension everywhere
- Updated dependencies [7253116]
  - @cube-creator/core@0.3.0
  - @cube-creator/model@0.1.17

## 0.1.17

### Patch Changes

- c0ce41d: Do not load any API resource twice
- 6af426f: Output the default value for empty CSV cells
- fb600a6: Shared dimensions: apply mappings during transformation
- 39fc196: Improve error message when dimension meta fails to load

## 0.1.16

### Patch Changes

- 4f3d08b: Publishing: ensure blank nodes do not clash in published graph (#494)
- Updated dependencies [47619a1]
- Updated dependencies [77aa964]
  - @cube-creator/core@0.2.0
  - @cube-creator/model@0.1.16
