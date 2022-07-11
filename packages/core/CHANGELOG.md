# @cube-creator/core

## 1.0.0

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

## 0.3.4

### Patch Changes

- b01ca6d7: Store SHACL validation error for publication jobs and display it in the UI

## 0.3.3

### Patch Changes

- 271cb671: Ability to map a CSV file hosted on a remote server via URL
- 6872eb8e: Exporting project

## 0.3.2

### Patch Changes

- fc796075: Add ImportJob type and API capability

## 0.3.1

### Patch Changes

- 646a9c2: Add flags to mapping to indicate key/measure dimensions

## 0.3.0

### Minor Changes

- 7253116: Change the term Managed Dimension to Shared Dimension everywhere

## 0.2.0

### Minor Changes

- 47619a1: Vocabulary: use https://cube.link/ vocabulary (#510)
