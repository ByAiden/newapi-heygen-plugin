---
changelogVersion: 1
plugin: "byaiden_heygen"
version: "1.0.0"
locale: "zh-CN"
---
# Changelog

## [1.0.0]

### Added

- 以 `heygen-avatar-iii`、`heygen-avatar-iv`、`heygen-avatar-v` 提供 HeyGen API v3 数字人视频：HeyGen 数字人形象，或在 Avatar IV 上使用人像照片，朗读文案或按音频 URL 对口型；支持 OpenAI 视频接口（`POST /v1/videos`）以及 HeyGen 原生的 `POST /v3/videos` 和 `GET /v3/videos/{video_id}`。
- 在 HeyGen 原生的 `/v3/video-translations` 和 `/v3/lipsyncs` 路径上提供视频翻译（`heygen-video-translate`，每个请求一种目标语言）和口型同步（`heygen-lipsync`）。
- 按秒计费的用量：数字人视频按文案估算的朗读时长、以引擎最贵的数字人类型预扣，完成后按返回时长和形象实际类型结算；翻译和口型同步上报秒数与模式，翻译另报是否仅翻译音频。
- 通过网关下载视频、字幕、翻译音频和封面，并自动刷新 HeyGen 的预签名链接。
