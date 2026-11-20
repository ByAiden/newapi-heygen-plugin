---
changelogVersion: 1
plugin: "byaiden_heygen"
version: "1.1.1"
locale: "en"
translations:
  zh-CN: CHANGELOG.zh-CN.md
---
# Changelog

## [1.1.1]

### Fixed

- The recommended price expressions in the README now use per-second prices (the minute price divided by 60) instead of `* price / 60`, so the gateway's model page shows them as a price table instead of a special billing expression. The charges are unchanged.
