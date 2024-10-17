# @cube-creator/core-api

## 2.4.0

### Minor Changes

- 47b072a: Choose validation profile based on publishing target
- 1b02005: Added resources to Opendata.swiss cube metadata (`dcat:Distribution`). re https://gitlab.ldbar.ch/bafu/visualize/-/issues/560

### Patch Changes

- 0241dbd: Fix: set correct `cube:observedBy` during transform
- Updated dependencies [eb83409]
- Updated dependencies [0241dbd]
- Updated dependencies [47b072a]
  - @cube-creator/shared-dimensions-api@3.2.0
  - @cube-creator/model@0.2.0

## 2.3.5

### Patch Changes

- 4e1345d: Updates `csv-parse` to v5
- 2302932: Avoid duplicate datePublished on first revision
- 8d5e92b: Fix transformation of invalid dates
- Updated dependencies [88f2cbb]
- Updated dependencies [78de1cd]
- Updated dependencies [88f2cbb]
  - @cube-creator/shared-dimensions-api@3.1.0

## 2.3.4

### Patch Changes

- 54994019: Added organization for Federal Administration Training Centre

## 2.3.3

### Patch Changes

- 871d44fd: Currencies were not listed for selection in units dimension metadata (fixes #1463) (re https://gitlab.ldbar.ch/zazuko/misc/-/issues/162)

## 2.3.2

### Patch Changes

- Updated dependencies [090df410]
  - @cube-creator/shared-dimensions-api@3.0.4

## 2.3.1

### Patch Changes

- 509f4e02: Reduce memory usage which would cause high memory spikes when saving large dimensions mappings (fixes #1444)
- fd24cb05: Improve performace of the dimension mapping screen (re #1442)
- fd24cb05: Mapping would not work when dimension is mapped to a datatype other than string (re #1444)
- Updated dependencies [5a3ead58]
- Updated dependencies [a9caebfd]
  - @cube-creator/shared-dimensions-api@3.0.3

## 2.3.0

### Minor Changes

- 3b17aac1: The "Author" field on project list is now searchable (re #1403)

### Patch Changes

- 509f7599: Disabled individual clear buttons on project search
- 83e83257: Update AWS SDK
- Updated dependencies [4f98fed7]
- Updated dependencies [52daab58]
  - @cube-creator/shared-dimensions-api@3.0.2

## 2.2.6

### Patch Changes

- 00e96fb9: Unit combobox in dimension metadata is now searchable (re #1401)
- 038b3505: When dimension was mapped automatically, the warning was not shown instructing the user to transform
- 351b7426: When dimension mapping entries were only removed but not added, the cube warning would not have been displayed (fixes #1413)
- 6f03fac1: Added profile for Federal Office of Communications (OFCOM)
- a15bf3d2: Users in project search form were randomly ordered (re #1403)
- 93fb6869: Prevent the creation of multiple cube tables (closes #1391)
- 972e34e4: Sort Shared Dimensions by labels in select boxes (re #1401)
- 3de7a975: Added profiles for [FSVO](https://www.blv.admin.ch/) and [FOCA](https://www.bazl.admin.ch/)
- 48b85275: When dimension mappings were removed, `<> a prov:Entity` were not cleaned up (fixes #1314)
- 7617575a: Publishing is not prevented when the project does not have exactly one cube (closes #1404)

## 2.2.5

### Patch Changes

- fad7127a: Improve insert performance of new dimension mappings (re #1398)

## 2.2.4

### Patch Changes

- 602f7c0e: Update moment-timezone

## 2.2.3

### Patch Changes

- 2de8d5cd: Auto-mapping dimensions fails when the cross product of unmapped terms and shared dimension terms is sufficiently large (fixes #1372)
- 4b7989ed: When creating an output table from multiple columns, it was possible for multiple columns to assume same `target property`, which resulted in a broken cube (fixes #1365)
- Updated dependencies [bb8d1fc2]
  - @cube-creator/shared-dimensions-api@3.0.1

## 2.2.2

### Patch Changes

- ace57340: When importing a project, validate that column mappings are correct (re #1366)
- 5a7262e9: When editing a project, the form would inadvertently remove the value of Cube Identifier, even though it remained filled in the input control (re #1365)
- Updated dependencies [df579c67]
  - @cube-creator/shared-dimensions-api@3.0.0

## 2.2.1

### Patch Changes

- c181c776: Updated [luxon](https://github.com/moment/luxon)
- 5cb550e6: Updated `express` and `@uppy` packages
- 0a018397: Update JWT auth packages

## 2.2.0

### Minor Changes

- 49d8bddf: Added Agroscope publishing profile

### Patch Changes

- 45427607: Possible fix for the failing requests to get dimension mapping of a large dimension (re #1288)
- 839bf93e: Fixes transformations failing when there is a large nominal dimension with many unmapped value. In such case, the pipeline should only request those mappings which are complete key/value pairs (closes #1328)
- 92191ca1: The possibility to clear dropdowns in project search without clearing entire form (fixes #1341)

## 2.1.0

### Minor Changes

- fb7eaed5: Project search functionality (fixes #1326)

### Patch Changes

- f72fcb57: Added new fields to cube metadata:

  - `Planned update https://schema.ld.admin.ch/datasetNextDateModified>`
  - `Abbreviation <schema:alternateName>`
  - `Subtitle <schema:disambiguatingDescription>`

  closes #1324

- 7ed36318: Updated help text for metadata fields "Title", "Abbreviation", "Subtitle" and "Planned update"
- 492ff51b: Use updated scheme for Visualize links (re #1335)
- Updated dependencies [537106b3]
- Updated dependencies [66006fc8]
  - @cube-creator/shared-dimensions-api@2.7.0

## 2.0.5

### Patch Changes

- 4bc9e629: Cube errors were not cleared as expected after transformation (fixes #1290)
- e4c83bbf: Prevent cube warnings without any text from appearing
- ebcc1f2c: Update job would fail when updating to status "canceled" (fixes #1295)

## 2.0.4

### Patch Changes

- b1ef5df8: Reduce the size of the API image

## 2.0.3

### Patch Changes

- Updated dependencies [b9069bfb]
  - @cube-creator/shared-dimensions-api@2.6.11

## 2.0.2

### Patch Changes

- 81099d79: Improve performance of queries, particularly the loading of projects list (fixes #1281)

## 2.0.1

### Patch Changes

- ef54be5b: Fix slowness of most requests caused by a runaway query which grew alongside growing database (fixes #1265 fixes #1235)
- 863a98db: Triggering publish multiple times should cancel running jobs for same version (fixes #1218)

  To configure, two new environment variables are necessary (see readme in `apis/core`)

  - `GITLAB_TOKEN`
  - `GITLAB_API_URL`

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

### Minor Changes

- dd131763: Add minimal validation of imported project (closes #1227)

### Patch Changes

- Updated dependencies [8ef2b8b4]
  - @cube-creator/core@1.0.0
  - @cube-creator/api-errors@0.0.6
  - @cube-creator/shared-dimensions-api@2.6.10
  - @cube-creator/model@0.1.27

## 1.12.3

### Patch Changes

- Updated dependencies [c1819825]
  - @cube-creator/shared-dimensions-api@2.6.9

## 1.12.2

### Patch Changes

- b361613f: Removing a project would leave some leftover graphs
- 612c5008: Dimension mappings would not have been deleted when column mapping is deleted
- 3e180365: Add a message to cube designer when a dimension mapping changes to alert users that transformation may be required
- Updated dependencies [15b15b12]
  - @cube-creator/shared-dimensions-api@2.6.8

## 1.12.1

### Patch Changes

- 5d0615bc: Dimension auto-mapping would not work for shared dimensions managed by cube creator

## 1.12.0

### Minor Changes

- 25dc8fd3: Importing dimension mappings from shared dimension

### Patch Changes

- a877a5a1: `Identifier template:auto` would not produce the expected observations (fixes #1187)
- 2182c7bb: Remove `applyMappings` box from dimension mapping form
- Updated dependencies [985a863f]
  - @cube-creator/shared-dimensions-api@2.6.7

## 1.11.2

### Patch Changes

- 443f5e3f: Cube hierarchy could not be saved it had multiple roots
- 811aa261: Cube's hierarchy must only have a single RDF type `meta:Hierarchy`

## 1.11.1

### Patch Changes

- Updated dependencies [382bd415]
  - @cube-creator/shared-dimensions-api@2.6.6

## 1.11.0

### Minor Changes

- 65ffaeb9: Enable `xsd:gYearMonth` for selection in column mapping (re #1199)

### Patch Changes

- cb61e810: Labels would not show in mapping screen dropdowns
- Updated dependencies [360ee49e]
  - @cube-creator/shared-dimensions-api@2.6.5

## 1.10.3

### Patch Changes

- 02222a05: Remove Dimension type from reference column mapping (closes #1167)
- fde464ee: Update redis (fixes vulnerability GHSL-2021-026)
- 56973c51: External CSV source URLs missing from project export (closes #1188)
- 25c1260a: Security: update node-forge
- 7a82067b: Update moment
- Updated dependencies [25c1260a]
- Updated dependencies [d5e95a6a]
  - @cube-creator/shared-dimensions-api@2.6.4

## 1.10.2

### Patch Changes

- Updated dependencies [ccc3116c]
  - @cube-creator/shared-dimensions-api@2.6.3

## 1.10.1

### Patch Changes

- 2e4a3512: Expose API version in a header
- bffaa5e2: Security: update dependency `minimist`
- Updated dependencies [bffaa5e2]
  - @cube-creator/shared-dimensions-api@2.6.2

## 1.10.0

### Minor Changes

- 1cdb8955: Add hierarchy tab to dimension metadata

### Patch Changes

- 1c358a03: Display shared dimension name when mapping terms (closes #1112)
- ee67e33f: Improve some forms (cube metadata, shared dimensions, table, column mapping)
- Updated dependencies [cadcaa37]
- Updated dependencies [1c358a03]
- Updated dependencies [b1e11a9d]
  - @cube-creator/shared-dimensions-api@2.6.1

## 1.9.7

### Patch Changes

- 9ef0fee6: Do not set identifier to cube metadata. This prevents validation errors on publish in case when the identifier is changed in Project settings but metadata would not be synchronized. It is redundant anyway, thus only the project value will be kept (fixes #1092)
- Updated dependencies [75d4b4b2]
  - @cube-creator/shared-dimensions-api@2.6.0

## 1.9.6

### Patch Changes

- 37a8a356: Allow mapping dimension to multiple shared dimensions
- Updated dependencies [37a8a356]
  - @cube-creator/shared-dimensions-api@2.5.3

## 1.9.5

### Patch Changes

- 5187bcd1: In some cases a column was wrongly marked as key or measure dimension in the Cube Designer view (fixes #1097)

## 1.9.4

### Patch Changes

- Updated dependencies [3c4ca273]
  - @cube-creator/model@0.1.26

## 1.9.3

### Patch Changes

- Updated dependencies [f3303abf]
- Updated dependencies [b01ca6d7]
  - @cube-creator/shared-dimensions-api@2.5.2
  - @cube-creator/core@0.3.4
  - @cube-creator/model@0.1.25
  - @cube-creator/api-errors@0.0.5

## 1.9.2

### Patch Changes

- 9983dcce: Fix transformation failing after changing the property of a CSV column mapping (fixes #1052)
- Updated dependencies [3d9464b3]
- Updated dependencies [f492fb44]
- Updated dependencies [044c46be]
  - @cube-creator/shared-dimensions-api@2.5.1

## 1.9.1

### Patch Changes

- 7dd95684: Apply S3 bucket CORS on app start (closes #797)
- 3099a573: Add Dataset EU Theme Category (closes #1005)
- 7cc573cf: Provide total number of observations
- 2389351f: Add `sh:order` property on dimensions to manually define their ordering (closes #987)
- 3009112b: Updated SPARQL endpoint links in organization profiles
- Updated dependencies [796eec17]
- Updated dependencies [2389351f]
- Updated dependencies [615cee07]
- Updated dependencies [d5fb5838]
  - @cube-creator/shared-dimensions-api@2.5.0
  - @cube-creator/model@0.1.24

## 1.9.0

### Minor Changes

- fe649f90: Prevent changing of identifiers of published projects (closes #909)
- 057b114e: Job details will inform about large dimensions which had their `sh:in` removed (closes #983)

### Patch Changes

- 5cd11bce: Security: updated [jwks-rsa](https://npm.im/jwks-rsa)
- 4f8325ec: Use EU frequencies instead of Dublin Core (fixes #1003)
- e2f45762: Performance: Optimize queries loading resources
- 229e61a8: Add a way to define relations between dimensions (fixes #1000)
- 9aa45315: Make CSV delimiter and quote char optional (fixes #968)
- Updated dependencies [1734d838]
  - @cube-creator/shared-dimensions-api@2.4.2

## 1.8.0

### Minor Changes

- 80057116: Show a warning when there are observations with multiple dimension values. This usually indicates that the observation identifiers are not unique (closes #949)

### Patch Changes

- d9db7ae0: Once saved, numbers would fail validation on subsequent edits (fixes #982)
- 0e41e837: Use new visualize link URL (closes #997)
- c13f5ffc: Inform on Cube Designer that dimension kind has default value (re #920)
- b336a7af: Provide nested validation results (Closes #947)
- 723fde83: When projects were imported in same environment, newly uploaded CSVs would remove the originals exported project. (fixes #861)
- Updated dependencies [d9db7ae0]
- Updated dependencies [bb6469bf]
  - @cube-creator/shared-dimensions-api@2.4.1

## 1.7.0

### Minor Changes

- d16d7f15: Show Cube Designer warning when observations have missing values (`cube:Undefined`) (closes #948)

### Patch Changes

- ece39d6b: Use schema:contactPoint instead of lindas:contactPoint
- d98449ac: Use cube's "publishing organization" for cube:observedBy
- Updated dependencies [d36febf6]
- Updated dependencies [649f353c]
- Updated dependencies [d36febf6]
- Updated dependencies [d93fad65]
- Updated dependencies [32afda97]
  - @cube-creator/shared-dimensions-api@2.4.0
  - hydra-box-middleware-shacl@1.1.0

## 1.6.2

### Patch Changes

- db33304e: Large `sh:in` lists in Cube shapes caused memory issues and API crashes (re #958 #959)
- 39d7d621: Display Cube Designer errors sourced from dataset and metadata resources

## 1.6.1

### Patch Changes

- aeb18c66: Resource updates sometimes time out (fixes #943)
- 9a5668f9: Use dcterms:license to define dataset legal basis and switch to dcterms:rights to define copyright license
- fa79d387: Performance boost for some requests (project details, metadata, export)
- 2a2cb74d: Reference columns would produce incorrect URLs when referenced columns were empty (fixes #789)
- Updated dependencies [424009b9]
  - @cube-creator/shared-dimensions-api@2.3.2

## 1.6.0

### Minor Changes

- 922698f6: Keep activity log of all resource changes
- 531971fc: Add endpoint with project details

### Patch Changes

- 3f2f0f23: Project import would add an unwanted trailing slash to cube URI (fixes #910)
- 5c24f6c1: More informative error when update of dimension mapping fails
- Updated dependencies [cf174afb]
- Updated dependencies [6268e069]
- Updated dependencies [86396403]
  - @cube-creator/shared-dimensions-api@2.3.1

## 1.5.2

### Patch Changes

- c0338c9c: Literal `schema:error` would fail on resource getter (re #897)
- 0c974e2f: In some scenarios not all form translations were saved when adding metadata (fixes #893)
- Updated dependencies [c0338c9c]
  - @cube-creator/model@0.1.23

## 1.5.1

### Patch Changes

- 2ac2dcd9: When table identifier changes, reference columns kept outdated mappings (fixes #862)
- Updated dependencies [2ac2dcd9]
  - @cube-creator/model@0.1.22

## 1.5.0

### Minor Changes

- ee9e7717: Option to change the identifier of imported project (fixes #878)

### Patch Changes

- ee9e7717: Import: Ensure that all cube-related URIs are correct if a different organization profile is selected when importing

## 1.4.4

### Patch Changes

- 8a907d47: Deleting project was impossible if some resources were missing (fixes #660)
- b10b03a9: Projects with dimension mappings would fail to transform after changing organization or cube identifier (fixes #870, fixes #879)

## 1.4.3

### Patch Changes

- 68f9b917: Drop legacy cube statuses

## 1.4.2

### Patch Changes

- bd084b85: Add job to unlist cube

## 1.4.1

### Patch Changes

- e6b9d882: Fix saving cube metadata
- e05525ae: Projects became impossible to save (fixes #839, fixes #857)
- b47905ec: Allow specifying language of opendata.swiss keywords
- 4b1d224c: Project with error messages on its CSV sources would fail to load after import
- 09a95f09: CSV upload failed to parse files with Windows line endings (fixes #840)
- Updated dependencies [227a5743]
- Updated dependencies [dcca674b]
- Updated dependencies [7e0f6f26]
  - @cube-creator/shared-dimensions-api@2.3.0
  - @cube-creator/model@0.1.21

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
