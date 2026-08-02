import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";

let tts = null;
let configKey = "";
let cancelled = false;

self.onmessage = async (event) => {
  const message = event.data || {};
  try {
    if (message.type === "init") {
      await ensureModel(message.performance || message.device || "auto");
      return;
    }
    if (message.type === "cancel") {
      cancelled = true;
      return;
    }
    if (message.type === "generate") {
      cancelled = false;
      await ensureModel(message.performance || message.device || "auto");
      await generateAudio(message);
    }
  } catch (error) {
    self.postMessage({ type: "error", id: message.id, message: error?.message || String(error) });
  }
};

async function ensureModel(preference) {
  const requested = ["auto", "webgpu", "wasm"].includes(preference) ? preference : "auto";
  const webgpuAvailable = Boolean(self.navigator?.gpu);
  let device = requested === "wasm" ? "wasm" : "webgpu";
  let fallbackReason = "";
  if (device === "webgpu" && !webgpuAvailable) {
    device = "wasm";
    fallbackReason = "WebGPU is unavailable, so compatibility mode is being used.";
  }

  try {
    await loadModelForDevice(device, requested, fallbackReason);
  } catch (error) {
    if (requested !== "auto" || device !== "webgpu") throw error;
    tts = null;
    configKey = "";
    fallbackReason = `WebGPU could not start, so compatibility mode is being used. ${error?.message || ""}`.trim();
    await loadModelForDevice("wasm", requested, fallbackReason);
  }
}

async function loadModelForDevice(device, requested, fallbackReason) {
  const dtype = device === "webgpu" ? "fp32" : "q8";
  const key = `${device}:${dtype}`;
  if (tts && configKey === key) {
    self.postMessage({ type: "ready", device, dtype, preference: requested, fallbackReason, voices: serialiseVoices(tts.voices) });
    return;
  }
  self.postMessage({ type: "model-start", device, dtype, preference: requested, fallbackReason });
  const nextTts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    device,
    dtype,
    progress_callback: (item) => self.postMessage({ type: "model-progress", item, device, dtype, preference: requested }),
  });
  tts = nextTts;
  configKey = key;
  self.postMessage({ type: "ready", device, dtype, preference: requested, fallbackReason, voices: serialiseVoices(tts.voices) });
}

function serialiseVoices(voices) {
  try {
    return JSON.parse(JSON.stringify(voices));
  } catch {
    return voices ? Object.keys(voices) : [];
  }
}

async function generateAudio({ id, text, voice, speed, performance }) {
  const chunks = splitForNarration(text, messageChunkSize(performance));
  if (!chunks.length) throw new Error("This chapter has no text to narrate.");

  const audioChunks = [];
  let samplingRate = 24000;
  for (let index = 0; index < chunks.length; index += 1) {
    if (cancelled) {
      self.postMessage({ type: "cancelled", id });
      return;
    }
    self.postMessage({
      type: "generation-progress",
      id,
      current: index,
      total: chunks.length,
      excerpt: chunks[index].slice(0, 90),
    });
    const result = await tts.generate(chunks[index], { voice, speed: Number(speed) || 1 });
    samplingRate = result.sampling_rate || samplingRate;
    audioChunks.push(result.audio);
  }

  const silenceSamples = Math.round(samplingRate * 0.28);
  const totalSamples = audioChunks.reduce((sum, chunk, index) => sum + chunk.length + (index < audioChunks.length - 1 ? silenceSamples : 0), 0);
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (let index = 0; index < audioChunks.length; index += 1) {
    merged.set(audioChunks[index], offset);
    offset += audioChunks[index].length;
    if (index < audioChunks.length - 1) offset += silenceSamples;
  }

  const blob = floatToWavBlob(merged, samplingRate);
  self.postMessage({
    type: "complete",
    id,
    blob,
    duration: merged.length / samplingRate,
    samplingRate,
  });
}

function messageChunkSize(performance) {
  return performance === "wasm" ? 650 : 900;
}

function splitForNarration(text, maxLength = 650) {
  const normalised = String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalised) return [];

  const paragraphs = normalised.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const output = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      output.push(paragraph);
      continue;
    }
    const sentences = paragraph.match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g) || [paragraph];
    let current = "";
    for (const sentence of sentences) {
      const candidate = `${current} ${sentence.trim()}`.trim();
      if (candidate.length > maxLength && current) {
        output.push(current);
        current = sentence.trim();
      } else {
        current = candidate;
      }
    }
    if (current) output.push(current);
  }
  return output;
}

function floatToWavBlob(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
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
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}
