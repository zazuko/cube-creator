# @cube-creator/cli

## 1.10.1

### Patch Changes

- 2dd38d9f: Publishing would write data to default graph and not correct named graph

## 1.10.0

### Minor Changes

- 6423b317: Add SHACL validation of cube metadata to publishing pipeline
- a5f0e388: Option to write published cube to file (closes #756)

### Patch Changes

- a17b7d44: Fetch entire cube to file first when publishing (re #756)
- Updated dependencies [2389351f]
  - @cube-creator/model@0.1.24

## 1.9.0

### Minor Changes

- 057b114e: Job details will inform about large dimensions which had their `sh:in` removed (closes #983)

## 1.8.0

### Minor Changes

- fbab0935: Do not produce overly large RDF lists in Cube's constraint shape (fixes #966)

### Patch Changes

- dbb9eea1: Publishing: Take `cube:observedBy` value from publishing profile
- d98449ac: Use cube's "publishing organization" for cube:observedBy

## 1.7.2

### Patch Changes

- db33304e: Large `sh:in` lists in Cube shapes caused memory issues and API crashes (re #958 #959)

## 1.7.1

### Patch Changes

- 2a2cb74d: Reference columns would produce incorrect URLs when referenced columns were empty (fixes #789)

## 1.7.0

### Minor Changes

- 1bcb2035: CSV transformation: track the last processed row and display if job failed

## 1.6.5

### Patch Changes

- d68ca97a: Do not log JWT tokens in pipeline output (closes #891)
- Updated dependencies [c0338c9c]
  - @cube-creator/model@0.1.23

## 1.6.4

### Patch Changes

- Updated dependencies [2ac2dcd9]
  - @cube-creator/model@0.1.22

## 1.6.3

### Patch Changes

- fbd91be5: Remove `hydra:` terms from published cube output
- 2977eb71: Reduce superfluous data processed by publish pipeline to prevent ECONNRESET from destination server (re #756, fixes #735)
- dab5bcb2: Set up Open Telemetry

## 1.6.2

### Patch Changes

- 1717918b: Improve datatype validation message

## 1.6.1

### Patch Changes

- 4fe29c36: Publishing draft cube marked latest non-draft as expired

## 1.6.0

### Minor Changes

- 1e0a5c5a: Command to mark overdue jobs as failed (to be run periodically) (closes #790)

### Patch Changes

- bd084b85: Add job to unlist cube

## 1.5.2

### Patch Changes

- ddb70cfc: Provide links to visualize.admin.ch and lindas query UI on the published dataset (as work examples)

## 1.5.1

### Patch Changes

- 0e1f078c: Use schema:expires instead of schema:validThrough to expire cubes
- Updated dependencies [7e0f6f26]
  - @cube-creator/model@0.1.21

## 1.5.0

### Minor Changes

- b793194e: Add void dataset link to cubes published with "Published" status (re. #730)

### Patch Changes

- Updated dependencies [271cb671]
- Updated dependencies [b793194e]
- Updated dependencies [6872eb8e]
  - @cube-creator/core@0.3.3
  - @cube-creator/model@0.1.20

## 1.4.4

### Patch Changes

- ee9d6dbd: Switch to GHCR

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
