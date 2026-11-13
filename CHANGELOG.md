---
changelogVersion: 1
plugin: "byaiden_heygen"
version: "1.0.0"
locale: "en"
translations:
  zh-CN: CHANGELOG.zh-CN.md
---
# Changelog

## [1.0.0]

### Added

- HeyGen API v3 avatar videos as `heygen-avatar-iii`, `heygen-avatar-iv` and `heygen-avatar-v`: a HeyGen avatar look, or a portrait photo on Avatar IV, speaking a script or lip-syncing an audio URL, on the OpenAI video API (`POST /v1/videos`) and HeyGen's own `POST /v3/videos` and `GET /v3/videos/{video_id}`.
- Video translation (`heygen-video-translate`, one target language per request) and lipsync (`heygen-lipsync`) on HeyGen's own `/v3/video-translations` and `/v3/lipsyncs` paths.
- Per-second billing facts: avatar videos reserve the estimated speaking time of the script at the dearest avatar type of the engine and settle on the reported duration and the look's real type; translations and lipsyncs report seconds and mode, plus audio-only for translations.
- Gateway downloads of the video, captions, subtitles, translated audio and thumbnail, refreshing HeyGen's presigned URLs.
