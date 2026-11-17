// Runs the plugin's hooks the way the gateway calls them: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let fetchImpl = () => {
  throw new Error("utils.fetch is not available");
};
const fetched = [];
globalThis.utils = {
  fetch: (request) => {
    fetched.push(request);
    return fetchImpl(request);
  },
};

const plugin = await import("../plugin.js");
const { meta, native, protocols } = plugin;

const BASE = "https://api.heygen.com";

function json(value) {
  return { method: "POST", path: "/", params: {}, query: {}, requestHeaders: {}, body: { kind: "json", value } };
}

function driver(intent, extra) {
  return Object.assign(
    { requestBody: intent.requestBody, requestHeaders: {}, action: intent.action, model: intent.model, upstreamModel: intent.model, baseUrl: BASE, apiKey: "hg-test", authHeader: "Bearer hg-test", upstream: { kind: "vendor" }, config: {}, files: [], publicTaskId: "task_new" },
    extra || {},
  );
}

function query(model, action, extra) {
  return Object.assign({ taskId: "vid_1", publicTaskId: "task_pub", action: action, model: model, upstreamModel: model, baseUrl: BASE, apiKey: "hg-test", authHeader: "Bearer hg-test", upstream: { kind: "vendor" }, config: {}, data: null, state: null }, extra || {});
}

const AVATAR = { model: "heygen-avatar-iv", avatar_id: "look_1", script: "Hello there, this is a short test script.", voice_id: "voice_1" };

test("manifest follows the community rules", () => {
  assert.equal(meta.apiVersion, 1);
  assert.equal(meta.key, meta.author.name.toLowerCase() + "_heygen");
  assert.match(meta.key, /^[a-z0-9_]{1,30}$/);
  assert.match(meta.version, /^\d+\.\d+\.\d+$/);
  assert.equal(meta.baseUrl, BASE);
  assert.equal(meta.channelTypes, undefined);
  assert.ok(meta.website.startsWith("https://"));
  assert.ok(!JSON.stringify(meta).includes("$"));
});

test("meta is a plain JSON literal", () => {
  const source = readFileSync(new URL("../plugin.js", import.meta.url), "utf8");
  const start = source.indexOf("export const meta = ") + "export const meta = ".length;
  const end = source.indexOf("\n};\n", start) + 2;
  const literal = source.slice(start, end).replace(/^\s*\/\/[^\n]*\n/gm, "");
  assert.deepEqual(JSON.parse(literal), meta);
});

test("usage profiles cover every model with complete examples", () => {
  const covered = [];
  for (const profile of meta.usageProfiles) {
    covered.push(...profile.models);
    for (const example of profile.examples) assert.deepEqual(Object.keys(example.facts).sort(), Object.keys(profile.schema).sort());
  }
  assert.deepEqual(covered.sort(), meta.models.slice().sort());
  for (const example of meta.usageExamples) assert.deepEqual(Object.keys(example.facts).sort(), Object.keys(meta.usageSchema).sort());
});

test("avatar video maps the model to its engine", () => {
  const intent = native.createVideo(json(AVATAR));
  assert.equal(intent.model, "heygen-avatar-iv");
  assert.equal(intent.action, "avatar_video");
  const request = plugin.buildSubmitRequest(driver(intent));
  assert.equal(request.url, BASE + "/v3/videos");
  assert.equal(request.headers["X-Api-Key"], "hg-test");
  assert.equal(request.headers.Authorization, undefined);
  assert.deepEqual(request.body, { type: "avatar", avatar_id: "look_1", script: AVATAR.script, voice_id: "voice_1", engine: { type: "avatar_iv" } });
  const mapped = plugin.buildSubmitRequest(driver(intent, { model: "avatar", upstreamModel: "heygen-avatar-v" }));
  assert.deepEqual(mapped.body.engine, { type: "avatar_v" });
  assert.equal(new URL(mapped.url).host, new URL(meta.baseUrl).host);
});

test("engine in the body picks the model when none is given", () => {
  const body = Object.assign({}, AVATAR, { engine: { type: "avatar_v", more_blinking: true } });
  delete body.model;
  const intent = native.createVideo(json(body));
  assert.equal(intent.model, "heygen-avatar-v");
  assert.deepEqual(plugin.buildSubmitRequest(driver(intent)).body.engine, { type: "avatar_v", more_blinking: true });
  const plain = Object.assign({}, AVATAR);
  delete plain.model;
  assert.equal(native.createVideo(json(plain)).model, "heygen-avatar-iv");
});

test("talking photo runs on Avatar IV", () => {
  const intent = native.createVideo(json({ model: "heygen-avatar-iv", image: "https://x/p.jpg", script: "Hi", voice_id: "v", expressiveness: "high" }));
  assert.equal(intent.action, "talking_photo");
  const request = plugin.buildSubmitRequest(driver(intent));
  assert.deepEqual(request.body, { type: "image", image: { type: "url", url: "https://x/p.jpg" }, script: "Hi", voice_id: "v", expressiveness: "high" });
  assert.equal(plugin.extractUsage(driver(intent)).avatar_type, "photo_avatar");
  assert.throws(() => native.createVideo(json({ model: "heygen-avatar-v", image: "https://x/p.jpg", script: "Hi", voice_id: "v" })), /heygen-avatar-iv only/);
});

test("video validation errors", () => {
  const bad = (extra, pattern) => assert.throws(() => native.createVideo(json(Object.assign({}, AVATAR, extra))), pattern);
  bad({ callback_url: "https://x" }, /callback_url is not supported/);
  bad({ audio_url: "https://x/a.mp3" }, /cannot be combined/);
  bad({ script: undefined }, /script or audio_url is required/);
  bad({ avatar_id: "" }, /avatar_id is required/);
  bad({ resolution: "8k" }, /resolution must be one of/);
  bad({ engine: { type: "avatar_iii" } }, /does not match model/);
  bad({ expressiveness: "high", model: "heygen-avatar-v" }, /only valid on heygen-avatar-iv/);
  bad({ motion_prompt: "wave", model: "heygen-avatar-iii" }, /not supported on heygen-avatar-iii/);
  bad({ temperature: 1 }, /temperature is not supported/);
  bad({ audio_asset_id: "a" }, /pass audio_url/);
  bad({ background: { type: "color", value: "red" } }, /hex color/);
  bad({ output_format: "webm", background: { type: "color", value: "#ffffff" } }, /webm/);
  bad({ model: "heygen-lipsync" }, /not served on this endpoint/);
  assert.throws(() => native.createVideo(json({ model: "heygen-avatar-iv", image: { type: "asset_id", asset_id: "x" }, script: "a", voice_id: "v" })), /asset_id is not supported/);
  assert.throws(() => native.createVideo({ body: { kind: "multipart", fields: {}, files: [] } }), /JSON body required/);
});

test("reservation estimates script length and the dearest avatar type", () => {
  const short = plugin.extractUsage(driver(native.createVideo(json(AVATAR))));
  assert.deepEqual(Object.keys(short).sort(), ["avatar_type", "seconds"]);
  assert.equal(short.avatar_type, "digital_twin");
  assert.ok(short.seconds >= 4 && short.seconds <= 10, String(short.seconds));
  const long = plugin.extractUsage(driver(native.createVideo(json(Object.assign({}, AVATAR, { script: "word ".repeat(150) })))));
  assert.ok(long.seconds >= 60, String(long.seconds));
  const slow = plugin.extractUsage(driver(native.createVideo(json(Object.assign({}, AVATAR, { script: "word ".repeat(150), voice_settings: { speed: 0.5 } })))));
  assert.ok(slow.seconds > long.seconds);
  const cjk = plugin.extractUsage(driver(native.createVideo(json(Object.assign({}, AVATAR, { script: "你好".repeat(50) })))));
  assert.ok(cjk.seconds >= 25, String(cjk.seconds));
  const audio = plugin.extractUsage(driver(native.createVideo(json({ model: "heygen-avatar-iii", avatar_id: "l", audio_url: "https://x/a.mp3" }))));
  assert.deepEqual(audio, { seconds: 300, avatar_type: "studio_avatar" });
  assert.equal(plugin.extractUsage(Object.assign(driver(native.createVideo(json(AVATAR))), { usagePurpose: "billing_ratios" })), null);
});

test("submit response keeps the video id and the look to price", () => {
  const intent = native.createVideo(json(AVATAR));
  const parsed = plugin.parseSubmitResponse(driver(intent), { statusCode: 200, headers: {}, body: { data: { video_id: "vid_1", status: "waiting" } } });
  assert.equal(parsed.taskId, "vid_1");
  assert.deepEqual(parsed.state, { avatar_id: "look_1", lookups: 0 });
  assert.throws(() => plugin.parseSubmitResponse(driver(intent), { statusCode: 200, headers: {}, body: { data: {} } }), /job id/);
});

test("poll states map to gateway statuses and the look type is read once", () => {
  const ctx = query("heygen-avatar-iv", "avatar_video", { state: { avatar_id: "look_1", lookups: 0 } });
  fetchImpl = () => ({ status: 200, headers: {}, body: { data: { id: "look_1", avatar_type: "photo_avatar" } } });
  fetched.length = 0;
  const running = plugin.parseTaskResult(ctx, { data: { id: "vid_1", status: "processing" } }, { status: 200, headers: {} });
  assert.equal(running.status, "IN_PROGRESS");
  assert.deepEqual(running.state, { avatar_id: "look_1", lookups: 1, avatar_type: "photo_avatar" });
  assert.equal(fetched[0].url, BASE + "/v3/avatars/looks/look_1");
  const known = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video", { state: running.state }), { data: { status: "pending" } }, { status: 200, headers: {} });
  assert.deepEqual(known, { status: "QUEUED" });
  assert.equal(fetched.length, 1);
  const done = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video", { state: running.state }), { data: { status: "completed", video_url: "https://cdn/v.mp4", duration: 12.4 } }, { status: 200, headers: {} });
  assert.equal(done.status, "SUCCESS");
  const empty = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video"), { data: { status: "completed" } }, { status: 200, headers: {} });
  assert.equal(empty.status, "FAILURE");
  const failed = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video"), { data: { status: "failed", failure_code: "moderation_rejected", failure_message: "Blocked" } }, { status: 200, headers: {} });
  assert.deepEqual(failed, { status: "FAILURE", reason: "Blocked (moderation_rejected)" });
  assert.equal(plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video"), { data: { status: "paused" } }, { status: 200, headers: {} }).status, "UNKNOWN");
  fetchImpl = () => {
    throw new Error("down");
  };
  const retry = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video", { state: { avatar_id: "l", lookups: 2 } }), { data: { status: "processing" } }, { status: 200, headers: {} });
  assert.deepEqual(retry.state, { avatar_id: "l", lookups: 3 });
  const stop = plugin.parseTaskResult(query("heygen-avatar-iv", "avatar_video", { state: retry.state }), { data: { status: "processing" } }, { status: 200, headers: {} });
  assert.equal(stop.state, undefined);
});

test("completion settles on the reported duration and look type", () => {
  const body = { data: { status: "completed", video_url: "https://cdn/v.mp4", duration: 12.4 } };
  assert.deepEqual(plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video", { state: { avatar_type: "photo_avatar" } }), {}, body), { seconds: 13, avatar_type: "photo_avatar" });
  assert.deepEqual(plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video", { state: { avatar_id: "l" } }), { plugin_state: { avatar_type: "studio_avatar" } }, body), { seconds: 13, avatar_type: "studio_avatar" });
  assert.deepEqual(plugin.extractUsageOnComplete(query("heygen-avatar-v", "avatar_video", { state: { avatar_id: "l" } }), {}, body), { seconds: 13, avatar_type: "digital_twin" });
  assert.equal(plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video"), {}, { data: { status: "completed", video_url: "x" } }), null);
  assert.equal(plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video"), {}, { data: { status: "processing", duration: 3 } }), null);
  assert.equal(plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video"), {}, { data: { status: "completed", duration: 99999 } }).seconds, 3600);
});

test("artifacts, download and presenters", () => {
  const data = { data: { id: "vid_1", status: "completed", video_url: "https://cdn/v.mp4?sig=1", subtitle_url: "https://cdn/s.srt", thumbnail_url: "https://cdn/t.jpg", duration: 5, folder_id: "f", video_page_url: "https://app" } };
  const artifacts = plugin.listArtifacts({ taskId: "vid_1", status: "SUCCESS", action: "avatar_video", data });
  assert.deepEqual(artifacts, [
    { key: "video", type: "video", mimeType: "video/mp4" },
    { key: "subtitles", type: "file", mimeType: "application/x-subrip" },
    { key: "thumbnail", type: "image", mimeType: "image/jpeg" },
  ]);
  assert.deepEqual(plugin.listArtifacts({ taskId: "vid_1", status: "FAILURE", action: "avatar_video", data }), []);
  fetchImpl = () => ({ status: 200, headers: {}, body: { data: { status: "completed", video_url: "https://cdn/fresh.mp4" } } });
  const content = plugin.buildContentRequest(Object.assign(driver({ action: "avatar_video", model: "heygen-avatar-iv" }), { artifactKey: "video", data, upstreamTaskId: "vid_1", clientRequest: { method: "GET", headers: {} } }));
  assert.deepEqual(content, { url: "https://cdn/fresh.mp4", method: "GET", credentialless: true });
  fetchImpl = () => ({ status: 500, headers: {}, body: "" });
  const fallback = plugin.buildContentRequest(Object.assign(driver({ action: "avatar_video", model: "heygen-avatar-iv" }), { artifactKey: "subtitles", data, upstreamTaskId: "vid_1", clientRequest: { method: "HEAD", headers: {} } }));
  assert.equal(fallback.url, "https://cdn/s.srt");
  assert.throws(() => plugin.buildContentRequest(Object.assign(driver({ action: "avatar_video", model: "heygen-avatar-iv" }), { artifactKey: "audio", data, upstreamTaskId: "", clientRequest: { method: "GET", headers: {} } })), /artifact_not_found/);
  const shown = native.videoStatus({ artifacts: { video: { url: "https://gw/video" } } }, { task_id: "task_pub", status: "SUCCESS", data });
  assert.deepEqual(shown, { data: { id: "task_pub", status: "completed", duration: 5, video_url: "https://gw/video" } });
  const gatewayFailed = native.videoStatus({ artifacts: {} }, { task_id: "task_pub", status: "FAILURE", fail_reason: "timeout", data: { data: { status: "processing" } } });
  assert.equal(gatewayFailed.data.status, "failed");
  assert.equal(gatewayFailed.data.failure_code, "gateway_failed");
  assert.deepEqual(native.videoCreated({}, { task_id: "task_pub", data: { video_id: "vid_1", status: "waiting" } }), { data: { video_id: "task_pub", status: "waiting" } });
});

test("video translation: one language, mode and audio-only facts", () => {
  const intent = native.createTranslation(json({ video: "https://x/in.mp4", output_language: "Spanish (Spain)", mode: "precision", end_time: 42.5 }));
  assert.equal(intent.model, "heygen-video-translate");
  const request = plugin.buildSubmitRequest(driver(intent));
  assert.equal(request.url, BASE + "/v3/video-translations");
  assert.deepEqual(request.body, { video: { type: "url", url: "https://x/in.mp4" }, output_languages: ["Spanish (Spain)"], mode: "precision", translate_audio_only: false, end_time: 42.5 });
  assert.deepEqual(plugin.extractUsage(driver(intent)), { seconds: 43, mode: "precision", audio_only: false });
  const audio = native.createTranslation(json({ video: { type: "url", url: "https://x/in.mp4" }, output_languages: ["French"], translate_audio_only: true }));
  assert.deepEqual(plugin.extractUsage(driver(audio)), { seconds: 300, mode: "speed", audio_only: true });
  assert.throws(() => native.createTranslation(json({ video: "https://x/in.mp4", output_languages: ["French", "German"] })), /exactly one/);
  assert.throws(() => native.createTranslation(json({ video: "https://x/in.mp4" })), /output_language is required/);
  assert.throws(() => native.createTranslation(json({ video: "https://x/in.mp4", output_language: "French", output_uploads: {} })), /output_uploads/);
  assert.throws(() => native.createTranslation(json({ video: "https://x/in.mp4", output_language: "French", start_time: 10, end_time: 5 })), /after start_time/);
  const parsed = plugin.parseSubmitResponse(driver(intent), { statusCode: 200, headers: {}, body: { data: { video_translation_ids: ["vt_1"] } } });
  assert.deepEqual(parsed, { taskId: "vt_1", taskData: { video_translation_ids: ["vt_1"] }, state: { mode: "precision", audio_only: false } });
  const q = query("heygen-video-translate", "video_translation", { taskId: "vt_1", state: parsed.state });
  assert.equal(plugin.buildQueryRequest(q).url, BASE + "/v3/video-translations/vt_1");
  assert.equal(plugin.parseTaskResult(q, { data: { status: "running" } }, { status: 200, headers: {} }).status, "IN_PROGRESS");
  const done = { data: { status: "completed", video_url: "https://cdn/t.mp4", audio_url: "https://cdn/t.mp3", srt_caption_url: "https://cdn/t.srt", vtt_caption_url: "https://cdn/t.vtt", duration: 41.2 } };
  assert.equal(plugin.parseTaskResult(q, done, { status: 200, headers: {} }).status, "SUCCESS");
  assert.deepEqual(plugin.extractUsageOnComplete(q, {}, done), { seconds: 42, mode: "precision", audio_only: false });
  assert.deepEqual(plugin.listArtifacts({ status: "SUCCESS", action: "video_translation", data: done }).map((a) => a.key), ["video", "audio", "captions-srt", "captions-vtt"]);
  assert.deepEqual(native.translationCreated({}, { task_id: "task_pub" }), { data: { video_translation_ids: ["task_pub"] } });
});

test("lipsync", () => {
  const intent = native.createLipsync(json({ video: "https://x/v.mp4", audio: "https://x/a.wav", mode: "precision", enable_speech_enhancement: true }));
  const request = plugin.buildSubmitRequest(driver(intent));
  assert.equal(request.url, BASE + "/v3/lipsyncs");
  assert.deepEqual(request.body, { video: { type: "url", url: "https://x/v.mp4" }, audio: { type: "url", url: "https://x/a.wav" }, mode: "precision", enable_speech_enhancement: true });
  assert.deepEqual(plugin.extractUsage(driver(intent)), { seconds: 300, mode: "precision" });
  assert.throws(() => native.createLipsync(json({ video: "https://x/v.mp4" })), /audio is required/);
  assert.throws(() => native.createLipsync(json({ video: "https://x/v.mp4", audio: { data: "AAA", media_type: "audio/wav" } })), /must be a URL/);
  const parsed = plugin.parseSubmitResponse(driver(intent), { statusCode: 200, headers: {}, body: { data: { lipsync_id: "ls_1" } } });
  assert.equal(parsed.taskId, "ls_1");
  const q = query("heygen-lipsync", "lipsync", { taskId: "ls_1", state: parsed.state });
  const done = { data: { status: "completed", video_url: "https://cdn/l.mp4", caption_url: "https://cdn/l.srt", duration: 9.5 } };
  assert.deepEqual(plugin.extractUsageOnComplete(q, {}, done), { seconds: 10, mode: "precision" });
  assert.deepEqual(native.lipsyncStatus({ artifacts: {} }, { task_id: "task_pub", status: "SUCCESS", data: done }), { data: { id: "task_pub", status: "completed", duration: 9.5 } });
});

test("OpenAI video API: prompt is the script, input_reference a talking photo", () => {
  const ctx = (value, model) => Object.assign(json(value), { protocol: "openai_video", operation: "create", model: model || "heygen-avatar-iv", stream: false });
  const intent = protocols.openai_video.decodeRequest(ctx({ prompt: "Welcome aboard", avatar_id: "look_1", voice_id: "v", size: "1080x1920" }));
  assert.deepEqual(intent.requestBody, { model: "heygen-avatar-iv", type: "avatar", avatar_id: "look_1", script: "Welcome aboard", voice_id: "v", resolution: "1080p", aspect_ratio: "9:16" });
  const photo = protocols.openai_video.decodeRequest(ctx({ prompt: "Hi", voice_id: "v", input_reference: { image_url: "https://x/p.png" } }));
  assert.equal(photo.action, "talking_photo");
  assert.throws(() => protocols.openai_video.decodeRequest(ctx({ prompt: "Hi", avatar_id: "l", seconds: 8 })), /seconds is not supported/);
  const upload = protocols.openai_video.decodeRequest({ protocol: "openai_video", operation: "create", model: "heygen-avatar-iv", body: { kind: "multipart", fields: { prompt: ["Hi"], voice_id: ["v"] }, files: [{ ref: "request_file:input_reference", field: "input_reference", filename: "p.png", mimeType: "image/png", size: 10 }] } });
  assert.deepEqual(upload.requestBody.image, { type: "base64", media_type: "image/png", data: { __fileRef: "request_file:input_reference", encoding: "base64" } });
  assert.deepEqual(plugin.buildSubmitRequest(driver(upload)).body.image.data, { __fileRef: "request_file:input_reference", encoding: "base64" });
  assert.deepEqual(protocols.openai_video.render({}, { status: "SUCCESS", data: { data: { status: "completed", duration: 7.2 } } }), { object: "video", seconds: "8" });
  assert.equal(protocols.openai_video.render({}, { status: "FAILURE", fail_reason: "bad", data: {} }).error.message, "bad");
});

test("hooks do not mutate their arguments", () => {
  const intent = native.createVideo(json(AVATAR));
  const ctx = driver(intent);
  const before = JSON.stringify(ctx);
  plugin.buildSubmitRequest(ctx);
  plugin.extractUsage(ctx);
  plugin.parseSubmitResponse(ctx, { statusCode: 200, headers: {}, body: { data: { video_id: "v" } } });
  assert.equal(JSON.stringify(ctx), before);
});

test("PLUGIN_KEY matches meta.key and new_api is declared", () => {
  const source = readFileSync(new URL("../plugin.js", import.meta.url), "utf8");
  assert.equal(source.match(/const PLUGIN_KEY = "([^"]+)";/)[1], meta.key);
  assert.deepEqual(meta.upstreams, ["vendor", "new_api"]);
});

// The middle gateway runs this plugin too: the driver addresses its native
// routes under /{key} with the gateway token as a Bearer token, and reads what
// the middle's own presenters render.
const MIDDLE = "https://middle.example";
const viaGateway = { baseUrl: MIDDLE, apiKey: "sk-middle", authHeader: "Bearer sk-middle", upstream: { kind: "new_api" } };

test("new_api: avatar video goes to the middle gateway's native route with Bearer", () => {
  fetched.length = 0;
  const intent = native.createVideo(json(AVATAR));
  const request = plugin.buildSubmitRequest(driver(intent, viaGateway));
  assert.equal(request.url, MIDDLE + "/" + meta.key + "/v3/videos");
  assert.equal(request.headers.Authorization, "Bearer sk-middle");
  assert.equal(request.headers["X-Api-Key"], undefined);
  assert.equal(request.body.model, "heygen-avatar-iv");
  // The middle plugin decodes the body the outer layer sends.
  const middle = native.createVideo(json(request.body));
  assert.equal(middle.model, "heygen-avatar-iv");
  assert.deepEqual(plugin.extractUsage(driver(middle)), plugin.extractUsage(driver(intent, viaGateway)));
  // The middle's submit presenter output, with its public task id.
  const created = native.videoCreated({}, { task_id: "task_mid", data: { data: { video_id: "vid_vendor", status: "pending" } } });
  const parsed = plugin.parseSubmitResponse(driver(intent, viaGateway), { statusCode: 200, headers: {}, body: created });
  assert.equal(parsed.taskId, "task_mid");
  const q = query("heygen-avatar-iv", "avatar_video", Object.assign({ taskId: "task_mid", state: parsed.state }, viaGateway));
  const queryRequest = plugin.buildQueryRequest(q);
  assert.equal(queryRequest.url, MIDDLE + "/" + meta.key + "/v3/videos/task_mid");
  assert.equal(queryRequest.headers.Authorization, "Bearer sk-middle");
  assert.equal(queryRequest.headers["X-Api-Key"], undefined);
  // The middle's query presenter output after the vendor finished.
  const vendorDone = { data: { status: "completed", duration: 41.2, video_url: "https://cdn.heygen/v.mp4", thumbnail_url: "https://cdn.heygen/t.jpg", folder_id: "secret" } };
  const rendered = native.videoStatus({ artifacts: { video: { url: "https://middle.example/signed/video" }, thumbnail: { url: "https://middle.example/signed/thumb" } } }, { task_id: "task_mid", status: "SUCCESS", data: vendorDone });
  assert.equal(rendered.data.folder_id, undefined);
  const result = plugin.parseTaskResult(q, rendered, { statusCode: 200 });
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.state, undefined, "no HeyGen look lookup through a gateway");
  assert.equal(fetched.length, 0);
  // Seconds settle the same as on the middle layer; the look type keeps the reservation.
  assert.deepEqual(plugin.extractUsageOnComplete(q, result, rendered), plugin.extractUsageOnComplete(query("heygen-avatar-iv", "avatar_video", { state: { avatar_id: "look_1" } }), {}, vendorDone));
  const outer = { task_id: "task_outer", status: "SUCCESS", data: rendered, action: "avatar_video", model: "heygen-avatar-iv", upstreamModel: "heygen-avatar-iv" };
  assert.deepEqual(plugin.listArtifacts(outer).map((a) => a.key), ["video", "thumbnail"]);
});

test("new_api: content is the middle gateway's signed download, re-read with Bearer", () => {
  fetched.length = 0;
  fetchImpl = () => ({ status: 200, body: { data: { id: "task_mid", status: "completed", video_url: "https://middle.example/signed/fresh" } } });
  const ctx = Object.assign(query("heygen-lipsync", "lipsync", viaGateway), { upstreamTaskId: "task_mid", artifactKey: "video", clientRequest: { method: "GET" }, data: { data: { status: "completed", video_url: "https://middle.example/signed/old" } } });
  const request = plugin.buildContentRequest(ctx);
  assert.deepEqual(request, { url: "https://middle.example/signed/fresh", method: "GET", credentialless: true });
  assert.equal(fetched[0].url, MIDDLE + "/" + meta.key + "/v3/lipsyncs/task_mid");
  assert.equal(fetched[0].headers.Authorization, "Bearer sk-middle");
  assert.equal(fetched[0].headers["X-Api-Key"], undefined);
  fetchImpl = () => {
    throw new Error("utils.fetch is not available");
  };
});

test("new_api: translation and lipsync read the middle's presenters", () => {
  const translation = native.createTranslation(json({ video: "https://x/v.mp4", output_language: "French", mode: "precision" }));
  const request = plugin.buildSubmitRequest(driver(translation, viaGateway));
  assert.equal(request.url, MIDDLE + "/" + meta.key + "/v3/video-translations");
  assert.equal(native.createTranslation(json(request.body)).model, "heygen-video-translate");
  const created = native.translationCreated({}, { task_id: "task_t", data: { data: { video_translation_ids: ["vt_vendor"] } } });
  const parsed = plugin.parseSubmitResponse(driver(translation, viaGateway), { statusCode: 200, headers: {}, body: created });
  assert.equal(parsed.taskId, "task_t");
  const q = query("heygen-video-translate", "video_translation", Object.assign({ taskId: "task_t", state: parsed.state }, viaGateway));
  assert.equal(plugin.buildQueryRequest(q).url, MIDDLE + "/" + meta.key + "/v3/video-translations/task_t");
  const done = { data: { status: "completed", duration: 30, translate_audio_only: false, video_url: "https://cdn/v.mp4" } };
  const rendered = native.translationStatus({ artifacts: { video: { url: "https://middle.example/s/v" } } }, { task_id: "task_t", status: "SUCCESS", data: done });
  assert.equal(plugin.parseTaskResult(q, rendered, {}).status, "SUCCESS");
  assert.deepEqual(plugin.extractUsageOnComplete(q, {}, rendered), { seconds: 30, mode: "precision", audio_only: false });
  const lipsync = native.createLipsync(json({ video: "https://x/v.mp4", audio: "https://x/a.wav" }));
  const lr = plugin.buildSubmitRequest(driver(lipsync, viaGateway));
  assert.equal(lr.url, MIDDLE + "/" + meta.key + "/v3/lipsyncs");
  const lp = plugin.parseSubmitResponse(driver(lipsync, viaGateway), { statusCode: 200, headers: {}, body: native.lipsyncCreated({}, { task_id: "task_l" }) });
  assert.equal(lp.taskId, "task_l");
  // A task the middle gateway failed reads as failed.
  const failed = native.lipsyncStatus({}, { task_id: "task_l", status: "FAILURE", fail_reason: "timeout", data: { data: { status: "processing" } } });
  assert.equal(plugin.parseTaskResult(query("heygen-lipsync", "lipsync", viaGateway), failed, {}).status, "FAILURE");
});

test("a missing ctx.upstream means the vendor", () => {
  const intent = native.createVideo(json(AVATAR));
  const ctx = driver(intent);
  delete ctx.upstream;
  const request = plugin.buildSubmitRequest(ctx);
  assert.equal(request.url, BASE + "/v3/videos");
  assert.equal(request.headers["X-Api-Key"], "hg-test");
  assert.equal(request.body.model, undefined);
});
