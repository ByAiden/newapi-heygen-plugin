---
locale: zh-CN
---
# HeyGen

[English](README.md) | **简体中文**

通过 [HeyGen API v3](https://developers.heygen.com/) 生成数字人视频：HeyGen 的数字人形象或任意人像照片，在 Avatar III、IV、V 引擎上朗读文案或对口型播放一段音频。插件还支持把视频翻译成另一种语言，以及把视频口型同步到新的音频。

插件使用 HeyGen 的 v3 接口。v1、v2 接口（`/v2/video/generate`、`/v1/video_status.get`）已于 2026 年 10 月 31 日停止支持，插件不再使用。

## 渠道设置

- 安装插件后，新建“任务插件”类型的渠道，并绑定 `byaiden_heygen`。
- 密钥填写 HeyGen 应用 Developers 页面创建的 API Key（按量付费的 API 额度）。插件通过 HeyGen 的 `X-Api-Key` 请求头发送。受限密钥需要视频、视频翻译、口型同步的写权限，以及数字人形象的读权限。
- API 地址留空即使用 `https://api.heygen.com`。
- 在渠道中添加要提供的模型，也可以通过模型映射以其他名称提供。

## 模型与接口

| 模型 | HeyGen 操作 |
| --- | --- |
| `heygen-avatar-iii` | `POST /v3/videos`，引擎 `avatar_iii` |
| `heygen-avatar-iv` | `POST /v3/videos`，引擎 `avatar_iv`（HeyGen 默认引擎）；照片说话只支持此引擎 |
| `heygen-avatar-v` | `POST /v3/videos`，引擎 `avatar_v` |
| `heygen-video-translate` | `POST /v3/video-translations` |
| `heygen-lipsync` | `POST /v3/lipsyncs` |

| 接口 | 功能 | 模型 |
| --- | --- | --- |
| `POST /v1/videos` | OpenAI 视频接口。`prompt` 是朗读文案；`avatar_id` 和 `voice_id` 指定形象和声音，或用 `input_reference`（URL 或 multipart 上传）提供一张人像做照片说话。`size` 决定画幅和分辨率。`audio_url` 可代替文案。 | 数字人模型 |
| `POST /v3/videos` | HeyGen 原生请求体，`type` 为 `avatar` 或 `image`。未写 `model` 时由 `engine.type` 选择模型，都没有时默认 Avatar IV。 | 数字人模型 |
| `GET /v3/videos/{video_id}` | 查询数字人视频。 | 数字人模型 |
| `POST /v3/video-translations` | HeyGen 翻译请求体，每个请求一个目标语言（`output_language`，或只含一项的 `output_languages`）。 | `heygen-video-translate` |
| `GET /v3/video-translations/{video_translation_id}` | 查询翻译任务。 | `heygen-video-translate` |
| `POST /v3/lipsyncs` | HeyGen 口型同步请求体：`video` 与要同步的 `audio`。 | `heygen-lipsync` |
| `GET /v3/lipsyncs/{lipsync_id}` | 查询口型同步任务。 | `heygen-lipsync` |

HeyGen 路径同时在 `/byaiden_heygen` 前缀下提供。OpenAI 风格的视频通过 `GET /v1/videos/{task_id}` 轮询，从 `GET /v1/videos/{task_id}/content` 下载。HeyGen 原生查询接口的返回中，视频、字幕、音频和封面地址都换成网关下载地址。

数字人形象和声音的 ID 来自 HeyGen 的列表接口（`GET /v3/avatars/looks`、`GET /v3/models/audio/voices`），插件不代理这些接口，请在 HeyGen 应用中或直接用 API Key 查询。选择引擎前请查看形象的 `supported_api_engines`，形象不支持的引擎会被 HeyGen 拒绝。

## 计费

HeyGen 所有操作都按输出秒数计费。插件上报以下用量：

- 数字人模型：“数字人视频生成单价”（`seconds`）和“数字人类型”（`avatar_type`：`digital_twin`、`studio_avatar` 或 `photo_avatar`）。文案按估算的朗读时长预扣（约每秒 2.5 个英文单词或 4 个中日韩字符，按语速换算并留有余量）；音频预扣 300 秒。提交时还不知道形象类型，因此按该引擎最贵的类型预扣（Avatar III 为工作室数字人，IV、V 为数字分身；照片说话为照片数字人）。渲染期间插件通过 `GET /v3/avatars/looks/{id}` 读取形象类型，任务完成后按 HeyGen 返回的时长和实际类型结算。
- `heygen-video-translate`：“视频翻译单价”（`seconds`）、“翻译模式”（`mode`：`speed` 或 `precision`）和“是否仅翻译音频”（`audio_only`）。按 `start_time` 到 `end_time` 的区间预扣，没有 `end_time` 时预扣 300 秒，完成后按返回时长结算。
- `heygen-lipsync`：“口型同步单价”（`seconds`）和“口型同步模式”（`mode`），预扣与结算方式同上。

以下是按 HeyGen 自助 API 标价（帮助中心，2026 年 11 月；按分钟标价，按秒计费）写的推荐任务表达式，单位为美元。请乘以你的利润系数；网关按 美元 × 500000 扣额度。

`heygen-avatar-iii`（数字分身每分钟 $0.60，工作室和照片数字人 $0.99）：

```text
u("avatar_type") == "digital_twin" ? tier("digital twin", u("seconds") * 0.60 / 60) : tier("studio or photo", u("seconds") * 0.99 / 60)
```

`heygen-avatar-iv`（照片数字人每分钟 $2.31，数字分身和工作室数字人 $4.83）：

```text
u("avatar_type") == "photo_avatar" ? tier("photo", u("seconds") * 2.31 / 60) : tier("twin or studio", u("seconds") * 4.83 / 60)
```

`heygen-avatar-v`（数字分身每分钟 $7.20；HeyGen 未列出 Avatar V 的其他类型价格）：

```text
tier("base", u("seconds") * 7.20 / 60)
```

`heygen-video-translate`（快速模式仅音频每分钟 $0.57，快速模式含口型 $0.81，精准模式 $1.50）：

```text
u("mode") == "precision" ? tier("precision", u("seconds") * 1.50 / 60) : u("audio_only") == true ? tier("speed audio only", u("seconds") * 0.57 / 60) : tier("speed", u("seconds") * 0.81 / 60)
```

`heygen-lipsync`（快速每分钟 $0.84，精准 $1.74）：

```text
u("mode") == "precision" ? tier("precision", u("seconds") * 1.74 / 60) : tier("speed", u("seconds") * 0.84 / 60)
```

HeyGen 会不定期调整价格，企业合同价格也不同；保存前请在 HeyGen 后台核对。

## 示例

```bash
curl https://your-gateway.example.com/v1/videos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "heygen-avatar-iv", "prompt": "欢迎了解我们的产品。", "avatar_id": "YOUR_LOOK_ID", "voice_id": "YOUR_VOICE_ID", "size": "1920x1080"}'
```

```bash
curl https://your-gateway.example.com/v3/video-translations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video": {"type": "url", "url": "https://example.com/talk.mp4"}, "output_language": "Spanish (Spain)", "mode": "speed"}'
```

## 经由另一个 New API 网关

另一个网关可以通过你的网关转售 HeyGen。两个网关都要安装本插件的同一版本：

- 直接调用 HeyGen 的网关按上文创建任务插件渠道。
- 另一个网关创建 **New API** 渠道（类型 60）：Base URL 填第一个网关的地址，密钥填第一个网关的令牌，在「上游任务插件」中选择 `byaiden_heygen`，并添加 HeyGen 模型。

外层网关把 HeyGen 原生请求发到第一个网关的 `/byaiden_heygen/v3/...` 路径，用令牌作为 Bearer 密钥，在那里轮询任务，并通过第一个网关的下载地址取回结果。请把第一个网关的服务器地址（`ServerAddress`）设成外层网关能访问的地址，下载地址由它生成。每个网关用自己的任务表达式向自己的用户计费，上面的表达式在两个网关上都适用。

- 两个网关都按 HeyGen 返回的时长结算秒数。
- 第一个网关不提供 HeyGen 的形象列表，外层网关读不到形象类型，按预扣类型结算：Avatar III 为工作室数字人，IV 和 V 为数字分身。Avatar IV 和 V 上这与实际类型价格相同；Avatar III 上数字分身视频在外层网关按工作室数字人的价格计费。照片数字人始终按照片数字人计费。

## 限制

- 媒体须为公开的 `http(s)` URL；照片说话的图片也可以是 base64 或 multipart 上传。HeyGen 的 `asset_id` 会被拒绝，因为它指向网关自己 HeyGen 账号中的文件。
- `callback_url`、`callback_id`、`output_upload(s)` 和 `watermark` 会被拒绝，请轮询任务。
- 单个数字人场景最长 30 分钟。不提供 Studio 多场景、电影感数字人、Video Agent、模板、HeyGen Video（`/v3/models/videos`）和 Avatar 6（`/v3/models/avatars`，仅限邀请）。
- 每个翻译请求只对应一种目标语言，多种语言请分别提交。
- 不能设置 `seconds`：视频时长由文案或音频决定。
- 社区插件的原生路由只接受 `Authorization: Bearer` 形式的网关令牌。
- HeyGen 的输出链接是有时效的预签名地址；通过网关下载时会先获取新地址。
