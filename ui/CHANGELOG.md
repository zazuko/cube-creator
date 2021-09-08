# @cube-creator/ui

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
