---
changelogVersion: 1
plugin: "byaiden_heygen"
version: "1.1.0"
locale: "zh-CN"
---
# Changelog

## [1.1.0]

### Added

- 可以把另一个 New API 网关作为上游：把插件绑定到 New API 渠道（类型 60），Base URL 填同样安装了本插件的网关。请求发往该网关的 `/byaiden_heygen/v3/...` 路径，用它的令牌作为 Bearer 密钥，并按它返回的时长结算。详见 README 的「经由另一个 New API 网关」。
