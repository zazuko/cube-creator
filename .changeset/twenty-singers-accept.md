---
"@cube-creator/core-api": major
"@cube-creator/cli": major
"@cube-creator/core": major
---

Align usages of `https://cube.link/meta/` namespace with its vocabulary

This release will require existing cubes to be updated!

### `meta:StandardDeviation`

In previous version, there was a typo in this term. To update existing cubes execute a SPARQL Update:

```sparql
PREFIX meta: <https://cube.link/meta/>

DELETE {
    graph ?g {
        ?s ?p meta:StandarDeviation
    }
}
INSERT {
    graph ?g {
        ?s ?p meta:StandardDeviation
    }
}
WHERE {
   graph ?g {        
       ?s ?p meta:StandarDeviation    
   }
}
```

### `meta:inHierarchy`

Until now, Cube Creator published with an incorrect property. To update, run:

```sparql
PREFIX meta: <https://cube.link/meta/>

DELETE {
    graph ?g {
        ?s meta:hasHierarchy ?o
    }
}
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
