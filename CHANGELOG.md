---
changelogVersion: 1
plugin: "byaiden_heygen"
version: "1.1.0"
locale: "en"
translations:
  zh-CN: CHANGELOG.zh-CN.md
---
# Changelog

## [1.1.0]

### Added

- Another New API gateway can be the upstream: bind the plugin to a New API channel (type 60) whose base URL is a gateway that has this plugin too. Requests go to that gateway's `/byaiden_heygen/v3/...` paths with its token as a Bearer key, and settle on the duration it reports. See "Through another New API gateway" in the README.
