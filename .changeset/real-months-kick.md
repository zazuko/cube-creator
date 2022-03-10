---
"@cube-creator/core-api": patch
---

Do not set identifier to cube metadata. This prevents validation errors on publish in case when the identifier is changed in Project settings but metadata would not be synchronized. It is redundant anyway, thus only the project value will be kept (fixes #1092)
