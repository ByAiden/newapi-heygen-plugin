// HeyGen API v3 (developers.heygen.com): avatar videos on the Avatar III, IV
// and V engines (a HeyGen avatar look, or any portrait photo on Avatar IV,
// speaking a script or an audio track), video translation and lipsync. Each
// job is one POST, polled at its own GET, and billed per second of output.
const AVATAR_MODELS = ["heygen-avatar-iii", "heygen-avatar-iv", "heygen-avatar-v"];
const TRANSLATE_MODEL = "heygen-video-translate";
const LIPSYNC_MODEL = "heygen-lipsync";
const ALL_MODELS = AVATAR_MODELS.concat([TRANSLATE_MODEL, LIPSYNC_MODEL]);
const ENGINES = { "heygen-avatar-iii": "avatar_iii", "heygen-avatar-iv": "avatar_iv", "heygen-avatar-v": "avatar_v" };
const DEFAULT_AVATAR_MODEL = "heygen-avatar-iv";

const AVATAR_TYPES = ["digital_twin", "studio_avatar", "photo_avatar"];
// The type a request reserves before HeyGen says which kind of look it named:
// the dearest one on each engine. A talking photo is always a photo avatar.
const RESERVED_AVATAR_TYPE = { "heygen-avatar-iii": "studio_avatar", "heygen-avatar-iv": "digital_twin", "heygen-avatar-v": "digital_twin" };

const RESOLUTIONS = ["720p", "1080p", "4k"];
const ASPECT_RATIOS = ["16:9", "9:16", "4:5", "5:4", "1:1", "auto"];
const FITS = ["contain", "cover"];
const EXPRESSIVENESS = ["high", "medium", "low"];
const OUTPUT_FORMATS = ["mp4", "webm"];
const MODES = ["speed", "precision"];
const FPS_MODES = ["vfr", "cfr", "passthrough"];
const SRT_ROLES = ["input", "output"];

// HeyGen renders one avatar scene of up to 30 minutes.
const MAX_SECONDS = 1800;
const MAX_SCRIPT_LENGTH = 50000;
const MAX_TEXT_FIELD = 2000;
// A job whose length HeyGen only learns from the media (an audio track, a
// source video) holds this many seconds until the finished job reports its
// duration.
const UNKNOWN_MEDIA_SECONDS = 300;
// The host bounds second facts at one hour.
const MAX_FACT_SECONDS = 3600;
const MAX_LOOK_LOOKUPS = 3;

export const meta = {
  "apiVersion": 1,
  "key": "byaiden_heygen",
  "name": "HeyGen",
  "icon": "text:HG",
  "description": {
    "en": "HeyGen avatar videos on the Avatar III, IV and V engines (avatar looks and talking photos driven by a script or audio), video translation and lipsync",
    "zh": "HeyGen 数字人视频（Avatar III、IV、V 引擎，形象或照片由文案或音频驱动）、视频翻译与口型同步"
  },
  "version": "1.0.0",
  "author": {
    "name": "ByAiden",
    "url": "https://github.com/ByAiden"
  },
  "website": "https://developers.heygen.com/",
  "baseUrl": "https://api.heygen.com",
  "models": [
    "heygen-avatar-iii",
    "heygen-avatar-iv",
    "heygen-avatar-v",
    "heygen-video-translate",
    "heygen-lipsync"
  ],
  "fetchMode": "per_task",
  "usageSchema": {
    "seconds": {
      "type": "number",
      "unit": "second",
      "description": {
        "en": "Avatar video generation unit price",
        "zh": "数字人视频生成单价"
      }
    },
    "avatar_type": {
      "enum": [
        "digital_twin",
        "studio_avatar",
        "photo_avatar"
      ],
      "description": {
        "en": "Avatar type",
        "zh": "数字人类型"
      },
      "enumLabels": {
        "digital_twin": {
          "en": "Digital twin",
          "zh": "数字分身"
        },
        "studio_avatar": {
          "en": "Studio avatar",
          "zh": "工作室数字人"
        },
        "photo_avatar": {
          "en": "Photo avatar",
          "zh": "照片数字人"
        }
      }
    }
  },
  "usageExamples": [
    {
      "label": "digital twin · 60s",
      "facts": {
        "seconds": 60,
        "avatar_type": "digital_twin"
      }
    },
    {
      "label": "photo avatar · 30s",
      "facts": {
        "seconds": 30,
        "avatar_type": "photo_avatar"
      }
    }
  ],
  "usageProfiles": [
    {
      "models": [
        "heygen-avatar-iii",
        "heygen-avatar-iv",
        "heygen-avatar-v"
      ],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": {
            "en": "Avatar video generation unit price",
            "zh": "数字人视频生成单价"
          }
        },
        "avatar_type": {
          "enum": [
            "digital_twin",
            "studio_avatar",
            "photo_avatar"
          ],
          "description": {
            "en": "Avatar type",
            "zh": "数字人类型"
          },
          "enumLabels": {
            "digital_twin": {
              "en": "Digital twin",
              "zh": "数字分身"
            },
            "studio_avatar": {
              "en": "Studio avatar",
              "zh": "工作室数字人"
            },
            "photo_avatar": {
              "en": "Photo avatar",
              "zh": "照片数字人"
            }
          }
        }
      },
      "examples": [
        {
          "label": "digital twin · 60s",
          "facts": {
            "seconds": 60,
            "avatar_type": "digital_twin"
          }
        },
        {
          "label": "studio avatar · 60s",
          "facts": {
            "seconds": 60,
            "avatar_type": "studio_avatar"
          }
        },
        {
          "label": "photo avatar · 30s",
          "facts": {
            "seconds": 30,
            "avatar_type": "photo_avatar"
          }
        }
      ]
    },
    {
      "models": [
        "heygen-video-translate"
      ],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": {
            "en": "Video translation unit price",
            "zh": "视频翻译单价"
          }
        },
        "mode": {
          "enum": [
            "speed",
            "precision"
          ],
          "description": {
            "en": "Translation mode",
            "zh": "翻译模式"
          },
          "enumLabels": {
            "speed": {
              "en": "Speed",
              "zh": "快速"
            },
            "precision": {
              "en": "Precision",
              "zh": "精准"
            }
          }
        },
        "audio_only": {
          "type": "boolean",
          "description": {
            "en": "Whether only the audio is translated",
            "zh": "是否仅翻译音频"
          }
        }
      },
      "examples": [
        {
          "label": "speed · 60s",
          "facts": {
            "seconds": 60,
            "mode": "speed",
            "audio_only": false
          }
        },
        {
          "label": "speed audio only · 60s",
          "facts": {
            "seconds": 60,
            "mode": "speed",
            "audio_only": true
          }
        },
        {
          "label": "precision · 60s",
          "facts": {
            "seconds": 60,
            "mode": "precision",
            "audio_only": false
          }
        }
      ]
    },
    {
      "models": [
        "heygen-lipsync"
      ],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": {
            "en": "Lipsync unit price",
            "zh": "口型同步单价"
          }
        },
        "mode": {
          "enum": [
            "speed",
            "precision"
          ],
          "description": {
            "en": "Lipsync mode",
            "zh": "口型同步模式"
          },
          "enumLabels": {
            "speed": {
              "en": "Speed",
              "zh": "快速"
            },
            "precision": {
              "en": "Precision",
              "zh": "精准"
            }
          }
        }
      },
      "examples": [
        {
          "label": "speed · 60s",
          "facts": {
            "seconds": 60,
            "mode": "speed"
          }
        },
        {
          "label": "precision · 60s",
          "facts": {
            "seconds": 60,
            "mode": "precision"
          }
        }
      ]
    }
  ],
  "routes": [
    {
      "method": "POST",
      "path": "/v3/videos",
      "type": "submit",
      "decode": "createVideo",
      "render": "videoCreated"
    },
    {
      "method": "GET",
      "path": "/v3/videos/:video_id",
      "type": "query",
      "taskIdParam": "video_id",
      "render": "videoStatus"
    },
    {
      "method": "POST",
      "path": "/v3/video-translations",
      "type": "submit",
      "decode": "createTranslation",
      "render": "translationCreated"
    },
    {
      "method": "GET",
      "path": "/v3/video-translations/:video_translation_id",
      "type": "query",
      "taskIdParam": "video_translation_id",
      "render": "translationStatus"
    },
    {
      "method": "POST",
      "path": "/v3/lipsyncs",
      "type": "submit",
      "decode": "createLipsync",
      "render": "lipsyncCreated"
    },
    {
      "method": "GET",
      "path": "/v3/lipsyncs/:lipsync_id",
      "type": "query",
      "taskIdParam": "lipsync_id",
      "render": "lipsyncStatus"
    }
  ],
  "protocols": [
    {
      "name": "openai_video",
      "models": [
        "heygen-avatar-iii",
        "heygen-avatar-iv",
        "heygen-avatar-v"
      ]
    }
  ]
};

function trimmed(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function present(value) {
  return value !== undefined && value !== null;
}

function given(value) {
  return present(value) && value !== "";
}

function optionalString(value, name, max) {
  if (!present(value)) return "";
  if (typeof value !== "string") throw new Error(name + " must be a string");
  const text = value.trim();
  if (max && text.length > max) throw new Error(name + " must be at most " + max + " characters");
  return text;
}

function requiredString(value, name) {
  const text = optionalString(value, name, MAX_TEXT_FIELD);
  if (!text) throw new Error(name + " is required");
  return text;
}

function optionalBoolean(value, name) {
  if (!present(value)) return undefined;
  if (typeof value !== "boolean") throw new Error(name + " must be true or false");
  return value;
}

function optionalNumber(value, name, min, max) {
  if (!present(value)) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(name + " must be a number from " + min + " to " + max);
  return value;
}

function enumValue(value, name, allowed) {
  const text = trimmed(value).toLowerCase();
  if (!allowed.includes(text)) throw new Error(name + " must be one of " + allowed.join(", "));
  return text;
}

function rejectFields(source, fields, reason) {
  for (const field of fields) {
    if (present(source[field])) throw new Error(field + " is not supported" + (reason ? "; " + reason : ""));
  }
}

function rejectUnknown(source, allowed, label) {
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) throw new Error((label ? label + "." : "") + key + " is not supported");
  }
}

// A media input is a public URL, given as a string or HeyGen's
// {type: "url", url}, or inline base64 data, as {type: "base64", media_type,
// data} or a gateway file placeholder. An asset_id would name a file in the
// gateway's own HeyGen account, which callers must not reach.
function assetInput(value, name, options) {
  if (typeof value === "string") {
    if (!value.trim()) throw new Error(name + " must not be empty");
    return { type: "url", url: value.trim() };
  }
  const object = plainObject(value);
  if (!object) throw new Error(name + " must be a URL or an object");
  const type = trimmed(object.type).toLowerCase() || (present(object.url) ? "url" : present(object.data) ? "base64" : "");
  if (type === "asset_id" || present(object.asset_id)) throw new Error(name + ".asset_id is not supported; pass a url" + (options.base64 ? " or base64 data" : ""));
  if (type === "url") {
    rejectUnknown(object, ["type", "url"], name);
    const url = optionalString(object.url, name + ".url", 0);
    if (!/^https?:\/\//i.test(url)) throw new Error(name + ".url must be an http(s) URL");
    return { type: "url", url: url };
  }
  if (type === "base64") {
    if (!options.base64) throw new Error(name + " must be a URL");
    rejectUnknown(object, ["type", "media_type", "data"], name);
    const mediaType = optionalString(object.media_type, name + ".media_type", 100).toLowerCase();
    if (!mediaType) throw new Error(name + ".media_type is required with base64 data");
    if (options.prefix && mediaType.indexOf(options.prefix) !== 0) throw new Error(name + ".media_type must be an " + options.prefix + "* type");
    if (plainObject(object.data) && object.data.__fileRef) return { type: "base64", media_type: mediaType, data: object.data };
    const data = optionalString(object.data, name + ".data", 0);
    if (!data) throw new Error(name + ".data must not be empty");
    return { type: "base64", media_type: mediaType, data: data };
  }
  throw new Error(name + ".type must be url" + (options.base64 ? " or base64" : ""));
}

function backgroundSetting(value) {
  const object = plainObject(value);
  if (!object) throw new Error("background must be an object");
  rejectUnknown(object, ["type", "value", "url", "asset_id"], "background");
  const type = enumValue(object.type, "background.type", ["color", "image"]);
  if (type === "color") {
    const color = optionalString(object.value, "background.value", 20);
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("background.value must be a hex color such as #ffffff");
    if (present(object.url) || present(object.asset_id)) throw new Error("a color background takes value only");
    return { type: "color", value: color };
  }
  if (present(object.asset_id)) throw new Error("background.asset_id is not supported; pass a url");
  if (present(object.value)) throw new Error("an image background takes url, not value");
  const url = optionalString(object.url, "background.url", 0);
  if (!/^https?:\/\//i.test(url)) throw new Error("background.url must be an http(s) URL");
  return { type: "image", url: url };
}

function captionSetting(value) {
  const object = plainObject(value);
  if (!object) throw new Error("caption must be an object such as {\"file_format\": \"srt\"}");
  rejectUnknown(object, ["file_format", "style"], "caption");
  const caption = {};
  if (present(object.file_format)) caption.file_format = enumValue(object.file_format, "caption.file_format", ["srt"]);
  if (present(object.style)) caption.style = enumValue(object.style, "caption.style", ["default"]);
  return caption;
}

function voiceSettings(value) {
  const object = plainObject(value);
  if (!object) throw new Error("voice_settings must be an object");
  rejectUnknown(object, ["speed", "pitch", "volume", "locale", "engine_settings"], "voice_settings");
  const out = {};
  const speed = optionalNumber(object.speed, "voice_settings.speed", 0.5, 1.5);
  const pitch = optionalNumber(object.pitch, "voice_settings.pitch", -50, 50);
  const volume = optionalNumber(object.volume, "voice_settings.volume", 0, 1);
  if (speed !== undefined) out.speed = speed;
  if (pitch !== undefined) out.pitch = pitch;
  if (volume !== undefined) out.volume = volume;
  const locale = optionalString(object.locale, "voice_settings.locale", 35);
  if (locale) out.locale = locale;
  if (present(object.engine_settings)) {
    if (!plainObject(object.engine_settings)) throw new Error("voice_settings.engine_settings must be an object");
    out.engine_settings = object.engine_settings;
  }
  return out;
}

const VIDEO_FIELDS = [
  "model", "type", "avatar_id", "image", "script", "voice_id", "audio_url", "voice_settings", "title", "folder_id", "resolution", "aspect_ratio", "fit",
  "background", "remove_background", "caption", "output_format", "brand_glossary_id", "motion_prompt", "expressiveness", "engine",
];

// Validates a HeyGen avatar video body (type avatar or image) and keeps only
// documented fields. The engine comes from the model.
function videoRequest(source) {
  rejectFields(source, ["callback_url", "callback_id"], "query the video instead");
  rejectFields(source, ["audio_asset_id"], "pass audio_url");
  rejectFields(source, ["output_upload", "watermark"]);
  rejectUnknown(source, VIDEO_FIELDS);
  const type = present(source.type) ? enumValue(source.type, "type", ["avatar", "image"]) : present(source.image) ? "image" : "avatar";
  const body = { type: type };
  if (type === "avatar") {
    if (present(source.image)) throw new Error("image is only valid for type image");
    body.avatar_id = requiredString(source.avatar_id, "avatar_id");
  } else {
    if (present(source.avatar_id)) throw new Error("avatar_id is only valid for type avatar");
    if (!present(source.image)) throw new Error("image is required for type image");
    body.image = assetInput(source.image, "image", { base64: true, prefix: "image/" });
  }
  const script = optionalString(source.script, "script", MAX_SCRIPT_LENGTH);
  const audioURL = optionalString(source.audio_url, "audio_url", 0);
  if (script && audioURL) throw new Error("script and audio_url cannot be combined");
  if (!script && !audioURL) throw new Error("script or audio_url is required");
  if (script) {
    body.script = script;
    const voice = optionalString(source.voice_id, "voice_id", MAX_TEXT_FIELD);
    if (voice) body.voice_id = voice;
    else if (type === "image") throw new Error("voice_id is required with a script on type image");
  } else {
    if (!/^https?:\/\//i.test(audioURL)) throw new Error("audio_url must be an http(s) URL");
    if (present(source.voice_id)) throw new Error("voice_id is only valid with a script");
    body.audio_url = audioURL;
  }
  if (present(source.voice_settings)) {
    if (!script) throw new Error("voice_settings is only valid with a script");
    body.voice_settings = voiceSettings(source.voice_settings);
  }
  for (const key of ["title", "folder_id", "brand_glossary_id"]) {
    const text = optionalString(source[key], key, MAX_TEXT_FIELD);
    if (text) body[key] = text;
  }
  if (present(source.resolution)) body.resolution = enumValue(source.resolution, "resolution", RESOLUTIONS);
  if (present(source.aspect_ratio)) body.aspect_ratio = enumValue(source.aspect_ratio, "aspect_ratio", ASPECT_RATIOS);
  if (present(source.fit)) body.fit = enumValue(source.fit, "fit", FITS);
  if (present(source.output_format)) body.output_format = enumValue(source.output_format, "output_format", OUTPUT_FORMATS);
  if (present(source.background)) {
    if (body.output_format === "webm") throw new Error("background cannot be combined with output_format webm");
    body.background = backgroundSetting(source.background);
  }
  const removeBackground = optionalBoolean(source.remove_background, "remove_background");
  if (removeBackground !== undefined) body.remove_background = removeBackground;
  if (present(source.caption)) body.caption = captionSetting(source.caption);
  const motion = optionalString(source.motion_prompt, "motion_prompt", MAX_TEXT_FIELD);
  if (motion) body.motion_prompt = motion;
  if (present(source.expressiveness)) body.expressiveness = enumValue(source.expressiveness, "expressiveness", EXPRESSIVENESS);
  if (present(source.engine)) {
    const engine = plainObject(source.engine);
    if (!engine) throw new Error("engine must be an object");
    rejectUnknown(engine, ["type", "reference_look_id", "more_blinking"], "engine");
    const out = {};
    if (present(engine.type)) out.type = enumValue(engine.type, "engine.type", ["avatar_iii", "avatar_iv", "avatar_v"]);
    const reference = optionalString(engine.reference_look_id, "engine.reference_look_id", MAX_TEXT_FIELD);
    if (reference) out.reference_look_id = reference;
    const blinking = optionalBoolean(engine.more_blinking, "engine.more_blinking");
    if (blinking !== undefined) out.more_blinking = blinking;
    body.engine = out;
  }
  return { action: type === "image" ? "talking_photo" : "avatar_video", body: body };
}

// The engine options each model takes, checked against the model the
// channel sends upstream.
function checkEngine(body, model) {
  const engine = ENGINES[model];
  const options = body.engine || {};
  if (options.type && options.type !== engine) throw new Error("engine.type " + options.type + " does not match model " + model + "; use the model that names the engine");
  if (body.type === "image" && model !== "heygen-avatar-iv") throw new Error("type image (talking photo) runs on heygen-avatar-iv only");
  if (model !== "heygen-avatar-v" && (present(options.reference_look_id) || present(options.more_blinking)))
    throw new Error("engine.reference_look_id and engine.more_blinking are only valid on heygen-avatar-v");
  if (body.expressiveness && model !== "heygen-avatar-iv") throw new Error("expressiveness is only valid on heygen-avatar-iv");
  if (body.motion_prompt && model === "heygen-avatar-iii") throw new Error("motion_prompt is not supported on heygen-avatar-iii");
}

const MEDIA_FIELDS = ["keep_the_same_format", "enable_dynamic_duration", "disable_music_track", "enable_speech_enhancement", "enable_watermark"];

// The span start_time / end_time select, which also sets what HeyGen bills.
function timeRange(source, body) {
  const start = optionalNumber(source.start_time, "start_time", 0, 86400);
  const end = optionalNumber(source.end_time, "end_time", 0, 86400);
  if (start !== undefined) body.start_time = start;
  if (end !== undefined) {
    if (end <= (start || 0)) throw new Error("end_time must be after start_time");
    body.end_time = end;
  }
}

function mediaOptions(source, body) {
  for (const key of MEDIA_FIELDS) {
    const value = optionalBoolean(source[key], key);
    if (value !== undefined) body[key] = value;
  }
  for (const key of ["title", "folder_id"]) {
    const text = optionalString(source[key], key, MAX_TEXT_FIELD);
    if (text) body[key] = text;
  }
  if (present(source.fps_mode)) body.fps_mode = enumValue(source.fps_mode, "fps_mode", FPS_MODES);
  timeRange(source, body);
}

const TRANSLATION_FIELDS = [
  "model", "video", "output_language", "output_languages", "input_language", "audio", "mode", "translate_audio_only", "speaker_num", "brand_glossary_id",
  "brand_voice_id", "stock_voice_config", "srt", "srt_role", "title", "folder_id", "fps_mode", "start_time", "end_time",
].concat(MEDIA_FIELDS);

// One translation per request: HeyGen returns one job per target language,
// and a gateway task follows one of them.
function translationRequest(source) {
  rejectFields(source, ["callback_url", "callback_id"], "query the translation instead");
  rejectFields(source, ["output_uploads"]);
  rejectFields(source, ["enable_caption"], "captions are always generated");
  rejectUnknown(source, TRANSLATION_FIELDS);
  if (!present(source.video)) throw new Error("video is required");
  const body = { video: assetInput(source.video, "video", { base64: false }) };
  let language = optionalString(source.output_language, "output_language", 200);
  if (present(source.output_languages)) {
    if (!Array.isArray(source.output_languages) || source.output_languages.length !== 1)
      throw new Error("output_languages must hold exactly one language; send one request per language");
    if (language) throw new Error("use output_language or output_languages, not both");
    language = optionalString(source.output_languages[0], "output_languages[0]", 200);
  }
  if (!language) throw new Error("output_language is required");
  body.output_languages = [language];
  const input = optionalString(source.input_language, "input_language", 200);
  if (input) body.input_language = input;
  body.mode = present(source.mode) ? enumValue(source.mode, "mode", MODES) : "speed";
  body.translate_audio_only = optionalBoolean(source.translate_audio_only, "translate_audio_only") || false;
  if (present(source.speaker_num)) {
    if (typeof source.speaker_num !== "number" || !Number.isInteger(source.speaker_num) || source.speaker_num < 1 || source.speaker_num > 100)
      throw new Error("speaker_num must be an integer from 1 to 100");
    body.speaker_num = source.speaker_num;
  }
  if (present(source.audio)) body.audio = assetInput(source.audio, "audio", { base64: false });
  if (present(source.srt)) body.srt = assetInput(source.srt, "srt", { base64: false });
  if (present(source.srt_role)) {
    if (!body.srt) throw new Error("srt_role requires srt");
    body.srt_role = enumValue(source.srt_role, "srt_role", SRT_ROLES);
  }
  const glossary = optionalString(source.brand_glossary_id, "brand_glossary_id", MAX_TEXT_FIELD) || optionalString(source.brand_voice_id, "brand_voice_id", MAX_TEXT_FIELD);
  if (glossary) body.brand_glossary_id = glossary;
  if (present(source.stock_voice_config)) {
    const config = plainObject(source.stock_voice_config);
    if (!config) throw new Error("stock_voice_config must be an object");
    rejectUnknown(config, ["use_stock_voice", "preferred_stock_voice_ids"], "stock_voice_config");
    const out = {};
    const use = optionalBoolean(config.use_stock_voice, "stock_voice_config.use_stock_voice");
    if (use !== undefined) out.use_stock_voice = use;
    if (present(config.preferred_stock_voice_ids)) {
      if (!Array.isArray(config.preferred_stock_voice_ids) || config.preferred_stock_voice_ids.some((id) => typeof id !== "string" || !id.trim()))
        throw new Error("stock_voice_config.preferred_stock_voice_ids must be an array of voice ids");
      out.preferred_stock_voice_ids = config.preferred_stock_voice_ids.map((id) => id.trim());
    }
    body.stock_voice_config = out;
  }
  mediaOptions(source, body);
  return { action: "video_translation", body: body };
}

const LIPSYNC_FIELDS = ["model", "video", "audio", "mode", "title", "folder_id", "fps_mode", "start_time", "end_time"].concat(MEDIA_FIELDS);

function lipsyncRequest(source) {
  rejectFields(source, ["callback_url", "callback_id"], "query the lipsync instead");
  rejectFields(source, ["enable_caption"], "captions are always generated");
  rejectUnknown(source, LIPSYNC_FIELDS);
  if (!present(source.video)) throw new Error("video is required");
  if (!present(source.audio)) throw new Error("audio is required");
  const body = { video: assetInput(source.video, "video", { base64: false }), audio: assetInput(source.audio, "audio", { base64: false }) };
  body.mode = present(source.mode) ? enumValue(source.mode, "mode", MODES) : "speed";
  mediaOptions(source, body);
  return { action: "lipsync", body: body };
}

function modelKind(model) {
  if (AVATAR_MODELS.includes(model)) return "video";
  if (model === TRANSLATE_MODEL) return "translation";
  if (model === LIPSYNC_MODEL) return "lipsync";
  return "";
}

function actionKind(action) {
  if (action === "avatar_video" || action === "talking_photo") return "video";
  if (action === "video_translation") return "translation";
  if (action === "lipsync") return "lipsync";
  return "";
}

// The model the channel sends upstream: the mapped name first, then the
// client's.
function upstreamModel(identity) {
  const names = [identity.upstreamModel, identity.model].map(trimmed).filter(Boolean);
  for (const name of names) {
    if (ALL_MODELS.includes(name)) return name;
  }
  throw new Error((names[0] || "model") + " is not a supported HeyGen model; use " + ALL_MODELS.join(", "));
}

function requestFor(source, model) {
  const kind = modelKind(model);
  if (kind === "video") {
    const request = videoRequest(source);
    checkEngine(request.body, model);
    return request;
  }
  if (kind === "translation") return translationRequest(source);
  return lipsyncRequest(source);
}

// Seconds of speech a script takes: about 2.5 words a second, or 4 CJK
// characters a second, at the voice's speed, rounded up generously.
function scriptSeconds(script, speed) {
  const cjk = (script.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/g) || []).length;
  const rest = script.replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/g, " ");
  const words = rest.split(/\s+/).filter(Boolean).length;
  const letters = rest.replace(/\s+/g, "").length;
  const seconds = (cjk * 0.3 + Math.max(words * 0.5, letters * 0.1)) / (speed || 1) + 2;
  return Math.min(Math.ceil(seconds), MAX_SECONDS);
}

function spanSeconds(body) {
  if (present(body.end_time)) return Math.min(Math.ceil(body.end_time - (body.start_time || 0)), MAX_FACT_SECONDS);
  return UNKNOWN_MEDIA_SECONDS;
}

function reservedFacts(request, model) {
  const body = request.body;
  const kind = modelKind(model);
  if (kind === "video") {
    const seconds = body.script ? scriptSeconds(body.script, body.voice_settings && body.voice_settings.speed) : UNKNOWN_MEDIA_SECONDS;
    return { seconds: seconds, avatar_type: body.type === "image" ? "photo_avatar" : RESERVED_AVATAR_TYPE[model] };
  }
  if (kind === "translation") return { seconds: spanSeconds(body), mode: body.mode, audio_only: body.translate_audio_only === true };
  return { seconds: spanSeconds(body), mode: body.mode };
}

function submitIntent(model, request) {
  return { kind: "submit", model: model, action: request.action, requestBody: Object.assign({}, request.body, { model: model }) };
}

// A body's model, or the given default when it names none. An alias that a
// channel maps passes on to the gateway, which checks it.
function bodyModel(body, fallback, kind) {
  const model = trimmed(body.model);
  if (!model) return fallback;
  if (ALL_MODELS.includes(model) && modelKind(model) !== kind) throw new Error(model + " is not served on this endpoint");
  return model;
}

function jsonBody(ctx) {
  if (!ctx.body || ctx.body.kind !== "json") throw new Error("JSON body required");
  const body = plainObject(ctx.body.value);
  if (!body) throw new Error("request body must be an object");
  return body;
}

// HeyGen wraps every reply in {data: ...}; the gateway may hold either form.
function unwrap(value) {
  const object = plainObject(value);
  if (!object) return {};
  const inner = plainObject(object.data);
  return inner && !present(object.status) && !present(object.id) ? inner : object;
}

function headers(ctx, json) {
  const out = { Accept: "application/json", "X-Api-Key": ctx.apiKey };
  if (json) out["Content-Type"] = "application/json";
  return out;
}

const PATHS = { video: "/v3/videos", translation: "/v3/video-translations", lipsync: "/v3/lipsyncs" };

function taskKind(ctx) {
  const kind = actionKind(ctx.action);
  if (kind) return kind;
  try {
    return modelKind(upstreamModel(ctx));
  } catch (_error) {
    return "video";
  }
}

function statusURL(ctx, kind, id) {
  return ctx.baseUrl + PATHS[kind] + "/" + encodeURIComponent(id);
}

// The deliverables of a finished job, each with its HeyGen URL.
function artifactEntries(kind, data) {
  const object = unwrap(data);
  if (object.status !== "completed") return [];
  const fields =
    kind === "translation"
      ? [["video", "video_url", "video"], ["audio", "audio_url", "audio"], ["captions-srt", "srt_caption_url", "file"], ["captions-vtt", "vtt_caption_url", "file"]]
      : kind === "lipsync"
        ? [["video", "video_url", "video"], ["captions", "caption_url", "file"]]
        : [["video", "video_url", "video"], ["captioned-video", "captioned_video_url", "video"], ["subtitles", "subtitle_url", "file"], ["thumbnail", "thumbnail_url", "image"]];
  const entries = [];
  for (const field of fields) {
    const url = trimmed(object[field[1]]);
    if (!url) continue;
    entries.push({ key: field[0], type: field[2], url: url, mimeType: mimeType(field[0], url) });
  }
  return entries;
}

function mimeType(key, url) {
  const path = trimmed(url).split("?")[0].toLowerCase();
  if (/\.webm$/.test(path)) return "video/webm";
  if (/\.mp4$/.test(path)) return "video/mp4";
  if (/\.mp3$/.test(path)) return "audio/mpeg";
  if (/\.wav$/.test(path)) return "audio/wav";
  if (/\.vtt$/.test(path) || key === "captions-vtt") return "text/vtt";
  if (/\.srt$/.test(path) || key === "captions-srt" || key === "captions" || key === "subtitles") return "application/x-subrip";
  if (/\.png$/.test(path)) return "image/png";
  if (/\.jpe?g$/.test(path) || key === "thumbnail") return "image/jpeg";
  if (key === "audio") return "audio/mpeg";
  return "video/mp4";
}

function failureReason(data) {
  const object = unwrap(data);
  const message = trimmed(object.failure_message);
  const code = trimmed(object.failure_code);
  if (message && code) return message + " (" + code + ")";
  return message || code || "HeyGen job failed";
}

// HeyGen's job object without account details (folder, delivery targets,
// callback ids, the HeyGen app page). Output URLs become the gateway's
// download addresses, which outlast HeyGen's presigned links.
function publicJob(kind, data, taskId, artifacts) {
  const object = unwrap(data);
  const keep =
    kind === "translation"
      ? ["title", "status", "output_language", "input_language", "duration", "translate_audio_only", "created_at", "failure_code", "failure_message"]
      : kind === "lipsync"
        ? ["title", "status", "duration", "created_at", "failure_code", "failure_message"]
        : ["title", "status", "created_at", "completed_at", "duration", "failure_code", "failure_message"];
  const out = { id: taskId };
  for (const key of keep) {
    if (object[key] !== undefined) out[key] = object[key];
  }
  const urlFields = { video: "video_url", audio: "audio_url", "captions-srt": "srt_caption_url", "captions-vtt": "vtt_caption_url", captions: "caption_url", "captioned-video": "captioned_video_url", subtitles: "subtitle_url", thumbnail: "thumbnail_url" };
  for (const entry of artifactEntries(kind, data)) {
    const artifact = artifacts ? artifacts[entry.key] : null;
    if (artifact && trimmed(artifact.url)) out[urlFields[entry.key]] = trimmed(artifact.url);
  }
  return { data: out };
}

function statusPresenter(kind) {
  return function (ctx, task) {
    // The gateway can fail a job HeyGen still reports as running, after poll
    // failures or the task timeout.
    if (task.status === "FAILURE" && unwrap(task.data).status !== "failed") {
      const reply = publicJob(kind, task.data, task.task_id, null);
      reply.data.status = "failed";
      reply.data.failure_code = "gateway_failed";
      reply.data.failure_message = task.fail_reason || "HeyGen job failed";
      return reply;
    }
    return publicJob(kind, task.data, task.task_id, ctx.artifacts);
  };
}

export const native = {
  // HeyGen's own POST /v3/videos body. The engine picks the model when the
  // body names none; without either it is Avatar IV, HeyGen's default.
  createVideo: function (ctx) {
    const body = jsonBody(ctx);
    let fallback = DEFAULT_AVATAR_MODEL;
    const engine = plainObject(body.engine);
    if (engine && present(engine.type)) {
      const type = enumValue(engine.type, "engine.type", ["avatar_iii", "avatar_iv", "avatar_v"]);
      fallback = AVATAR_MODELS.filter((name) => ENGINES[name] === type)[0];
    }
    const model = bodyModel(body, fallback, "video");
    const request = videoRequest(body);
    if (AVATAR_MODELS.includes(model)) checkEngine(request.body, model);
    return submitIntent(model, request);
  },
  videoCreated: function (ctx, task) {
    const object = unwrap(task.data);
    const data = { video_id: task.task_id, status: trimmed(object.status) || "pending" };
    if (object.output_format) data.output_format = object.output_format;
    if (object.resolution) data.resolution = object.resolution;
    return { data: data };
  },
  videoStatus: statusPresenter("video"),
  createTranslation: function (ctx) {
    const body = jsonBody(ctx);
    return submitIntent(bodyModel(body, TRANSLATE_MODEL, "translation"), translationRequest(body));
  },
  translationCreated: function (ctx, task) {
    return { data: { video_translation_ids: [task.task_id] } };
  },
  translationStatus: statusPresenter("translation"),
  createLipsync: function (ctx) {
    const body = jsonBody(ctx);
    return submitIntent(bodyModel(body, LIPSYNC_MODEL, "lipsync"), lipsyncRequest(body));
  },
  lipsyncCreated: function (ctx, task) {
    return { data: { lipsync_id: task.task_id } };
  },
  lipsyncStatus: statusPresenter("lipsync"),
  error: function (ctx, error) {
    return { error: { code: error.code || "invalid_request", message: error.message } };
  },
};

function stripModel(body) {
  const out = Object.assign({}, body);
  delete out.model;
  return out;
}

export function buildSubmitRequest(ctx) {
  const model = upstreamModel(ctx);
  const request = requestFor(stripModel(ctx.requestBody || {}), model);
  const body = request.body;
  if (modelKind(model) === "video" && body.type === "avatar") body.engine = Object.assign({}, body.engine, { type: ENGINES[model] });
  return {
    url: ctx.baseUrl + PATHS[modelKind(model)],
    method: "POST",
    headers: headers(ctx, true),
    body: body,
    action: request.action,
  };
}

// The id HeyGen returns, and for an avatar look the id whose type settles
// the price.
export function parseSubmitResponse(ctx, resp) {
  const object = unwrap(resp.body);
  const kind = modelKind(upstreamModel(ctx));
  let id = "";
  if (kind === "translation") {
    const ids = Array.isArray(object.video_translation_ids) ? object.video_translation_ids : [];
    if (ids.length !== 1) throw new Error("HeyGen returned " + ids.length + " translation ids; expected one");
    id = trimmed(ids[0]);
  } else if (kind === "lipsync") {
    id = trimmed(object.lipsync_id);
  } else {
    id = trimmed(object.video_id);
  }
  if (!id) throw new Error("HeyGen did not return a job id");
  const result = { taskId: id, taskData: object };
  const body = ctx.requestBody || {};
  if (kind === "video") result.state = body.type === "image" ? { avatar_type: "photo_avatar" } : { avatar_id: trimmed(body.avatar_id), lookups: 0 };
  else result.state = { mode: MODES.includes(body.mode) ? body.mode : "speed", audio_only: body.translate_audio_only === true };
  return result;
}

export function extractUsage(ctx) {
  // Per-second billing has no ratio to scale.
  if (ctx.usagePurpose === "billing_ratios") return null;
  const model = upstreamModel(ctx);
  return reservedFacts(requestFor(stripModel(ctx.requestBody || {}), model), model);
}

export function buildQueryRequest(ctx) {
  return { url: statusURL(ctx, taskKind(ctx), ctx.taskId), method: "GET", headers: headers(ctx, false) };
}

// Reads the type of the avatar look a video uses (digital twin, studio or
// photo avatar), which sets its per-second price. A failed lookup is tried
// again on a later poll, a few times at most.
function lookState(ctx) {
  const state = plainObject(ctx.state);
  if (!state || state.avatar_type || !trimmed(state.avatar_id) || (state.lookups || 0) >= MAX_LOOK_LOOKUPS) return null;
  const next = Object.assign({}, state, { lookups: (state.lookups || 0) + 1 });
  try {
    const response = utils.fetch({ url: ctx.baseUrl + "/v3/avatars/looks/" + encodeURIComponent(state.avatar_id), headers: headers(ctx, false) });
    const type = response.status === 200 ? trimmed(unwrap(response.body).avatar_type) : "";
    if (AVATAR_TYPES.includes(type)) next.avatar_type = type;
  } catch (_error) {
    // Keep polling; settlement falls back to the reserved type.
  }
  return next;
}

export function parseTaskResult(ctx, body, response) {
  const object = unwrap(body);
  const kind = taskKind(ctx);
  const status = trimmed(object.status).toLowerCase();
  let result;
  if (status === "waiting" || status === "pending" || status === "queued") result = { status: "QUEUED" };
  else if (status === "processing" || status === "running" || status === "in_progress") result = { status: "IN_PROGRESS" };
  else if (status === "completed") {
    const ready = artifactEntries(kind, object).some((entry) => entry.key === "video" || entry.key === "audio");
    result = ready ? { status: "SUCCESS", progress: "100%" } : { status: "FAILURE", reason: "HeyGen returned no output" };
  } else if (status === "failed") result = { status: "FAILURE", reason: failureReason(object) };
  else return { status: "UNKNOWN", reason: "unrecognized status: " + status };
  if (kind === "video" && result.status !== "FAILURE") {
    const state = lookState(ctx);
    if (state) result.state = state;
  }
  return result;
}

function settledAvatarType(task, result, model) {
  const states = [plainObject(result && result.plugin_state), plainObject(task.state)];
  for (const state of states) {
    if (state && AVATAR_TYPES.includes(state.avatar_type)) return state.avatar_type;
  }
  return RESERVED_AVATAR_TYPE[model];
}

// Settles on the duration HeyGen reports for the finished job. Without one
// the reservation stands.
export function extractUsageOnComplete(task, result, body) {
  const object = unwrap(body);
  if (object.status !== "completed") return null;
  const duration = Number(object.duration);
  if (!(duration > 0) || !Number.isFinite(duration)) return null;
  const seconds = Math.min(Math.ceil(duration), MAX_FACT_SECONDS);
  const model = upstreamModel(task);
  const kind = modelKind(model);
  if (kind === "video") return { seconds: seconds, avatar_type: settledAvatarType(task, result, model) };
  const state = plainObject(task.state) || {};
  const mode = MODES.includes(state.mode) ? state.mode : "speed";
  if (kind === "translation") return { seconds: seconds, mode: mode, audio_only: object.translate_audio_only === true || state.audio_only === true };
  return { seconds: seconds, mode: mode };
}

export function listArtifacts(task) {
  if (task.status !== "SUCCESS") return [];
  return artifactEntries(taskKind(task), task.data).map(function (entry) {
    return { key: entry.key, type: entry.type, mimeType: entry.mimeType };
  });
}

function artifactURL(kind, data, key) {
  for (const entry of artifactEntries(kind, data)) {
    if (entry.key === key) return entry.url;
  }
  return "";
}

// HeyGen's output URLs are presigned and expire, so a download asks HeyGen
// for fresh ones first and falls back to the URL from the last poll.
export function buildContentRequest(ctx) {
  const kind = taskKind(ctx);
  let url = "";
  if (trimmed(ctx.upstreamTaskId)) {
    try {
      const response = utils.fetch({ url: statusURL(ctx, kind, ctx.upstreamTaskId), headers: headers(ctx, false) });
      if (response.status === 200) url = artifactURL(kind, response.body, ctx.artifactKey);
    } catch (_error) {
      url = "";
    }
  }
  if (!url) url = artifactURL(kind, ctx.data, ctx.artifactKey);
  if (!url) throw new Error("artifact_not_found");
  return { url: url, method: ctx.clientRequest.method, credentialless: true };
}

function nearestRatio(width, height) {
  let best = "16:9";
  let nearest = Infinity;
  for (const ratio of ["16:9", "9:16", "4:5", "5:4", "1:1"]) {
    const sides = ratio.split(":").map(Number);
    const distance = Math.abs(Math.log(width / height) - Math.log(sides[0] / sides[1]));
    if (distance < nearest) {
      nearest = distance;
      best = ratio;
    }
  }
  return best;
}

// An OpenAI WIDTHxHEIGHT size picks the nearest HeyGen aspect ratio and the
// resolution of its shorter side; a bare resolution is taken as it is.
function sizeOptions(size) {
  const text = trimmed(size).toLowerCase();
  if (RESOLUTIONS.includes(text)) return { resolution: text };
  const parts = text.replace("*", "x").split("x");
  const width = Number(parts[0]);
  const height = Number(parts[1]);
  if (parts.length !== 2 || !(width > 0) || !(height > 0)) throw new Error("size must be WIDTHxHEIGHT or one of " + RESOLUTIONS.join(", "));
  const shorter = Math.min(width, height);
  return { aspect_ratio: nearestRatio(width, height), resolution: shorter >= 2160 ? "4k" : shorter >= 1080 ? "1080p" : "720p" };
}

function booleanField(value, name) {
  if (value === undefined || typeof value === "boolean") return value;
  if (value === "true" || value === "false") return value === "true";
  throw new Error(name + " must be true or false");
}

function jsonField(value, name) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(name + " must be a JSON object");
  }
}

// The OpenAI video API: prompt is the script, input_reference a portrait to
// animate (a talking photo), size the aspect ratio and resolution, plus
// HeyGen's avatar_id, voice_id, audio_url and the other video fields. The
// script sets the length, so seconds is refused.
function openAIVideoRequest(req) {
  if (given(req.seconds) || given(req.duration)) throw new Error("seconds is not supported; the script or audio sets the video length");
  const source = {};
  const passthrough = ["avatar_id", "voice_id", "audio_url", "title", "folder_id", "brand_glossary_id", "resolution", "aspect_ratio", "fit", "output_format", "motion_prompt", "expressiveness"];
  for (const key of passthrough) {
    if (given(req[key])) source[key] = req[key];
  }
  if (given(req.prompt)) source.script = req.prompt;
  if (given(req.size)) {
    const sized = sizeOptions(req.size);
    if (!source.resolution) source.resolution = sized.resolution;
    if (!source.aspect_ratio && sized.aspect_ratio) source.aspect_ratio = sized.aspect_ratio;
  }
  const image = given(req.input_reference) ? req.input_reference : req.image;
  if (given(image)) source.image = image;
  if (given(req.type)) source.type = req.type;
  const removeBackground = booleanField(req.remove_background, "remove_background");
  if (removeBackground !== undefined) source.remove_background = removeBackground;
  for (const key of ["voice_settings", "background", "caption", "engine"]) {
    if (given(req[key])) source[key] = jsonField(req[key], key);
  }
  for (const key of ["callback_url", "callback_id"]) {
    if (given(req[key])) source[key] = req[key];
  }
  return videoRequest(source);
}

function openAIImage(value) {
  const object = plainObject(value);
  if (object && present(object.image_url)) return typeof object.image_url === "string" ? object.image_url : plainObject(object.image_url) ? object.image_url.url : object.image_url;
  return value;
}

function protocolModel(ctx) {
  try {
    return upstreamModel({ upstreamModel: ctx.upstreamModel, model: ctx.model });
  } catch (_error) {
    return "";
  }
}

// Multipart text fields, each given once.
function formFields(body) {
  const req = {};
  const fields = body.fields || {};
  for (const name of Object.keys(fields)) {
    if (fields[name].length > 1) throw new Error(name + " must be provided once");
    req[name] = fields[name][0];
  }
  return req;
}

export const protocols = {
  openai_video: {
    decodeRequest: function (ctx) {
      if (!ctx.body || (ctx.body.kind !== "json" && ctx.body.kind !== "multipart")) throw new Error("JSON or multipart body required");
      let req;
      if (ctx.body.kind === "json") {
        req = plainObject(ctx.body.value);
        if (!req) throw new Error("JSON object required");
        if (present(req.input_reference)) req = Object.assign({}, req, { input_reference: openAIImage(req.input_reference) });
      } else {
        req = formFields(ctx.body);
        const files = ctx.body.files || [];
        for (const file of files) {
          if (file.field !== "input_reference") throw new Error("unexpected file field: " + file.field);
        }
        if (files.length > 1) throw new Error("input_reference must be provided once");
        if (files.length) {
          if (!/^image\//.test(files[0].mimeType || "")) throw new Error("input_reference must be an image");
          req.input_reference = { type: "base64", media_type: files[0].mimeType.toLowerCase(), data: { __fileRef: files[0].ref, encoding: "base64" } };
        }
      }
      const request = openAIVideoRequest(req);
      const model = protocolModel(ctx);
      if (AVATAR_MODELS.includes(model)) checkEngine(request.body, model);
      return submitIntent(ctx.model, request);
    },
    // The host owns id, status, progress and timestamps.
    render: function (ctx, task) {
      const object = unwrap(task.data);
      const output = { object: "video" };
      if (Number(object.duration) > 0) output.seconds = String(Math.ceil(Number(object.duration)));
      if (task.status === "FAILURE") output.error = { code: trimmed(object.failure_code) || "video_generation_failed", message: task.fail_reason || failureReason(object) };
      return output;
    },
  },
};
