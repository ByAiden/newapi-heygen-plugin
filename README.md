---
translations:
  zh-CN: README.zh-CN.md
---
# HeyGen

**English** | [简体中文](README.zh-CN.md)

Generates avatar (digital human) videos through the [HeyGen API v3](https://developers.heygen.com/): a HeyGen avatar look, or any portrait photo, speaks a script or lip-syncs an audio track on the Avatar III, IV or V engine. It also translates videos into another language and re-syncs a video to new audio.

The plugin targets HeyGen's v3 API. The v1 and v2 endpoints (`/v2/video/generate`, `/v1/video_status.get`) passed their sunset on October 31, 2026 and are not used.

## Channel setup

- Install the plugin, then add a channel of the Task Plugin type and bind it to `byaiden_heygen`.
- The key is a HeyGen API key from the Developers page of the HeyGen app (pay-as-you-go API credits). The plugin sends it in HeyGen's `X-Api-Key` header. A restricted key needs write access to videos, video translations and lipsyncs, and read access to avatars.
- Leave the API address empty to use `https://api.heygen.com`.
- Add the models you offer to the channel. A channel can also offer them under other names through model mapping.

## Models and endpoints

| Model | HeyGen operation |
| --- | --- |
| `heygen-avatar-iii` | `POST /v3/videos` with engine `avatar_iii` |
| `heygen-avatar-iv` | `POST /v3/videos` with engine `avatar_iv` (HeyGen's default engine); the only engine for talking photos |
| `heygen-avatar-v` | `POST /v3/videos` with engine `avatar_v` |
| `heygen-video-translate` | `POST /v3/video-translations` |
| `heygen-lipsync` | `POST /v3/lipsyncs` |

| Endpoint | What it does | Models |
| --- | --- | --- |
| `POST /v1/videos` | OpenAI video API. `prompt` is the script; `avatar_id` and `voice_id` choose the look and voice, or `input_reference` (a URL or a multipart upload) is a portrait to animate as a talking photo. `size` sets the aspect ratio and resolution. `audio_url` replaces the script. | avatar models |
| `POST /v3/videos` | HeyGen's own body, `type` `avatar` or `image`. Without `model`, `engine.type` picks the model, and Avatar IV is the default. | avatar models |
| `GET /v3/videos/{video_id}` | Reads an avatar video. | avatar models |
| `POST /v3/video-translations` | HeyGen's translation body, one target language per request (`output_language`, or `output_languages` with one entry). | `heygen-video-translate` |
| `GET /v3/video-translations/{video_translation_id}` | Reads a translation. | `heygen-video-translate` |
| `POST /v3/lipsyncs` | HeyGen's lipsync body: a `video` and the `audio` to sync it to. | `heygen-lipsync` |
| `GET /v3/lipsyncs/{lipsync_id}` | Reads a lipsync. | `heygen-lipsync` |

The HeyGen paths are also served under `/byaiden_heygen`. For OpenAI-style videos, clients poll `GET /v1/videos/{task_id}` and download from `GET /v1/videos/{task_id}/content`. On HeyGen's own query paths the reply carries gateway download addresses for the video, captions, subtitles, audio and thumbnail.

Avatar and voice ids come from HeyGen's list endpoints (`GET /v3/avatars/looks`, `GET /v3/models/audio/voices`), which the plugin does not proxy; look them up in the HeyGen app or with the API key directly. Before choosing an engine, check `supported_api_engines` on the look; HeyGen rejects an engine the look does not support.

## Billing

HeyGen bills every operation per second of output. The plugin reports these facts:

- Avatar models: "Avatar video generation unit price" (`seconds`) and "Avatar type" (`avatar_type`: `digital_twin`, `studio_avatar` or `photo_avatar`). A script reserves its estimated speaking time (about 2.5 words or 4 CJK characters a second, at the voice speed, plus a margin); an audio track reserves 300 seconds. The look type is not known at submission, so a request reserves the dearest type of its engine (studio avatar on Avatar III, digital twin on IV and V; a talking photo is a photo avatar). While the video renders, the plugin reads the look from `GET /v3/avatars/looks/{id}` and the task settles on the duration HeyGen reports and the real look type.
- `heygen-video-translate`: "Video translation unit price" (`seconds`), "Translation mode" (`mode`: `speed` or `precision`) and "Whether only the audio is translated" (`audio_only`). It reserves the span between `start_time` and `end_time`, or 300 seconds without `end_time`, and settles on the reported duration.
- `heygen-lipsync`: "Lipsync unit price" (`seconds`) and "Lipsync mode" (`mode`), reserved and settled the same way.

Recommended task expressions at HeyGen's self-serve API list prices (help center, November 2026; per minute, charged by the second), in USD. Multiply by your margin; the gateway charges USD × 500000 quota.

`heygen-avatar-iii` (digital twin $0.60, studio and photo avatar $0.99 a minute):

```text
u("avatar_type") == "digital_twin" ? tier("digital twin", u("seconds") * 0.60 / 60) : tier("studio or photo", u("seconds") * 0.99 / 60)
```

`heygen-avatar-iv` (photo avatar $2.31, digital twin and studio avatar $4.83 a minute):

```text
u("avatar_type") == "photo_avatar" ? tier("photo", u("seconds") * 2.31 / 60) : tier("twin or studio", u("seconds") * 4.83 / 60)
```

`heygen-avatar-v` (digital twin $7.20 a minute; HeyGen lists no other type on Avatar V):

```text
tier("base", u("seconds") * 7.20 / 60)
```

`heygen-video-translate` (speed audio only $0.57, speed with lip sync $0.81, precision $1.50 a minute):

```text
u("mode") == "precision" ? tier("precision", u("seconds") * 1.50 / 60) : u("audio_only") == true ? tier("speed audio only", u("seconds") * 0.57 / 60) : tier("speed", u("seconds") * 0.81 / 60)
```

`heygen-lipsync` (speed $0.84, precision $1.74 a minute):

```text
u("mode") == "precision" ? tier("precision", u("seconds") * 1.74 / 60) : tier("speed", u("seconds") * 0.84 / 60)
```

HeyGen changes these prices from time to time and enterprise contracts differ; check your HeyGen dashboard before saving.

## Example

```bash
curl https://your-gateway.example.com/v1/videos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "heygen-avatar-iv", "prompt": "Welcome to our product tour.", "avatar_id": "YOUR_LOOK_ID", "voice_id": "YOUR_VOICE_ID", "size": "1920x1080"}'
```

```bash
curl https://your-gateway.example.com/v3/video-translations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video": {"type": "url", "url": "https://example.com/talk.mp4"}, "output_language": "Spanish (Spain)", "mode": "speed"}'
```

## Limits

- Media are public `http(s)` URLs; talking-photo images may also be base64 or a multipart upload. HeyGen `asset_id` values are refused, since they name files in the gateway's own HeyGen account.
- `callback_url`, `callback_id`, `output_upload(s)` and `watermark` are refused; poll the task instead.
- One avatar scene runs up to 30 minutes. Studio (multi-scene), cinematic avatar, Video Agent, templates, HeyGen Video (`/v3/models/videos`) and Avatar 6 (`/v3/models/avatars`, invite-only) are not offered.
- A translation covers one target language; send one request per language.
- `seconds` cannot be set: the script or audio sets the video length.
- The native routes of a community plugin accept the gateway token as `Authorization: Bearer` only.
- HeyGen's output URLs are presigned and expire; downloads through the gateway fetch a fresh URL first.
