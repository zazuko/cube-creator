---
"@cube-creator/core-api": patch
"@cube-creator/cli": patch
---

Fixes transformations failing when there is a large nominal dimension with many unmapped value. In such case,
the pipeline should only request those mappings which are complete key/value pairs (closes #1328)
