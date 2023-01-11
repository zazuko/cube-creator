---
"@cube-creator/shared-dimensions-api": major
---

Deep refactoring of the internals of shared dimensions data storage
fixes #1288 fixes #1276

This is a big change which requires manual, one-time update of the shared dimensions graph:

1. Export data-only using prepared queries (see PR #1357) 
2. Clear shared dimensions graph
3. Upload exported data
4. Restart api
