---
"@cube-creator/core-api": patch
---

When creating an output table from multiple columns, it was possible for multiple columns to assume same `target property`, which resulted in a broken cube (fixes #1365)
