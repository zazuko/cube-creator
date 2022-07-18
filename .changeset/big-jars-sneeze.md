---
"@cube-creator/cli": patch
---

Timeout pipeline skipped jobs which never actually started (or were never marked as such). This caused dangling jobs with blinking status
