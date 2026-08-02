import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";

let tts = null;
let configKey = "";
let cancelled = false;
let modelPromise = null;
let loadingKey = "";
const warmedKeys = new Set();

self.onmessage = async (event) => {
  const message = event.data || {};
  try {
    if (message.type === "init") {
      await ensureModel(message);
      return;
    }
    if (message.type === "cancel") {
      cancelled = true;
      return;
    }
    if (message.type === "generate") {
      cancelled = false;
      const config = await ensureModel(message);
      await generateAudio(message, config);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      id: message.id,
      code: error?.code || "narration-error",
      message: error?.message || String(error),
    });
  }
};

async function ensureModel(message = {}) {
  const config = resolveConfig(message);
  if (tts && configKey === config.modelKey) {
    await maybeWarmup(config);
    postReady(config);
    return config;
  }
  if (modelPromise && loadingKey === config.modelKey) {
    const loaded = await modelPromise;
    const readyConfig = { ...loaded, requestKey: config.requestKey, profile: config.profile };
    postReady(readyConfig);
    return readyConfig;
  }

  loadingKey = config.modelKey;
  modelPromise = loadModel(config);
  try {
    return await modelPromise;
  } finally {
    modelPromise = null;
    loadingKey = "";
  }
}

function resolveConfig(message = {}) {
  const requested = ["auto", "webgpu", "wasm"].includes(message.performance) ? message.performance : "auto";
  const profile = ["desktop", "mobile", "ios", "ios-safe"].includes(message.profile) ? message.profile : "desktop";
  const iosProfile = profile.startsWith("ios");
  const webgpuAvailable = Boolean(self.navigator?.gpu);
  let device = iosProfile || requested === "wasm" ? "wasm" : "webgpu";
  let fallbackReason = "";
  if (device === "webgpu" && !webgpuAvailable) {
    device = "wasm";
    fallbackReason = "WebGPU is unavailable, so compatibility mode is being used.";
  }
  const dtype = device === "webgpu" ? "fp32" : "q8";
  const warmup = Boolean(message.warmup && device === "webgpu" && profile === "desktop");
  const modelKey = `${device}:${dtype}`;
  const requestKey = message.key || `${requested}:${profile}:${warmup ? "warm" : "cold"}`;
  return { requested, profile, device, dtype, warmup, modelKey, requestKey, fallbackReason };
}

async function loadModel(config) {
  try {
    await loadModelForDevice(config);
    return config;
  } catch (error) {
    if (config.requested !== "auto" || config.device !== "webgpu") throw error;
    tts = null;
    configKey = "";
    const fallback = {
      ...config,
      device: "wasm",
      dtype: "q8",
      warmup: false,
      modelKey: "wasm:q8",
      requestKey: config.requestKey,
      fallbackReason: `WebGPU could not start, so compatibility mode is being used. ${error?.message || ""}`.trim(),
    };
    await loadModelForDevice(fallback);
    return fallback;
  }
}

async function loadModelForDevice(config) {
  if (tts && configKey === config.modelKey) {
    await maybeWarmup(config);
    postReady(config);
    return;
  }
  self.postMessage({ type: "model-start", device: config.device, dtype: config.dtype, preference: config.requested, profile: config.profile, configKey: config.requestKey });
  const nextTts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    device: config.device,
    dtype: config.dtype,
    progress_callback: (item) => self.postMessage({ type: "model-progress", item, device: config.device, dtype: config.dtype, preference: config.requested, profile: config.profile }),
  });
  tts = nextTts;
  configKey = config.modelKey;
  await maybeWarmup(config);
  postReady(config);
}

async function maybeWarmup(config) {
  if (!config.warmup || warmedKeys.has(config.modelKey)) return;
  self.postMessage({ type: "warmup-start", device: config.device, dtype: config.dtype, profile: config.profile });
  await tts.generate("Ready.", { voice: "af_heart", speed: 1 });
  warmedKeys.add(config.modelKey);
}

function postReady(config) {
  self.postMessage({
    type: "ready",
    device: config.device,
    dtype: config.dtype,
    preference: config.requested,
    profile: config.profile,
    configKey: config.requestKey,
    fallbackReason: config.fallbackReason,
    voices: serialiseVoices(tts?.voices),
  });
}

function serialiseVoices(voices) {
  try { return JSON.parse(JSON.stringify(voices)); }
  catch { return voices ? Object.keys(voices) : []; }
}

async function generateAudio(message, config) {
  const chunks = splitForNarration(message.text, chunkSizeFor(config.profile, config.device));
  if (!chunks.length) throw new Error("This chapter has no text to narrate.");

  const pcmPieces = [];
  let totalSamples = 0;
  let samplingRate = 24000;
  let silenceBytes = null;
  const timeoutMs = config.profile.startsWith("ios") ? 65000 : 210000;

  for (let index = 0; index < chunks.length; index += 1) {
    if (cancelled) {
      self.postMessage({ type: "cancelled", id: message.id });
      return;
    }
    self.postMessage({
      type: "generation-progress",
      id: message.id,
      current: index,
      total: chunks.length,
      excerpt: chunks[index].slice(0, 90),
    });

    const result = await withTimeout(
      tts.generate(chunks[index], { voice: message.voice, speed: Number(message.speed) || 1 }),
      timeoutMs,
      index === 0 ? "The first narration section timed out." : `Narration section ${index + 1} timed out.`
    );
    samplingRate = result.sampling_rate || samplingRate;
    const pcm = floatToPcm16(result.audio);
    pcmPieces.push(pcm);
    totalSamples += result.audio.length;

    if (index < chunks.length - 1) {
      if (!silenceBytes) silenceBytes = new Uint8Array(Math.round(samplingRate * 0.24) * 2);
      pcmPieces.push(silenceBytes);
      totalSamples += silenceBytes.byteLength / 2;
    }
  }

  const header = wavHeader(totalSamples, samplingRate);
  const blob = new Blob([header, ...pcmPieces], { type: "audio/wav" });
  self.postMessage({
    type: "complete",
    id: message.id,
    blob,
    duration: totalSamples / samplingRate,
    samplingRate,
    device: config.device,
    dtype: config.dtype,
    profile: config.profile,
  });
}

function chunkSizeFor(profile, device) {
  if (profile === "ios-safe") return 140;
  if (profile === "ios") return 240;
  if (profile === "mobile") return 380;
  if (device === "wasm") return 650;
  return 1100;
}

function splitForNarration(text, maxLength) {
  const normalised = String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalised) return [];

  const output = [];
  const paragraphs = normalised.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  for (const paragraph of paragraphs) {
    const sentences = paragraph.match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g) || [paragraph];
    let current = "";
    for (const rawSentence of sentences) {
      const parts = hardSplit(rawSentence.trim(), maxLength);
      for (const part of parts) {
        const candidate = `${current} ${part}`.trim();
        if (candidate.length > maxLength && current) {
          output.push(current);
          current = part;
        } else {
          current = candidate;
        }
      }
    }
    if (current) output.push(current);
  }
  return output.filter(Boolean);
}

function hardSplit(text, maxLength) {
  if (text.length <= maxLength) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  const pieces = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxLength) {
      if (current) { pieces.push(current); current = ""; }
      for (let i = 0; i < word.length; i += maxLength) pieces.push(word.slice(i, i + maxLength));
      continue;
    }
    const candidate = `${current} ${word}`.trim();
    if (candidate.length > maxLength && current) {
      pieces.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "chunk-timeout";
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function floatToPcm16(samples) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return bytes;
}

function wavHeader(totalSamples, sampleRate) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, totalSamples * 2, true);
  return new Uint8Array(buffer);
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
}
