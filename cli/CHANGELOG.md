# @cube-creator/cli

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
