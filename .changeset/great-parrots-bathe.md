---
"@cube-creator/core-api": patch
---

Triggering publish multiple times should cancel running jobs for same version (fixes #1218)

To configure, two new environment variables are necessary (see readme in `apis/core`)

- `GITLAB_TOKEN`
- `GITLAB_API_URL`
