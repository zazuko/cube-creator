# @cube-creator/cli

## 4.1.1

### Patch Changes

- Updated dependencies [9fbee49]
  - @cube-creator/model@0.2.1

## 4.1.0

### Minor Changes

- 47b072a: Choose validation profile based on publishing target

### Patch Changes

- 1d179e2: Re-enable validation of RDF Lists in publishing pipeline
- 0241dbd: Fix: set correct `cube:observedBy` during transform
- 5e6e9a6: fix: missing shape files in docker image caused Publish pipeline to fail
- Updated dependencies [0241dbd]
- Updated dependencies [47b072a]
  - @cube-creator/model@0.2.0

## 4.0.0

### Major Changes

- a7c3681: Using `barnard59-cube` for constructing the cube constraint shape (closes #1469, closes #1470)

### Patch Changes

- 2302932: Avoid duplicate datePublished on first revision
- 3050844: Update barnard59 packages:
  - barnard59 1.1.0 => 5.0.1
  - barnard59-base 1.1.0 => 2.4.2
  - barnard59-formats 1.1.0 => 2.1.1
  - barnard59-graph-store 1.0.0 => 5.1.2
  - barnard59-http 1.1.1 => 2.0.0
  - barnard59-rdf 1.0.0 => 3.4.0
  - barnard59-validate-shacl 0.3.0 => barnard59-shacl 1.4.5
- 3050844: Use package barnard59-cube
- aba5441: Improve error messages and prevent mixing language and datatype
- 4e1345d: Empty lines will be ignored when parsing CSVs (fixes #1495)
- 4e1345d: Whitespace will be trimmed from CSV headers. A message will be displayed to the user in that case. (fixes #1232)

## 3.0.0

### Major Changes

- 20676f48: Use [cube.link shapes](https://github.com/zazuko/cube-link/tree/main/validation) for validation

### Patch Changes

- 259b48be: Add `qudt:hasUnit` in addition to `qudt:unit`. The former will be removed in a future version (see #1473)
  Closes #1440
  Re https://gitlab.ldbar.ch/bafu/visualize/-/issues/562

## 2.0.11

### Patch Changes

- e9046fcd: Update async

## 2.0.10

### Patch Changes

- 5aff4739: Mapping dimensions would not work when the dimension values were typed literals (re #1413)

## 2.0.9

### Patch Changes

- c921176a: Add a metric counting quads produced from the `transform` pipeline

## 2.0.8

### Patch Changes

- 91483e47: When publishing fails, include a link to [SHACL Playground](https://shacl-playground.zazuko.com/), allowing to inspect the SHACL report
- 38a01143: Pipeline traces were not showing in jeager
- ed04ae13: After upgrade to Stardog 8.2.2 publication would fail (fixes #1382)

## 2.0.7

### Patch Changes

- 42dbf60f: When cube upload fails, print the server response to job logs (fixes #1362)

## 2.0.6

### Patch Changes

- c181c776: Updated [luxon](https://github.com/moment/luxon)

## 2.0.5

### Patch Changes

- 839bf93e: Fixes transformations failing when there is a large nominal dimension with many unmapped value. In such case, the pipeline should only request those mappings which are complete key/value pairs (closes #1328)

## 2.0.4

### Patch Changes

- 1c90c035: Bump version to trigger release

## 2.0.3

### Patch Changes

- 7b689c27: Message was linking to an old documentation page which no longer exists (fixes #1292)
- d354f436: Show response when job update fails from timeout job

## 2.0.2

### Patch Changes

- 7247edae: Add `foaf:topic` to cube's void resource (closes #1240)

## 2.0.1

### Patch Changes

- c382d6b6: Timeout pipeline skipped jobs which never actually started (or were never marked as such). This caused dangling jobs with blinking status
- 87dd73e6: Add dedicated status for timed-out jobs and show them differently in the UI

## 2.0.0

### Major Changes

- 8ef2b8b4: Align usages of `https://cube.link/meta/` namespace with its vocabulary

  This release will require existing cubes to be updated!

  ### `meta:StandardDeviation`

  In previous version, there was a typo in this term. To update existing cubes execute a SPARQL Update:

  ```sparql
  PREFIX relation: <https://cube.link/relation/>

  DELETE {
      graph ?g {
          ?s ?p relation:StandarDeviation
      }
  }
  INSERT {
      graph ?g {
          ?s ?p relation:StandardDeviation
      }
  }
  WHERE {
     graph ?g {
         ?s ?p relation:StandarDeviation
     }
  }
  ```

  ### `meta:inHierarchy`

  Until now, Cube Creator published with an incorrect property. Existing cubes may want to add the correct predicate, keeping the old one too for the sake of current consumers:

  ```sparql
  PREFIX meta: <https://cube.link/meta/>

  INSERT {
      graph ?g {
          ?s meta:inHierarchy ?o
      }
  }
  WHERE {
     graph ?g {
         ?s meta:hasHierarchy ?o
     }
  }
  ```

### Patch Changes

- 8ef2b8b4: Published cubes used an incorrect property `meta:hasDimension` (closes #1243)
- 060b1482: Incorrect validation message; mentioned wrong predicate (re #1258)
- 2f0ee4df: Unstarted jobs would not be marked as failed after timeout (fixes #1250)
- Updated dependencies [8ef2b8b4]
  - @cube-creator/core@1.0.0
  - @cube-creator/model@0.1.27

## 1.10.12

### Patch Changes

- 0aeed8f9: Some cubes failed to pass validation on publishing because dimension metadata would be loaded incomplete (fixes #1252)

## 1.10.11

### Patch Changes

- 8fafbb07: Publishing was failing due to change in newer version of curl

## 1.10.10

### Patch Changes

- 5903bfee: Conflicting `curl` parameters caused a warning in pipeline

## 1.10.9

### Patch Changes

- b6f2d73e: Prettier SHACL Report in pipeline output
- 550a1ca0: Publishing would fail validation when dimension had a hierarchy

## 1.10.8

### Patch Changes

- a9a9cd6f: When published, cube properties would have incomplete `sh:or` list of datatype alternatives (fixes #1189)

## 1.10.7

### Patch Changes

- 68909bd9: Upload published cube as Turtle (mitigates an issue where Stardog parses blank nodes wrong)
- 25c1260a: Security: update node-forge

## 1.10.6

### Patch Changes

- 2e4a3512: Save cube creator versions (API and pipeline) to the published cube (closes #1088)
- bffaa5e2: Security: update dependency `minimist`

## 1.10.5

### Patch Changes

- ced0132b: Optional flag to skip updating job resource

## 1.10.4

### Patch Changes

- 78f12155: Fail publish job when store upload fails (fixes #1086)
- f692f023: Publish pipeline interrupted after download cube (fixes #1110)

## 1.10.3

### Patch Changes

- Updated dependencies [3c4ca273]
  - @cube-creator/model@0.1.26

## 1.10.2

### Patch Changes

- f46844fc: Stardog would refuse job update because shape ids were relative
- a227b86b: Some cubes were published with a second resource, wrongly ending with a `/`
- b01ca6d7: Store SHACL validation error for publication jobs and display it in the UI
- Updated dependencies [b01ca6d7]
  - @cube-creator/core@0.3.4
  - @cube-creator/model@0.1.25

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
