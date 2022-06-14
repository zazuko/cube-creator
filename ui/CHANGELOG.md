# @cube-creator/ui

## 1.12.2

### Patch Changes

- 15b15b12: Improve shared dimension editing experience

## 1.12.1

### Patch Changes

- 78cb647d: Put button to import mapping at the bottom

## 1.12.0

### Minor Changes

- 25dc8fd3: Importing dimension mappings from shared dimension

### Patch Changes

- ce8fdcf6: Add paging to dimension mapping screen

## 1.11.2

### Patch Changes

- 811aa261: Cube's hierarchy must only have a single RDF type `meta:Hierarchy`

## 1.11.1

### Patch Changes

- c1ad0eb0: Hierarchy Form would freeze when adding roots

## 1.11.0

### Minor Changes

- 8f7ad191: Auto-fill and select URL when updating external CSV source (fixes #1188)

### Patch Changes

- 5b89e307: Inverse path would show all child resources when expanded on the hierarchy screen
- 979a6808: Hierarchy preview: labels were not shown unless an English translation was present (fixes #1178)
- 89b75aa9: Remove roots listed in the hierarchy definition
- 64bba989: Shared dimension import would not work (fixes #1180)
- fde464ee: Update redis (fixes vulnerability GHSL-2021-026)
- f3e62e58: New hierarchy: toggling the "inverse" checkbox would stop working until a property was selected
- 25c1260a: Security: update node-forge
- 7e1e9a64: On some forms, switching tabs would immediately revert to the first tab (fixes #1177)

## 1.10.2

### Patch Changes

- 3e8b3b0a: Add link to open hierarchy terms externally
- bae3f28c: Hierarchy levels with direct path would not exapnd in preview
- f5788c13: Dedicated page with hierarchy preview (closes #1134)
- 00f2e5ae: Fix column mapping form error handling (fixes #1165)
- bffaa5e2: Security: update dependency `minimist`

## 1.10.1

### Patch Changes

- 8ae265cf: Fix issue with Transform and Publish buttons

## 1.10.0

### Minor Changes

- 1cdb8955: Add hierarchy tab to dimension metadata

### Patch Changes

- cadcaa37: Missing ability to actually create a new hierarchy
- d4e1a44c: Fix table CSVW view showing quads for the full API
- 1c358a03: Display shared dimension name when mapping terms (closes #1112)
- 75d58a4d: Fix authentication error handling (fixes #1148)
- 913fdfc4: Add simple text filter for dimension mapping values
- 2829ce23: Add explanation tooltip on job "View full log" button (fixes #1146)

## 1.9.0

### Minor Changes

- 75d4b4b2: Added hierarchies API

### Patch Changes

- 60f97b46: Fix "view generated CSVW" not working (fixes #1117)

## 1.8.4

### Patch Changes

- 37a8a356: Allow mapping dimension to multiple shared dimensions

## 1.8.3

### Patch Changes

- Updated dependencies [3c4ca273]
  - @cube-creator/model@0.1.26

## 1.8.2

### Patch Changes

- 4495ccda: Do not request observations if page <= 0
- b01ca6d7: Store SHACL validation error for publication jobs and display it in the UI
- Updated dependencies [b01ca6d7]
  - @cube-creator/core@0.3.4
  - @cube-creator/model@0.1.25

## 1.8.1

### Patch Changes

- 91bc8c77: Radio buttons on forms were sometimes wider than the side panel
- 4e51afd2: Improve button/icon to link to shared dimension
- 8aa8eff4: Forms: dereference and show label for URI property values (closes #1024)
- 2389351f: Add `sh:order` property on dimensions to manually define their ordering (closes #987)
- 8307fa40: Small UI improvements
- 02a82fa7: Improve Cube Preview pagination based on total number of observations
- Updated dependencies [2389351f]
  - @cube-creator/model@0.1.24

## 1.8.0

### Minor Changes

- 057b114e: Job details will inform about large dimensions which had their `sh:in` removed (closes #983)

### Patch Changes

- 8dde2a0d: Avoid full Cube Preview refresh when editing dimension metadata (closes #1017)
- 4ce3c203: Fix identifier template input creating broken templates (closes #991)
- 5da66edd: Add support for `sh:group` to group properties in separate tabs in forms (closes #1026)
- e0f0cd44: Improve dataset keywords input field (closes #924)
- 229e61a8: Add a way to define relations between dimensions (fixes #1000)
- 9aa45315: Make CSV delimiter and quote char optional (fixes #968)

## 1.7.2

### Patch Changes

- e31d7363: Fix nested errors display
- e476bfa5: Replace "Transform" button with step/tab
- e41f2ce9: Fix button saying "Import" on CSV Mapping projects

## 1.7.1

### Patch Changes

- bb6469bf: Fix displayed Shared Dimension Term URI in edit form
- d69ecf72: Rename "Observation table" to "Cube table" in more places in the UI
- 362e5e18: Display nested validation results

## 1.7.0

### Minor Changes

- d36febf6: Add dynamic properties to Shared Dimension Terms (closes #939)

### Patch Changes

- 60fc39e9: Show CSV sources mapped to observation table first on screen (closes #963)
- 211c1c15: Make it clearer which mapper table is the "Cube" and which are "Concepts" (closes #962)
- 79e43d00: Replace shared term URI column with a button/link to the term (closes #964)
- 33e7e556: Datatype dropdown would only search from beginning (required typing of prefix)

## 1.6.3

### Patch Changes

- 39d7d621: Display Cube Designer errors sourced from dataset and metadata resources

## 1.6.2

### Patch Changes

- 424009b9: Add pagination to shared dimension terms (close #936)
- 504a0140: Change "pending job" icon to a blinking icon
- e295dc45: Fix multi-valued project details parts not shown (fix #933)

## 1.6.1

### Patch Changes

- 5301528a: Sort projects alphabetically (closes #888)
- 22fedcf7: Display only the user's projects by default (close #925)

## 1.6.0

### Minor Changes

- 1bcb2035: CSV transformation: track the last processed row and display if job failed

### Patch Changes

- 858f5ff2: Add button to show project details in projects list

## 1.5.5

### Patch Changes

- Updated dependencies [c0338c9c]
  - @cube-creator/model@0.1.23

## 1.5.4

### Patch Changes

- 2ac2dcd9: When table identifier changes, reference columns kept outdated mappings (fixes #862)
- Updated dependencies [2ac2dcd9]
  - @cube-creator/model@0.1.22

## 1.5.3

### Patch Changes

- c0044cbe: Add simple details page for jobs

## 1.5.2

### Patch Changes

- bd084b85: Add button to unlist all published versions of a cube

## 1.5.1

### Patch Changes

- 7b497c4f: Show link to visualize on publish jobs

## 1.5.0

### Minor Changes

- 227a5743: Shared dimension import (closes #814)

### Patch Changes

- 28545849: Fix S3 uploads "invalid relative URL" error
- Updated dependencies [7e0f6f26]
  - @cube-creator/model@0.1.21

## 1.4.0

### Minor Changes

- 6970ccf0: Create a project by importing backed up resources

### Patch Changes

- b4ab9977: Put Organization before the project source type on creation form

## 1.3.0

### Minor Changes

- 6872eb8e: Exporting project
- 440ad533: Button to download exported shared dimension

### Patch Changes

- 271cb671: Ability to map a CSV file hosted on a remote server via URL
- Updated dependencies [271cb671]
- Updated dependencies [b793194e]
- Updated dependencies [6872eb8e]
  - @cube-creator/core@0.3.3
  - @cube-creator/model@0.1.20

## 1.2.9

### Patch Changes

- 68e85c61: Add support for very large CSV files
- faa1c2a5: Text filtering not working in static select boxes (fixes #788)
- 800233c8: Displaying the canonical term URI on Shared Dimension screen (closes #787)
- ee9d6dbd: Switch to GHCR
- f079cb43: Reduce the number of search requests from shared term dropdown

## 1.2.8

### Patch Changes

- 5ad95601: Selected shared term disappeared if result of search

## 1.2.7

### Patch Changes

- 3fdcdbbb: Loading mapped dimension terms only by user input (closes #743)

## 1.2.6

### Patch Changes

- 070da9ac: Attempt at fixing "Request Header Or Cookie Too Large" error (fix #767)
- f91d1cde: Fix Cube Designer refresh button when dimensions were not loaded at page load (fix #764)

## 1.2.5

### Patch Changes

- 53f0bb81: Truncate project title to a reasonable width

## 1.2.4

### Patch Changes

- 7f8f3fab: Display shared dimension terms URI (fixes #739)

## 1.2.3

### Patch Changes

- beff2053: Use "search with filter" inputs for shared dimension mapping

## 1.2.2

### Patch Changes

- ef91512e: Dimension mapping: switch for hiding deprecated terms (closes #747)
- 33bc3725: Opendata.swiss Contact Point sometimes showed false negative validation error
- 96942e4b: Dimensions: previously saved **Data kind** would not show on subsequent edit form (fixes #740)
- dd955a0e: Fix language switch for resource labels in Cube Preview

## 1.2.1

### Patch Changes

- a284b404: Alternating UI for `sh:xone` shapes
- 1ac072a7: Show button to start import job
- Updated dependencies [fc796075]
  - @cube-creator/core@0.3.2
  - @cube-creator/model@0.1.19

## 1.2.0

### Minor Changes

- ead96fe: Display more information about cube resources (fixes #689)

## 1.1.1

### Patch Changes

- 6eb797b: Improve display of publication jobs

## 1.1.0

### Minor Changes

- 868093e: Show more details about publish jobs:
  - cube version
  - cube status
  - "publish to" application
  - link to query the cube in Lindas

### Patch Changes

- c6d95ee: Load details of shared terms on preview panel (#685)

## 1.0.4

### Patch Changes

- 30c4e1d: Add dimension type (Key/Measure)
- Updated dependencies [646a9c2]
- Updated dependencies [30c4e1d]
  - @cube-creator/core@0.3.1
  - @cube-creator/model@0.1.18

## 1.0.3

### Patch Changes

- 9a437f1: Fix broken layout when CSV contains really long column name

## 1.0.2

### Patch Changes

- ec7cbc4: Fix dimension metadata not reflected in Cube Designer when saved (#646)

## 1.0.1

### Patch Changes

- 114ff79: Only load necessary data in the cube metadata form

## 1.0.0

### Major Changes

- 535de57: First major release

### Patch Changes

- 445c31e: Enable Sentry distributed transactions between the UI and the API to help debugging
- 4472b53: Make side panes resizable
- 18e86d0: Add advanced editor to dimension metadata
- 3154255: Ability to edit Shared Dimension and Cube Metadata as raw RDF

## 0.1.21

### Patch Changes

- 00e5fc5: Fix form submitting when selecting an option with "enter" in autocomplete field (#339)

## 0.1.20

### Patch Changes

- f99a508: Show "read-only" and "deprecated" tags on Shared Dimensions
- f440bb8: Stop polling project jobs if an error occurs
- 44b8c3a: Add more prefixes when editing shared dimension term as raw RDF

## 0.1.19

### Patch Changes

- f75e65a: Forms would come back with "canceled" values (#336)
- ac8a3ab: Adjust width of side-pane when editing dimension mapping to Shared Dimension
- 6bd4164: Improve display of cube preview values based on datatype
- fcdfb55: Ability to add arbitrary data to shared dimension terms
- 5a27616: Various fixes for Shared Dimensions
- b1f1ff0: Fix error when refreshing Shared Dimension Term edition page
- 6ae8ee5: Shared Dimensions: modifying a dimension
- 572b878: Fix toast wording when starting publication job (#579)

## 0.1.18

### Patch Changes

- 98c0a03: Shared dimension manager UI
- 7253116: Change the term Managed Dimension to Shared Dimension everywhere
- Updated dependencies [7253116]
  - @cube-creator/core@0.3.0
  - @cube-creator/model@0.1.17

## 0.1.17

### Patch Changes

- f36c9a9: Improve form validation errors (#175)
- 8726055: Add link to documentation (#545)
- b1d57e4: Fix CSV upload when file name contains special characters (#513)
- eaf8e00: User interface to map a dimension to a shared dimension
- d4d2409: Disable OIDC session monitoring, which sometimes causes an incomplete user login information (#480)

## 0.1.16

### Patch Changes

- 77aa964: Redefine supported languages and their order (#393)
- Updated dependencies [47619a1]
- Updated dependencies [77aa964]
  - @cube-creator/core@0.2.0
  - @cube-creator/model@0.1.16
