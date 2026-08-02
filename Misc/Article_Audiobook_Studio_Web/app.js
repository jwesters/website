const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const fallbackStorage = new Map();
function storageGet(key) {
  try { return window.localStorage.getItem(key); }
  catch { return fallbackStorage.has(key) ? fallbackStorage.get(key) : null; }
}
function storageSet(key, value) {
  const text = String(value);
  fallbackStorage.set(key, text);
  try { window.localStorage.setItem(key, text); } catch {}
}
function storageRemove(key) {
  fallbackStorage.delete(key);
  try { window.localStorage.removeItem(key); } catch {}
}

function safeJsonParse(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}

const DEFAULT_VOICES = [
  ["af_heart", "Heart — American female"],
  ["af_bella", "Bella — American female"],
  ["af_nicole", "Nicole — American female"],
  ["af_sarah", "Sarah — American female"],
  ["af_sky", "Sky — American female"],
  ["am_fenrir", "Fenrir — American male"],
  ["am_michael", "Michael — American male"],
  ["bf_emma", "Emma — British female"],
  ["bf_isabella", "Isabella — British female"],
  ["bm_george", "George — British male"],
  ["bm_lewis", "Lewis — British male"],
];

const state = {
  chapters: [],
  selectedId: null,
  cover: null,
  generation: null,
  ttsWorker: null,
  ttsReady: false,
  ttsDevice: null,
  ttsDtype: null,
  ttsPreference: null,
  ttsLoading: false,
  ttsConfigKey: null,
  ttsProfile: null,
  ffmpeg: null,
  ffmpegReady: false,
  audioUrls: new Map(),
  memoryAudio: new Map(),
  sampleAudioUrl: null,
  voiceSample: null,
  exportLastPercent: 0,
  exportStageBase: 0,
  systemVoices: [],
  systemUtterance: null,
  voiceMode: "kokoro",
};

let db = null;

function startApp() {
  try {
    // Attach the interface first. Storage, model and encoder failures must never
    // leave the page with dead controls.
    applyDeviceClass();
    wireInterface();
    populateVoiceSelect(DEFAULT_VOICES);
    initialiseSystemVoiceSupport();
    restoreLocalProject();
    updateAdaptivePerformanceUi();
    hydrateMetadataInputs();
    renderAll();
    updateStorageBadge();
    registerServiceWorker();
    setAddStatus("Ready. Add a URL, paste text, or import a file.");
    initialisePersistentStorage();
    scheduleTtsPreload();
    window.ArticleAudiobookStudio = { state, addChapter, selectTab };
  } catch (error) {
    reportStartupError(error);
  }
}

async function initialisePersistentStorage() {
  try {
    db = await openDatabase();
    await reconcileAudioCache();
    renderAll();
    updateStorageBadge();
  } catch (error) {
    db = null;
    console.warn("Persistent audio storage is unavailable; using memory for this session.", error);
    const badge = $("#storageBadge");
    if (badge) {
      badge.textContent = "Session-only audio storage";
      badge.title = "This browser blocked IndexedDB. Audio will remain available until this tab closes.";
      badge.classList.add("warn");
    }
    toast("Browser storage is unavailable. The app will still work, but generated audio will last only for this session.", "error");
  }
}

function reportStartupError(error) {
  console.error("Article Audiobook Studio startup failed", error);
  const message = `Startup problem: ${error?.message || String(error)}`;
  const status = document.querySelector("#addStatus");
  if (status) {
    status.textContent = message;
    status.style.color = "var(--danger)";
  } else {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:12px 12px auto;z-index:99999;padding:14px;border-radius:10px;background:#7f1d1d;color:white;font:16px system-ui";
    box.textContent = message;
    document.body.appendChild(box);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}

function wireInterface() {
  $$(".tab").forEach((button) => button.addEventListener("click", () => selectTab(button.dataset.tab)));
  $("#fetchUrlBtn").addEventListener("click", addFromUrl);
  $("#urlInput").addEventListener("keydown", (event) => { if (event.key === "Enter") addFromUrl(); });
  $("#addPastedBtn").addEventListener("click", addPastedText);
  $("#articleFileInput").addEventListener("change", (event) => importArticleFile(event.target.files[0]));
  wireDropZone();

  $("#chapterTitle").addEventListener("input", updateSelectedFromEditor);
  $("#chapterText").addEventListener("input", updateSelectedFromEditor);
  $("#voiceSelect").addEventListener("change", updateSelectedFromEditor);
  $("#speedInput").addEventListener("input", updateSelectedFromEditor);
  $("#voiceSampleBtn").addEventListener("click", () => { playVoiceSample().catch(() => {}); });
  $("#performanceMode").addEventListener("change", handlePerformanceModeChange);
  $("#generateBtn").addEventListener("click", () => { generateChapter(state.selectedId).catch(() => {}); });
  $("#cancelGenerateBtn").addEventListener("click", cancelGeneration);
  $("#downloadMp3Btn").addEventListener("click", () => downloadChapterMp3(state.selectedId));
  $("#deleteChapterBtn").addEventListener("click", () => requestDeleteChapter(state.selectedId));

  ["bookTitle", "bookAuthor", "bookGenre", "bookDescription"].forEach((id) => {
    $("#" + id).addEventListener("input", saveLocalProject);
  });
  $("#coverInput").addEventListener("change", (event) => setCover(event.target.files[0]));
  $("#generateAllBtn").addEventListener("click", generateAllChapters);
  $("#exportM4bBtn").addEventListener("click", exportM4b);

  $("#newProjectBtn").addEventListener("click", requestNewProject);
  $("#saveProjectBtn").addEventListener("click", downloadProject);
  $("#loadProjectInput").addEventListener("change", (event) => loadProjectFile(event.target.files[0]));
  $("#themeBtn").addEventListener("click", toggleTheme);
  $("#helpBtn").addEventListener("click", () => $("#helpDialog").showModal());

  window.addEventListener("beforeunload", saveLocalProject);
  window.addEventListener("resize", () => { applyDeviceClass(); updateAdaptivePerformanceUi(); }, { passive: true });
}

function selectTab(name) {
  $$(".tab").forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $$(".tab-pane").forEach((pane) => pane.classList.toggle("active", pane.dataset.pane === name));
}

async function addFromUrl() {
  const input = $("#urlInput");
  const rawUrl = input.value.trim();
  if (!rawUrl) return setAddStatus("Enter an article URL.", true);
  let url;
  try { url = new URL(rawUrl); } catch { return setAddStatus("That does not look like a valid URL.", true); }
  if (!/^https?:$/.test(url.protocol)) return setAddStatus("Only HTTP and HTTPS URLs are supported.", true);

  setAddStatus("Fetching and cleaning the page…");
  $("#fetchUrlBtn").disabled = true;
  try {
    let extracted;
    try {
      const response = await fetch(url.href, { mode: "cors", credentials: "omit" });
      if (!response.ok) throw new Error(`Website returned ${response.status}`);
      extracted = extractReadableText(await response.text(), url.href);
    } catch (directError) {
      if (!$("#proxyFallback").checked) throw new Error("This website blocked direct browser access. Paste the article text or enable the reader fallback.");
      setAddStatus("Direct access was blocked. Trying the optional reader fallback…");
      const proxyUrl = `https://r.jina.ai/${url.href}`;
      const response = await fetch(proxyUrl, { credentials: "omit" });
      if (!response.ok) throw new Error(`Reader fallback returned ${response.status}`);
      extracted = extractReaderMarkdown(await response.text(), url.href);
    }
    if (!extracted.text || extracted.text.split(/\s+/).length < 20) throw new Error("I could not find enough readable article text on that page.");
    addChapter({ title: extracted.title || titleFromUrl(url), text: extracted.text, url: url.href });
    input.value = "";
    setAddStatus(`Added “${extracted.title || titleFromUrl(url)}”.`);
  } catch (error) {
    setAddStatus(error.message || String(error), true);
  } finally {
    $("#fetchUrlBtn").disabled = false;
  }
}

function extractReadableText(html, sourceUrl = "") {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,svg,canvas,iframe,nav,header,footer,aside,form,button,input,select,textarea,[aria-hidden='true'],.advertisement,.ads,.social-share").forEach((node) => node.remove());
  const title = cleanWhitespace(doc.querySelector("meta[property='og:title']")?.content || doc.querySelector("h1")?.textContent || doc.title || titleFromUrl(new URL(sourceUrl)));
  const candidates = [doc.querySelector("article"), doc.querySelector("main"), doc.querySelector("[role='main']"), doc.body].filter(Boolean);
  let best = candidates[0];
  let bestScore = 0;
  for (const candidate of candidates) {
    const paragraphs = [...candidate.querySelectorAll("p, h2, h3, blockquote, li")]
      .map((node) => cleanWhitespace(node.textContent))
      .filter((text) => text.length > 25);
    const score = paragraphs.join(" ").length;
    if (score > bestScore) { bestScore = score; best = candidate; }
  }
  const blocks = [...best.querySelectorAll("h2,h3,p,blockquote,li")]
    .map((node) => cleanWhitespace(node.textContent))
    .filter((text) => text.length > 20)
    .filter((text, index, array) => index === 0 || text !== array[index - 1]);
  return { title, text: blocks.join("\n\n") };
}

function extractReaderMarkdown(markdown, sourceUrl) {
  const lines = String(markdown || "").split(/\r?\n/);
  let title = "";
  const kept = [];
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) { if (kept.at(-1) !== "") kept.push(""); continue; }
    if (!title && /^#\s+/.test(line)) title = line.replace(/^#\s+/, "").trim();
    if (/^(Title|URL Source|Published Time|Markdown Content):/i.test(line)) {
      if (/^Title:/i.test(line) && !title) title = line.replace(/^Title:\s*/i, "");
      continue;
    }
    line = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^[-*+]\s+/, "")
      .replace(/^>\s?/, "")
      .replace(/[*_`~]/g, "");
    if (line.length > 1) kept.push(line);
  }
  return { title: cleanWhitespace(title) || titleFromUrl(new URL(sourceUrl)), text: kept.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

function addPastedText() {
  const text = $("#pasteText").value.trim();
  if (!text) return setAddStatus("Paste some article text first.", true);
  const title = $("#pasteTitle").value.trim() || firstSentence(text).slice(0, 90) || "Untitled article";
  addChapter({ title, text, url: "" });
  $("#pasteTitle").value = "";
  $("#pasteText").value = "";
  setAddStatus(`Added “${title}”.`);
}

async function importArticleFile(file) {
  if (!file) return;
  setAddStatus(`Reading ${file.name}…`);
  try {
    const contents = await file.text();
    const isHtml = /html|htm/i.test(file.type) || /\.html?$/i.test(file.name);
    const extracted = isHtml ? extractReadableText(contents) : { title: file.name.replace(/\.[^.]+$/, ""), text: cleanImportedText(contents) };
    if (!extracted.text.trim()) throw new Error("The file did not contain readable text.");
    addChapter({ title: extracted.title || file.name, text: extracted.text, url: "" });
    setAddStatus(`Added “${extracted.title || file.name}”.`);
  } catch (error) {
    setAddStatus(error.message || String(error), true);
  } finally {
    $("#articleFileInput").value = "";
  }
}

function wireDropZone() {
  const zone = $("#articleDropZone");
  ["dragenter", "dragover"].forEach((eventName) => zone.addEventListener(eventName, (event) => { event.preventDefault(); zone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((eventName) => zone.addEventListener(eventName, (event) => { event.preventDefault(); zone.classList.remove("dragover"); }));
  zone.addEventListener("drop", (event) => importArticleFile(event.dataTransfer.files[0]));
}

function addChapter({ title, text, url }) {
  const chapter = {
    id: makeId(),
    title: cleanWhitespace(title) || "Untitled article",
    text: cleanImportedText(text),
    url: url || "",
    voice: "af_heart",
    speed: 1,
    renderedSignature: "",
    duration: 0,
    createdAt: Date.now(),
  };
  state.chapters.push(chapter);
  state.selectedId = chapter.id;
  saveLocalProject();
  renderAll();
}

function renderAll() {
  renderChapterList();
  renderEditor();
  renderMetadata();
}

function renderChapterList() {
  const list = $("#chapterList");
  list.innerHTML = "";
  $("#emptyChapters").classList.toggle("hidden", state.chapters.length > 0);
  $("#chapterCount").textContent = `${state.chapters.length} chapter${state.chapters.length === 1 ? "" : "s"}`;
  state.chapters.forEach((chapter, index) => {
    const card = document.createElement("div");
    card.className = `chapter-card${chapter.id === state.selectedId ? " selected" : ""}`;
    card.dataset.id = chapter.id;
    const status = chapterStatus(chapter);
    card.innerHTML = `
      <div class="chapter-number">${index + 1}</div>
      <div class="chapter-copy">
        <strong></strong>
        <span><i class="status-dot ${status.className}"></i>${status.label}</span>
      </div>
      <div class="chapter-tools">
        <button class="mini-button move-up" title="Move up" aria-label="Move chapter up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="mini-button move-down" title="Move down" aria-label="Move chapter down" ${index === state.chapters.length - 1 ? "disabled" : ""}>↓</button>
      </div>`;
    card.querySelector("strong").textContent = chapter.title;
    card.addEventListener("click", () => selectChapter(chapter.id));
    card.querySelector(".move-up").addEventListener("click", (event) => { event.stopPropagation(); moveChapter(index, -1); });
    card.querySelector(".move-down").addEventListener("click", (event) => { event.stopPropagation(); moveChapter(index, 1); });
    list.appendChild(card);
  });
}

function chapterStatus(chapter) {
  if (!chapter.renderedSignature) return { className: "", label: "Not generated" };
  const current = signatureString(chapter);
  if (chapter.renderedSignature === current) return { className: "ready", label: formatDuration(chapter.duration) + " · Ready" };
  return { className: "dirty", label: "Changed · regenerate" };
}

function selectChapter(id) {
  state.selectedId = id;
  renderChapterList();
  renderEditor();
}

function moveChapter(index, offset) {
  const target = index + offset;
  if (target < 0 || target >= state.chapters.length) return;
  [state.chapters[index], state.chapters[target]] = [state.chapters[target], state.chapters[index]];
  saveLocalProject();
  renderChapterList();
}

async function renderEditor() {
  const chapter = selectedChapter();
  const requestedId = chapter?.id || null;
  $("#editorEmpty").classList.toggle("hidden", Boolean(chapter));
  $("#editorForm").classList.toggle("hidden", !chapter);
  if (!chapter) {
    $("#renderBadge").textContent = "Select a chapter";
    const sampleButton = $("#voiceSampleBtn");
    if (sampleButton) sampleButton.disabled = true;
    return;
  }
  $("#chapterTitle").value = chapter.title;
  $("#chapterText").value = chapter.text;
  if (isIOSLike()) {
    populateSystemVoiceSelect();
    $("#voiceSelect").value = chapter.iosPreviewVoiceURI || $("#voiceSelect").value;
  } else {
    $("#voiceSelect").value = chapter.voice;
  }
  $("#speedInput").value = chapter.speed;
  $("#speedValue").textContent = `${Number(chapter.speed).toFixed(2)}×`;
  updateTextStats(chapter.text, chapter.speed);
  const status = chapterStatus(chapter);
  $("#renderBadge").textContent = status.label;
  $("#renderBadge").className = `badge ${status.className === "ready" ? "good" : status.className === "dirty" ? "warn" : ""}`;

  const audioRecord = await getAudio(chapter.id);
  if (state.selectedId !== requestedId) return;
  if (audioRecord?.blob && chapter.renderedSignature === signatureString(chapter)) {
    const url = audioUrlFor(chapter.id, audioRecord.blob);
    $("#chapterAudio").src = url;
    $("#chapterAudio").classList.remove("hidden");
    $("#downloadMp3Btn").disabled = false;
  } else {
    $("#chapterAudio").removeAttribute("src");
    $("#chapterAudio").classList.add("hidden");
    $("#downloadMp3Btn").disabled = true;
  }
  const sampleButton = $("#voiceSampleBtn");
  if (sampleButton) {
    sampleButton.disabled = false;
    sampleButton.textContent = "Voice Sample";
    sampleButton.classList.remove("loading");
  }
  applyPlatformCapabilities();
}

function updateSelectedFromEditor() {
  const chapter = selectedChapter();
  if (!chapter) return;
  chapter.title = $("#chapterTitle").value.trim() || "Untitled article";
  chapter.text = $("#chapterText").value;
  if (isIOSLike()) chapter.iosPreviewVoiceURI = $("#voiceSelect").value;
  else chapter.voice = $("#voiceSelect").value;
  chapter.speed = Number($("#speedInput").value);
  $("#speedValue").textContent = `${chapter.speed.toFixed(2)}×`;
  updateTextStats(chapter.text, chapter.speed);
  saveLocalProject();
  renderChapterList();
  const status = chapterStatus(chapter);
  $("#renderBadge").textContent = status.label;
  $("#downloadMp3Btn").disabled = isIOSLike() || chapter.renderedSignature !== signatureString(chapter);
  applyPlatformCapabilities();
}

function updateTextStats(text, speed = 1) {
  const words = wordCount(text);
  const minutes = Math.max(0, Math.round(words / (155 * Number(speed || 1))));
  $("#wordCount").textContent = `${words.toLocaleString()} words`;
  $("#timeEstimate").textContent = `About ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function populateVoiceSelect(voiceData) {
  if (isIOSLike()) return populateSystemVoiceSelect();
  state.voiceMode = "kokoro";
  const select = $("#voiceSelect");
  const current = select.value;
  let entries = DEFAULT_VOICES;
  if (Array.isArray(voiceData)) {
    if (voiceData.length && Array.isArray(voiceData[0])) entries = voiceData;
    else if (voiceData.length && typeof voiceData[0] === "string") entries = voiceData.map((name) => [name, prettifyVoice(name)]);
  } else if (voiceData && typeof voiceData === "object") {
    entries = Object.keys(voiceData).map((name) => [name, `${prettifyVoice(name)}${voiceData[name]?.name ? ` — ${voiceData[name].name}` : ""}`]);
  }
  select.innerHTML = "";
  entries.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value; option.textContent = label; select.appendChild(option);
  });
  select.value = current || selectedChapter()?.voice || "af_heart";
}

function initialiseSystemVoiceSupport() {
  if (!isIOSLike() || !("speechSynthesis" in window)) return;
  populateSystemVoiceSelect();
  const refresh = () => {
    state.systemVoices = window.speechSynthesis.getVoices() || [];
    populateSystemVoiceSelect();
  };
  window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
  window.setTimeout(refresh, 250);
  window.setTimeout(refresh, 1000);
}

function populateSystemVoiceSelect() {
  if (!isIOSLike()) return;
  state.voiceMode = "system";
  const select = $("#voiceSelect");
  if (!select) return;
  const chapter = selectedChapter();
  const current = chapter?.iosPreviewVoiceURI || select.value;
  const voices = (window.speechSynthesis?.getVoices?.() || state.systemVoices || [])
    .filter((voice) => voice && voice.name)
    .sort((a, b) => {
      const score = (voice) => /^en-CA/i.test(voice.lang) ? 0 : /^en-US/i.test(voice.lang) ? 1 : /^en-GB/i.test(voice.lang) ? 2 : /^en/i.test(voice.lang) ? 3 : 4;
      return score(a) - score(b) || a.name.localeCompare(b.name);
    });
  state.systemVoices = voices;
  select.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "__system_default__";
  defaultOption.textContent = "Default iOS voice";
  select.appendChild(defaultOption);
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.voiceURI || voice.name;
    option.textContent = `${voice.name} — ${voice.lang || "system"}`;
    select.appendChild(option);
  });
  if ([...select.options].some((option) => option.value === current)) select.value = current;
  else select.value = "__system_default__";
}

function selectedSystemVoice() {
  const selected = $("#voiceSelect")?.value;
  if (!selected || selected === "__system_default__") return null;
  return (window.speechSynthesis?.getVoices?.() || state.systemVoices || []).find((voice) => (voice.voiceURI || voice.name) === selected) || null;
}

function playSystemVoiceSample() {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      reject(new Error("Built-in speech is unavailable in this browser."));
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("This is a sample of my voice.");
      const voice = selectedSystemVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = Math.max(0.7, Math.min(1.3, Number($("#speedInput")?.value || 1)));
      state.systemUtterance = utterance;
      state.voiceSample = { system: true };
      setVoiceSampleButtonState("Playing sample…", true);
      utterance.onend = () => {
        state.systemUtterance = null;
        state.voiceSample = null;
        setVoiceSampleButtonState("Voice Sample", false);
        resolve();
      };
      utterance.onerror = (event) => {
        state.systemUtterance = null;
        state.voiceSample = null;
        setVoiceSampleButtonState("Voice Sample", false);
        reject(new Error(event?.error === "canceled" ? "Voice sample cancelled." : "The built-in iOS voice could not be played."));
      };
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      state.systemUtterance = null;
      state.voiceSample = null;
      setVoiceSampleButtonState("Voice Sample", false);
      reject(error);
    }
  });
}

function desktopNarrationMessage() {
  return "Local neural narration and MP3/M4B creation require the desktop version. Save this project and open it on a computer to generate the audio.";
}

function applyPlatformCapabilities() {
  const ios = isIOSLike();
  const notice = $("#iosModeNotice");
  if (notice) notice.classList.toggle("hidden", !ios);
  const label = $("#voiceSelectLabel");
  if (label) label.textContent = ios ? "iOS preview voice" : "Narrator voice";
  const privacy = $("#privacyBadge");
  if (privacy) privacy.textContent = ios ? "Local editing + preview" : "Local processing";
  const performance = $("#performanceMode");
  if (performance) {
    performance.disabled = ios || Boolean(state.generation) || Boolean(state.voiceSample);
    performance.classList.toggle("desktop-only-disabled", ios);
  }
  const generate = $("#generateBtn");
  const generateAll = $("#generateAllBtn");
  const exportButton = $("#exportM4bBtn");
  const download = $("#downloadMp3Btn");
  const generateMissing = $("#generateMissingCheck");
  [generate, generateAll, exportButton, download].forEach((button) => {
    if (!button) return;
    if (ios) {
      button.disabled = true;
      button.classList.add("desktop-only-disabled");
      button.title = desktopNarrationMessage();
    } else {
      button.classList.remove("desktop-only-disabled");
      button.removeAttribute("title");
    }
  });
  if (generateMissing) {
    generateMissing.disabled = ios;
    generateMissing.closest("label")?.classList.toggle("desktop-only-disabled", ios);
  }
  if (ios) {
    updateEngineBadge("Desktop generation required", "warn", desktopNarrationMessage());
    const note = $("#performanceNote");
    if (note) note.textContent = "The local neural voice model is disabled on iPhone and iPad because it does not complete reliably in iOS browsers.";
    const badge = $("#renderBadge");
    if (badge && selectedChapter()) {
      badge.textContent = "Desktop generation required";
      badge.className = "badge warn";
    }
  }
}

async function ensureTtsWorker(options = {}) {
  if (isIOSLike()) throw new Error(desktopNarrationMessage());
  if (location.protocol === "file:") {
    throw new Error("Narration generation requires this folder to be uploaded to an HTTPS website. All editing, chapter arrangement, and project controls work locally.");
  }
  const config = narrationConfig(options);
  if (state.ttsWorker && state.ttsReady && state.ttsConfigKey === config.key) return config;
  if (!state.ttsWorker) createTtsWorker(options);

  state.ttsReady = false;
  state.ttsLoading = true;
  state.ttsConfigKey = null;
  updateEngineBadge("Loading…", "warn", "Downloading or preparing the local voice model.");
  state.ttsWorker.postMessage({ type: "init", ...config });
  await waitUntil(() => state.ttsReady && state.ttsConfigKey === config.key, 240000, "The voice model did not finish loading.");
  return {
    ...config,
    performance: state.ttsDevice === "wasm" ? "wasm" : config.performance,
    warmup: state.ttsDevice === "webgpu" && config.warmup,
  };
}

function createTtsWorker(options = {}) {
  state.ttsWorker = new Worker("tts-worker.js", { type: "module" });
  state.ttsWorker.addEventListener("message", handleTtsMessage);
  state.ttsWorker.addEventListener("error", (event) => {
    state.ttsLoading = false;
    updateEngineBadge("Engine failed", "danger", event.message || "The narration worker crashed.");
    if (state.voiceSample) finishVoiceSampleError(new Error(event.message || "The narration worker crashed."));
    else if (state.generation) finishGenerationWithError(new Error(event.message || "The narration worker crashed."));
    else if (!options.quiet) toast(event.message || "The narration worker crashed.", "error");
  });
}

function resetTtsWorker() {
  try { state.ttsWorker?.terminate(); } catch {}
  state.ttsWorker = null;
  state.ttsReady = false;
  state.ttsLoading = false;
  state.ttsDevice = null;
  state.ttsDtype = null;
  state.ttsPreference = null;
  state.ttsConfigKey = null;
  state.ttsProfile = null;
}

function handleTtsMessage(event) {
  const message = event.data || {};
  if (message.type === "model-start") {
    state.ttsLoading = true;
    updateEngineBadge("Loading…", "warn", `${String(message.device).toUpperCase()} · ${message.dtype}`);
    if (state.generation) showGenerationBox("Downloading local voice model…", 2, `${String(message.device).toUpperCase()} · ${message.dtype}`);
    if (state.voiceSample) setVoiceSampleButtonState("Loading voice…", true);
  } else if (message.type === "model-progress") {
    const progress = normaliseModelProgress(message.item);
    updateEngineBadge("Loading…", "warn", progress.detail || progress.label);
    if (state.generation) showGenerationBox(progress.label, progress.percent, progress.detail);
  } else if (message.type === "warmup-start") {
    updateEngineBadge("Warming up GPU…", "warn", "Compiling the narration model for faster first-chapter generation.");
    if (state.generation) showGenerationBox("Warming up the narration engine…", 8, "This one-time desktop warm-up reduces delay on the first section.");
  } else if (message.type === "ready") {
    state.ttsReady = true;
    state.ttsLoading = false;
    state.ttsDevice = message.device;
    state.ttsDtype = message.dtype;
    state.ttsPreference = message.preference || currentPerformanceMode();
    state.ttsConfigKey = message.configKey || `${message.device}:${message.dtype}:${message.profile || "desktop"}`;
    state.ttsProfile = message.profile || "desktop";
    populateVoiceSelect(message.voices);
    const accelerated = message.device === "webgpu";
    const iosSafe = String(message.profile || "").startsWith("ios");
    const label = iosSafe ? "CPU/WASM — iOS safe" : accelerated ? "WebGPU — accelerated" : "CPU/WASM — compatibility";
    updateEngineBadge(label, accelerated ? "good" : "warn", message.fallbackReason || `${String(message.device).toUpperCase()} · ${message.dtype}`);
    if (state.generation) showGenerationBox("Voice model ready", 9, `${String(message.device).toUpperCase()} processing · adaptive ${message.profile || "desktop"} sections`);
  } else if (message.type === "generation-progress") {
    if (state.voiceSample && message.id === state.voiceSample.requestId) {
      setVoiceSampleButtonState("Generating sample…", true);
      return;
    }
    if (!state.generation || message.id !== state.generation.requestId) return;
    armGenerationWatchdog();
    const percent = 10 + Math.round((message.current / Math.max(1, message.total)) * 88);
    const elapsed = Math.max(0, (Date.now() - state.generation.startedAt) / 1000);
    showGenerationBox(`Narrating part ${message.current + 1} of ${message.total}`, percent, `${message.excerpt || ""}${message.excerpt ? " · " : ""}${formatDuration(elapsed)} elapsed`);
  } else if (message.type === "complete") {
    if (state.voiceSample && message.id === state.voiceSample.requestId) {
      completeVoiceSample(message);
      return;
    }
    clearGenerationWatchdog();
    completeGeneration(message);
  } else if (message.type === "cancelled") {
    clearGenerationWatchdog();
    if (state.voiceSample && message.id === state.voiceSample.requestId) {
      finishVoiceSampleError(new Error("Voice sample cancelled."), true);
      return;
    }
    finishGenerationWithError(new Error("Narration cancelled."), true);
  } else if (message.type === "error") {
    state.ttsLoading = false;
    const error = new Error(message.message || "Narration failed.");
    if (state.voiceSample && message.id === state.voiceSample.requestId) {
      finishVoiceSampleError(error);
      return;
    }
    if (state.generation) {
      if (isIOSLike() && message.code === "chunk-timeout" && !state.generation.safeRetry) {
        retryGenerationInSafeMode(error.message).catch((retryError) => finishGenerationWithError(retryError));
        return;
      }
      finishGenerationWithError(error);
      return;
    }
    state.ttsReady = false;
    updateEngineBadge(isIOSLike() ? "Loads on demand — iOS" : "Load when needed", "warn", error.message);
    console.warn("Background narration preload failed", error);
  }
}

function currentPerformanceMode() {
  const value = $("#performanceMode")?.value || storageGet("article-audiobook-performance") || "auto";
  return ["auto", "webgpu", "wasm"].includes(value) ? value : "auto";
}

function isIOSLike() {
  const ua = navigator.userAgent || "";
  const classicIOS = /iPhone|iPad|iPod/i.test(ua);
  const iPadDesktopMode = navigator.platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1;
  return classicIOS || iPadDesktopMode;
}

function narrationConfig(options = {}) {
  const selected = currentPerformanceMode();
  const ios = isIOSLike();
  const profile = options.safe ? "ios-safe" : ios ? "ios" : isMobileLike() ? "mobile" : "desktop";
  const performance = ios ? "wasm" : selected;
  const warmup = !ios && profile === "desktop" && performance !== "wasm";
  const key = `${performance}:${profile}:${warmup ? "warm" : "cold"}`;
  return { performance, selectedPerformance: selected, profile, warmup, key };
}

function updateAdaptivePerformanceUi() {
  const ios = isIOSLike();
  const select = $("#performanceMode");
  const note = $("#performanceNote");
  if (select) {
    const webgpuOption = select.querySelector('option[value="webgpu"]');
    if (webgpuOption) webgpuOption.disabled = ios;
    if (ios && select.value === "webgpu") select.value = "auto";
  }
  if (note && !ios) {
    note.textContent = "The voice model preloads and warms up in the background. Automatic uses GPU acceleration and larger sections when available.";
  }
  if (ios) {
    resetTtsWorker();
    populateSystemVoiceSelect();
  } else if (state.voiceMode === "system") {
    populateVoiceSelect(DEFAULT_VOICES);
  }
  applyPlatformCapabilities();
}

function handlePerformanceModeChange() {
  const mode = currentPerformanceMode();
  storageSet("article-audiobook-performance", mode);
  resetTtsWorker();
  updateAdaptivePerformanceUi();
  if (isIOSLike()) {
    applyPlatformCapabilities();
    return;
  }
  const labels = { auto: "Automatic selected", webgpu: "WebGPU requested", wasm: "CPU/WASM selected" };
  updateEngineBadge(labels[mode], "warn", "The narration engine will reload in the background.");
  scheduleTtsPreload(150);
}

function scheduleTtsPreload(delay = 1800) {
  if (location.protocol === "file:") {
    updateEngineBadge("HTTPS required", "warn", "Upload the files to an HTTPS static website to generate narration.");
    return;
  }
  if (isIOSLike()) {
    applyPlatformCapabilities();
    return;
  }
  const start = () => {
    if (state.ttsReady || state.ttsLoading || state.generation || state.voiceSample) return;
    ensureTtsWorker({ quiet: true }).catch((error) => {
      state.ttsLoading = false;
      updateEngineBadge("Load when needed", "warn", error.message || String(error));
    });
  };
  if (delay <= 200) return setTimeout(start, delay);
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: delay + 2000 });
  else setTimeout(start, delay);
}

function updateEngineBadge(text, className = "", title = "") {
  const badge = $("#engineBadge");
  if (!badge) return;
  badge.textContent = text;
  badge.className = `badge ${className}`.trim();
  badge.title = title;
}

async function playVoiceSample() {
  const chapter = selectedChapter();
  if (!chapter) return toast("Select a chapter first.", "error");
  if (isIOSLike()) {
    try { await playSystemVoiceSample(); }
    catch (error) { toast(error.message || String(error), "error"); }
    return;
  }
  if (state.generation) return toast("Wait for the current narration to finish before playing a voice sample.", "error");
  if (state.voiceSample) return;
  const requestId = makeId();
  state.voiceSample = { requestId };
  setVoiceSampleButtonState("Preparing sample…", true);
  try {
    const config = await ensureTtsWorker({ safe: isIOSLike() });
    const voice = $("#voiceSelect").value || chapter.voice;
    const speed = Number($("#speedInput").value || chapter.speed || 1);
    state.ttsWorker.postMessage({ type: "generate", id: requestId, text: "This is a sample of my voice.", voice, speed, ...config });
  } catch (error) {
    if (state.voiceSample) finishVoiceSampleError(error);
  }
}

async function completeVoiceSample(message) {
  if (!state.voiceSample || message.id !== state.voiceSample.requestId) return;
  try {
    if (state.sampleAudioUrl) URL.revokeObjectURL(state.sampleAudioUrl);
    const url = URL.createObjectURL(message.blob);
    state.sampleAudioUrl = url;
    const audio = new Audio(url);
    audio.addEventListener("ended", () => setVoiceSampleButtonState("Voice Sample", false), { once: true });
    audio.addEventListener("error", () => finishVoiceSampleError(new Error("The voice sample could not be played.")), { once: true });
    setVoiceSampleButtonState("Playing sample…", true);
    await audio.play();
    state.voiceSample = null;
  } catch (error) {
    finishVoiceSampleError(error);
  }
}

function finishVoiceSampleError(error, quiet = false) {
  state.voiceSample = null;
  setVoiceSampleButtonState("Voice Sample", false);
  if (!quiet) toast(error.message || String(error), "error");
}

function setVoiceSampleButtonState(label, active) {
  const button = $("#voiceSampleBtn");
  if (!button) return;
  button.textContent = label;
  button.disabled = active;
  button.classList.toggle("loading", active);
}

async function generateChapter(id, options = {}) {
  if (isIOSLike()) throw new Error(desktopNarrationMessage());
  const chapter = state.chapters.find((item) => item.id === id);
  if (!chapter) throw new Error("Chapter not found.");
  if (!chapter.text.trim()) throw new Error("This chapter has no text.");
  if (state.generation) throw new Error("Another chapter is already being generated.");

  const currentSignature = signatureString(chapter);
  const existing = await getAudio(chapter.id);
  if (!options.force && chapter.renderedSignature === currentSignature && existing?.blob) return existing;

  const requestId = makeId();
  state.generation = {
    chapterId: chapter.id,
    requestId,
    resolve: null,
    reject: null,
    startedAt: Date.now(),
    safeRetry: false,
    watchdog: null,
  };
  const promise = new Promise((resolve, reject) => { state.generation.resolve = resolve; state.generation.reject = reject; });
  setGenerationControls(true);
  hideGenerationStats();
  showGenerationBox("Preparing narration engine…", 1, isIOSLike() ? "Loading the iOS-safe engine on demand." : "The first use downloads, caches, and warms up the local voice model.");

  try {
    const config = await ensureTtsWorker();
    postGenerationRequest(chapter, config);
    return await promise;
  } catch (error) {
    if (state.generation) finishGenerationWithError(error);
    throw error;
  }
}

function postGenerationRequest(chapter, config) {
  if (!state.generation || !state.ttsWorker) throw new Error("The narration engine is unavailable.");
  state.ttsWorker.postMessage({
    type: "generate",
    id: state.generation.requestId,
    text: chapter.text,
    voice: chapter.voice,
    speed: chapter.speed,
    ...config,
  });
  armGenerationWatchdog();
}

function armGenerationWatchdog() {
  if (!state.generation) return;
  clearGenerationWatchdog();
  const delay = isIOSLike() ? 75000 : 210000;
  const requestId = state.generation.requestId;
  state.generation.watchdog = setTimeout(() => {
    if (!state.generation || state.generation.requestId !== requestId) return;
    if (isIOSLike() && !state.generation.safeRetry) {
      retryGenerationInSafeMode("The first narration section stopped responding.").catch((error) => finishGenerationWithError(error));
    } else {
      finishGenerationWithError(new Error("Narration stopped responding. Try Compatibility mode or use shorter article sections."));
    }
  }, delay);
}

function clearGenerationWatchdog() {
  if (state.generation?.watchdog) clearTimeout(state.generation.watchdog);
  if (state.generation) state.generation.watchdog = null;
}

async function retryGenerationInSafeMode(reason = "Narration stalled.") {
  const generation = state.generation;
  if (!generation || generation.safeRetry) throw new Error(reason);
  generation.safeRetry = true;
  clearGenerationWatchdog();
  const chapter = state.chapters.find((item) => item.id === generation.chapterId);
  if (!chapter) throw new Error("The chapter was removed during narration.");
  showGenerationBox("Retrying in extra-safe iOS mode…", 9, `${reason} The engine is restarting with much smaller sections.`);
  resetTtsWorker();
  generation.requestId = makeId();
  const config = await ensureTtsWorker({ safe: true });
  postGenerationRequest(chapter, config);
}

async function completeGeneration(message) {
  if (!state.generation || message.id !== state.generation.requestId) return;
  clearGenerationWatchdog();
  const generation = state.generation;
  const chapter = state.chapters.find((item) => item.id === generation.chapterId);
  if (!chapter) return finishGenerationWithError(new Error("The chapter was removed during generation."));
  try {
    chapter.duration = Number(message.duration) || await durationOfBlob(message.blob);
    chapter.renderedSignature = signatureString(chapter);
    await putAudio({ id: chapter.id, blob: message.blob, duration: chapter.duration, signature: chapter.renderedSignature, updatedAt: Date.now() });
    saveLocalProject();
    const elapsed = Math.max(.1, (Date.now() - generation.startedAt) / 1000);
    const realtime = chapter.duration / elapsed;
    const engine = message.device === "webgpu" ? "WebGPU" : "CPU/WASM";
    const retryText = generation.safeRetry ? " · iOS safe retry" : "";
    showGenerationBox("Narration complete", 100, `${formatDuration(chapter.duration)} generated locally.`);
    showGenerationStats(`${formatDuration(chapter.duration)} of audio generated in ${formatDuration(elapsed)} · ${realtime.toFixed(1)}× real time · ${engine}/${message.dtype || state.ttsDtype || "adaptive"}${retryText}`);
    generation.resolve({ blob: message.blob, duration: chapter.duration });
    toast(`Generated “${chapter.title}”.`, "success");
    state.generation = null;
    setGenerationControls(false);
    renderAll();
    updateStorageBadge();
  } catch (error) {
    finishGenerationWithError(error);
  }
}

function finishGenerationWithError(error, quiet = false) {
  clearGenerationWatchdog();
  const generation = state.generation;
  if (generation) generation.reject(error);
  state.generation = null;
  setGenerationControls(false);
  hideGenerationStats();
  showGenerationBox(error.message || String(error), 0, isIOSLike() ? "The app stopped safely instead of remaining frozen. Try a shorter article or regenerate in sections." : "", true);
  if (!quiet) toast(error.message || String(error), "error");
}

function cancelGeneration() {
  if (!state.generation || !state.ttsWorker) return;
  clearGenerationWatchdog();
  state.ttsWorker.postMessage({ type: "cancel" });
  $("#generationLabel").textContent = "Cancelling after the current section…";
}

function setGenerationControls(active) {
  $("#generateBtn").disabled = active || isIOSLike();
  $("#cancelGenerateBtn").classList.toggle("hidden", !active);
  $("#deleteChapterBtn").disabled = active;
  const sampleButton = $("#voiceSampleBtn");
  if (sampleButton && !state.voiceSample) sampleButton.disabled = active || !selectedChapter();
  const performanceSelect = $("#performanceMode");
  if (performanceSelect) performanceSelect.disabled = active || Boolean(state.voiceSample) || isIOSLike();
  applyPlatformCapabilities();
}

function showGenerationBox(label, percent = 0, detail = "", error = false) {
  const box = $("#generationBox");
  box.classList.remove("hidden");
  box.classList.toggle("error", error);
  $("#generationLabel").textContent = label;
  $("#generationPercent").textContent = percent ? `${Math.round(percent)}%` : "";
  $("#generationProgress").value = Math.max(0, Math.min(100, percent));
  $("#generationDetail").textContent = detail;
}

function showGenerationStats(text) {
  const stats = $("#generationStats");
  if (!stats) return;
  stats.textContent = text;
  stats.classList.remove("hidden");
}

function hideGenerationStats() {
  const stats = $("#generationStats");
  if (!stats) return;
  stats.textContent = "";
  stats.classList.add("hidden");
}

function normaliseModelProgress(item = {}) {
  const percent = Number(item.progress || 0);
  const file = item.file || item.name || "voice model";
  if (item.status === "progress") return { label: `Downloading ${file}`, percent: Math.max(2, Math.min(8, percent / 12.5)), detail: `${Math.round(percent)}% of model file` };
  if (item.status === "done") return { label: `Loaded ${file}`, percent: 8, detail: "Preparing the narration engine…" };
  return { label: "Loading local voice model…", percent: 4, detail: file };
}

async function generateAllChapters() {
  if (isIOSLike()) return toast(desktopNarrationMessage(), "error");
  if (!state.chapters.length) return toast("Add at least one chapter first.", "error");
  resetExportProgress();
  try {
    setExportProgress("Generating chapters…", 0, "");
    for (let index = 0; index < state.chapters.length; index += 1) {
      const chapter = state.chapters[index];
      setExportProgress(`Chapter ${index + 1} of ${state.chapters.length}`, (index / state.chapters.length) * 100, chapter.title);
      await generateChapter(chapter.id);
    }
    setExportProgress("All chapters are ready", 100, "You can now create the M4B.");
    toast("All chapters are generated.", "success");
  } catch (error) {
    setExportProgress("Generation stopped", 0, error.message || String(error), true);
  }
}

async function downloadChapterMp3(id) {
  if (isIOSLike()) return toast(desktopNarrationMessage(), "error");
  const chapter = state.chapters.find((item) => item.id === id);
  const record = chapter ? await getAudio(chapter.id) : null;
  if (!chapter || !record?.blob || chapter.renderedSignature !== signatureString(chapter)) return toast("Generate this chapter first.", "error");
  try {
    showGenerationBox("Loading audio encoder…", 20, "MP3 conversion runs in this browser.");
    const ffmpeg = await ensureFfmpeg();
    await safeDelete(ffmpeg, ["chapter.wav", "chapter.mp3"]);
    await ffmpeg.writeFile("chapter.wav", new Uint8Array(await record.blob.arrayBuffer()));
    showGenerationBox("Encoding MP3…", 55, chapter.title);
    const code = await ffmpeg.exec(["-i", "chapter.wav", "-codec:a", "libmp3lame", "-b:a", "128k", "chapter.mp3"]);
    if (code !== 0) throw new Error("The MP3 encoder returned an error.");
    const data = await ffmpeg.readFile("chapter.mp3");
    downloadBlob(new Blob([data.buffer], { type: "audio/mpeg" }), `${safeFilename(chapter.title)}.mp3`);
    showGenerationBox("MP3 downloaded", 100, chapter.title);
  } catch (error) {
    showGenerationBox("MP3 export failed", 0, error.message || String(error), true);
    toast(error.message || String(error), "error");
  }
}

async function exportM4b() {
  if (isIOSLike()) return toast(desktopNarrationMessage(), "error");
  if (!state.chapters.length) return toast("Add at least one chapter first.", "error");
  resetExportProgress();
  if (isMobileLike() && isLongMobileExport()) {
    const proceed = await askForConfirmation({
      title: "Large mobile export",
      message: "This audiobook is fairly long for a mobile browser. The app will use its lower-memory export mode, but the browser may still reload if the device runs short of memory. Continue?",
      confirmText: "Continue",
      cancelText: "Cancel",
      danger: false,
    });
    if (!proceed) return;
  }
  $("#exportM4bBtn").disabled = true;
  $("#generateAllBtn").disabled = true;
  try {
    if ($("#generateMissingCheck").checked) {
      for (let index = 0; index < state.chapters.length; index += 1) {
        setExportProgress(`Preparing chapter ${index + 1} of ${state.chapters.length}`, Math.round(index / state.chapters.length * 30), state.chapters[index].title);
        await generateChapter(state.chapters[index].id);
      }
    }

    for (const chapter of state.chapters) {
      const record = await getAudio(chapter.id);
      if (!record?.blob || chapter.renderedSignature !== signatureString(chapter)) throw new Error(`“${chapter.title}” has not been generated or has changed.`);
    }

    const mobile = isMobileLike();
    const audioBitrate = mobile ? "64k" : "96k";
    const audioRate = mobile ? "32000" : "44100";
    setExportProgress("Loading the audiobook encoder…", 34, "Preparing the lower-memory staged exporter.");
    let ffmpeg = await ensureFfmpeg();
    const encodedNames = [];
    const stageOneCleanup = ["concat.txt", "audiobook.m4a"];
    await safeDelete(ffmpeg, stageOneCleanup);

    // Encode and release one uncompressed chapter at a time. Keeping every WAV
    // in FFmpeg's MEMFS can exhaust the WebAssembly heap on long desktop books.
    for (let index = 0; index < state.chapters.length; index += 1) {
      const chapter = state.chapters[index];
      const record = await getAudio(chapter.id);
      const number = String(index + 1).padStart(3, "0");
      const wavName = `chapter-${number}.wav`;
      const audioName = `chapter-${number}.m4a`;
      encodedNames.push(audioName);
      stageOneCleanup.push(wavName, audioName);
      setExportProgress("Encoding chapter audio…", 36 + Math.round((index / state.chapters.length) * 30), `${chapter.title} · staged memory-safe mode`);
      await ffmpeg.writeFile(wavName, new Uint8Array(await record.blob.arrayBuffer()));
      const code = await ffmpeg.exec(["-y", "-i", wavName, "-vn", "-c:a", "aac", "-b:a", audioBitrate, "-ar", audioRate, "-ac", "1", audioName]);
      if (code !== 0) throw new Error(`“${chapter.title}” could not be encoded.`);
      await safeDelete(ffmpeg, [wavName]);
      await yieldToBrowser();
    }

    const concatText = encodedNames.map((name) => `file '${name}'`).join("\n");
    await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatText));
    setExportProgress("Joining encoded chapters…", 69, "Joining the compressed chapter files without re-encoding them.");
    let code = await ffmpeg.exec(["-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-vn", "-c:a", "copy", "audiobook.m4a"]);
    if (code !== 0) throw new Error("The encoded chapters could not be joined.");

    // Pull the compressed audiobook out, then destroy the first FFmpeg worker.
    // WebAssembly memory does not reliably shrink after files are deleted, so a
    // fresh worker gives cover/metadata muxing a clean heap.
    setExportProgress("Resetting encoder memory…", 74, "Starting a clean final-assembly stage.");
    const audiobookM4a = await ffmpeg.readFile("audiobook.m4a");
    await safeDelete(ffmpeg, stageOneCleanup);
    resetFfmpeg();
    await yieldToBrowser();

    let coverJpeg = null;
    if (state.cover?.blob) {
      setExportProgress("Preparing cover art…", 78, "Resizing the cover outside FFmpeg to avoid excess encoder memory use.");
      coverJpeg = await prepareCoverJpeg(state.cover.blob, mobile ? 900 : 1200, .86);
    }

    ffmpeg = await ensureFfmpeg();
    const finalCleanup = ["audiobook.m4a", "metadata.txt", "cover.jpg", "audiobook.m4b"];
    await safeDelete(ffmpeg, finalCleanup);
    await ffmpeg.writeFile("audiobook.m4a", audiobookM4a);
    await ffmpeg.writeFile("metadata.txt", new TextEncoder().encode(buildFfmetadata(state.chapters)));
    if (coverJpeg) await ffmpeg.writeFile("cover.jpg", new Uint8Array(await coverJpeg.arrayBuffer()));

    setExportProgress("Writing chapter markers and metadata…", 88, "Creating one M4B file in a fresh encoder session.");
    const hasCover = Boolean(coverJpeg);
    const metadataIndex = hasCover ? "2" : "1";
    const command = hasCover
      ? ["-y", "-i", "audiobook.m4a", "-i", "cover.jpg", "-f", "ffmetadata", "-i", "metadata.txt", "-map", "0:a", "-map", "1:v", "-map_metadata", metadataIndex, "-map_chapters", metadataIndex, "-c:a", "copy", "-c:v", "copy", "-disposition:v", "attached_pic", "-metadata:s:v", "title=Cover", "-metadata:s:v", "comment=Cover (front)", "-movflags", "+faststart", "-f", "ipod", "audiobook.m4b"]
      : ["-y", "-i", "audiobook.m4a", "-f", "ffmetadata", "-i", "metadata.txt", "-map", "0:a", "-map_metadata", metadataIndex, "-map_chapters", metadataIndex, "-c:a", "copy", "-movflags", "+faststart", "-f", "ipod", "audiobook.m4b"];
    code = await ffmpeg.exec(command);
    if (code !== 0) throw new Error("The M4B container could not be created.");

    const output = await ffmpeg.readFile("audiobook.m4b");
    const title = $("#bookTitle").value.trim() || "Article Audiobook";
    downloadBlob(new Blob([output.buffer], { type: "audio/mp4" }), `${safeFilename(title)}.m4b`);
    setExportProgress("Audiobook downloaded", 100, `${state.chapters.length} chapters · ${formatDuration(state.chapters.reduce((sum, chapter) => sum + chapter.duration, 0))}`);
    toast("Your M4B audiobook is ready.", "success");
    await safeDelete(ffmpeg, finalCleanup);
  } catch (error) {
    const message = /memory access out of bounds/i.test(error?.message || "")
      ? "The browser audio encoder ran out of memory. Its memory has been reset; please try the export once more."
      : (error.message || String(error));
    resetFfmpeg();
    setExportProgress("M4B export failed", 0, message, true);
    toast(message, "error");
  } finally {
    $("#exportM4bBtn").disabled = false;
    $("#generateAllBtn").disabled = false;
  }
}

async function prepareCoverJpeg(blob, maxDimension = 1200, quality = .86) {
  let source = null;
  let revokeUrl = null;
  try {
    if ("createImageBitmap" in window) {
      source = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } else {
      const url = URL.createObjectURL(blob);
      revokeUrl = url;
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The cover image could not be opened."));
        image.src = url;
      });
    }
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error("The cover image has invalid dimensions.");
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(2, Math.round(sourceWidth * scale));
    const height = Math.max(2, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("The browser could not prepare the cover image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    const jpeg = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The cover image could not be converted.")), "image/jpeg", quality);
    });
    canvas.width = 1;
    canvas.height = 1;
    return jpeg;
  } finally {
    if (source?.close) source.close();
    if (revokeUrl) URL.revokeObjectURL(revokeUrl);
  }
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

class BrowserFFmpeg {
  constructor(workerURL) {
    this.workerURL = workerURL;
    this.worker = null;
    this.loaded = false;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = { log: [], progress: [] };
  }

  on(type, callback) {
    if (this.listeners[type]) this.listeners[type].push(callback);
  }

  async load(config) {
    if (this.loaded) return true;
    if (!this.worker) {
      this.worker = new Worker(this.workerURL);
      this.worker.addEventListener("message", (event) => this.handleMessage(event.data || {}));
      this.worker.addEventListener("error", (event) => this.rejectAll(new Error(event.message || "The audiobook encoder worker crashed.")));
    }
    await this.send("LOAD", config);
    this.loaded = true;
    return true;
  }

  handleMessage(message) {
    if (message.type === "LOG") {
      this.listeners.log.forEach((callback) => callback(message.data || {}));
      return;
    }
    if (message.type === "PROGRESS") {
      this.listeners.progress.forEach((callback) => callback(message.data || {}));
      return;
    }
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.type === "ERROR") pending.reject(new Error(message.data || "The audiobook encoder failed."));
    else pending.resolve(message.data);
  }

  rejectAll(error) {
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }

  send(type, data, transfer = []) {
    if (!this.worker) return Promise.reject(new Error("The audiobook encoder worker is unavailable."));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, data }, transfer);
    });
  }

  terminate() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.loaded = false;
    this.rejectAll(new Error("The audiobook encoder was reset."));
  }

  exec(args, timeout = -1) { return this.send("EXEC", { args, timeout }); }
  writeFile(path, data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return this.send("WRITE_FILE", { path, data: bytes }, [bytes.buffer]);
  }
  readFile(path, encoding) { return this.send("READ_FILE", { path, encoding }); }
  deleteFile(path) { return this.send("DELETE_FILE", { path }); }
}

function resetFfmpeg() {
  try { state.ffmpeg?.terminate?.(); } catch {}
  state.ffmpeg = null;
  state.ffmpegReady = false;
}

async function ensureFfmpeg() {
  if (state.ffmpegReady && state.ffmpeg) return state.ffmpeg;
  const workerURL = new URL("ffmpeg-worker.js", document.baseURI).href;
  const ffmpeg = state.ffmpeg || new BrowserFFmpeg(workerURL);
  state.ffmpeg = ffmpeg;
  ffmpeg.on("log", ({ message }) => { if (/error|failed/i.test(message || "")) console.warn(message); });
  ffmpeg.on("progress", ({ progress }) => {
    if ($("#exportBox").classList.contains("hidden")) return;
    const raw = Number(progress);
    if (!Number.isFinite(raw) || raw < 0 || raw > 1) {
      $("#exportPercent").textContent = "Encoding…";
      return;
    }
    const base = Number.isFinite(state.exportStageBase) ? state.exportStageBase : state.exportLastPercent;
    updateExportPercent(Math.min(87, base + raw * 20));
  });
  await ffmpeg.load({
    candidates: [
      {
        coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
        wasmURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
      },
      {
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
      },
    ],
  });
  state.ffmpegReady = true;
  return ffmpeg;
}

function buildFfmetadata(chapters) {
  const lines = [";FFMETADATA1"];
  const values = {
    title: $("#bookTitle").value.trim() || "Article Audiobook",
    artist: $("#bookAuthor").value.trim(),
    album_artist: $("#bookAuthor").value.trim(),
    album: $("#bookTitle").value.trim() || "Article Audiobook",
    genre: $("#bookGenre").value.trim() || "Audiobook",
    comment: $("#bookDescription").value.trim(),
    media_type: "2",
  };
  Object.entries(values).forEach(([key, value]) => { if (value) lines.push(`${key}=${escapeMetadata(value)}`); });
  let start = 0;
  chapters.forEach((chapter, index) => {
    const end = index === chapters.length - 1
      ? Math.round((start + chapter.duration) * 1000)
      : Math.max(Math.round((start + chapter.duration) * 1000), Math.round(start * 1000) + 1);
    lines.push("", "[CHAPTER]", "TIMEBASE=1/1000", `START=${Math.round(start * 1000)}`, `END=${end}`, `title=${escapeMetadata(chapter.title)}`);
    start += chapter.duration;
  });
  return lines.join("\n");
}

function escapeMetadata(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/([=;#])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

function resetExportProgress() {
  state.exportLastPercent = 0;
  state.exportStageBase = 0;
  const progress = $("#exportProgress");
  if (progress) progress.value = 0;
  const percent = $("#exportPercent");
  if (percent) percent.textContent = "";
}

function updateExportPercent(percent) {
  const numeric = Number(percent);
  if (!Number.isFinite(numeric)) return;
  const clamped = Math.max(0, Math.min(100, numeric));
  const monotonic = Math.max(state.exportLastPercent || 0, clamped);
  state.exportLastPercent = monotonic;
  $("#exportProgress").value = monotonic;
  $("#exportPercent").textContent = `${Math.round(monotonic)}%`;
}

function setExportProgress(label, percent, detail = "", error = false) {
  $("#exportBox").classList.remove("hidden");
  $("#exportBox").classList.toggle("error", error);
  $("#exportLabel").textContent = label;
  const numeric = Number(percent);
  if (Number.isFinite(numeric)) {
    updateExportPercent(numeric);
    state.exportStageBase = state.exportLastPercent;
  } else {
    $("#exportPercent").textContent = "Working…";
  }
  $("#exportDetail").textContent = detail;
}

function askForConfirmation({ title, message, confirmText = "Yes", cancelText = "No", danger = true }) {
  const dialog = $("#confirmDialog");
  const confirmButton = $("#confirmOkBtn");
  const cancelButton = $("#confirmCancelBtn");
  $("#confirmTitle").textContent = title;
  $("#confirmMessage").textContent = message;
  confirmButton.textContent = confirmText;
  cancelButton.textContent = cancelText;
  confirmButton.className = `button ${danger ? "danger" : "primary"}`;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  });
}

async function requestDeleteChapter(id) {
  const chapter = state.chapters.find((item) => item.id === id);
  if (!chapter) return;
  const confirmed = await askForConfirmation({
    title: "Delete chapter?",
    message: `“${chapter.title}” and its locally cached narration will be removed.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  state.chapters = state.chapters.filter((item) => item.id !== id);
  await deleteAudio(id);
  const oldUrl = state.audioUrls.get(id); if (oldUrl) URL.revokeObjectURL(oldUrl);
  state.audioUrls.delete(id);
  if (state.selectedId === id) state.selectedId = state.chapters[0]?.id || null;
  saveLocalProject();
  renderAll();
  updateStorageBadge();
}

async function requestNewProject() {
  if (state.generation || state.voiceSample) {
    return toast("Finish or cancel the current narration before starting a new project.", "error");
  }
  const confirmed = await askForConfirmation({
    title: "Start a new project?",
    message: "This clears the current chapters, cover, audiobook details, and locally generated chapter audio. Download a project file first if you may need it later.",
    confirmText: "Yes",
    cancelText: "No",
    danger: true,
  });
  if (!confirmed) return;

  try { window.speechSynthesis?.cancel(); } catch {}
  state.systemUtterance = null;
  state.voiceSample = null;
  state.chapters = [];
  state.selectedId = null;
  if (state.cover?.url) URL.revokeObjectURL(state.cover.url);
  state.cover = null;
  state.audioUrls.forEach((url) => URL.revokeObjectURL(url));
  state.audioUrls.clear();
  await clearAllAudio();
  storageRemove("article-audiobook-project");
  storageRemove("article-audiobook-metadata");

  $("#urlInput").value = "";
  $("#pasteTitle").value = "";
  $("#pasteText").value = "";
  $("#articleFileInput").value = "";
  $("#coverInput").value = "";
  hydrateMetadataInputs({ bookTitle: "", bookAuthor: "", bookGenre: "Articles", bookDescription: "" });
  selectTab("url");
  saveLocalProject();
  renderAll();
  updateStorageBadge();
  setAddStatus("New project ready. Add an article to begin.");
  toast("New project created.", "success");
}

function applyDeviceClass() {
  document.documentElement.classList.toggle("mobile-device", isMobileLike());
  document.documentElement.classList.toggle("ios-device", isIOSLike());
  if (document.readyState !== "loading") {
    if (isIOSLike()) populateSystemVoiceSelect();
    applyPlatformCapabilities();
  }
}

function isMobileLike() {
  const narrow = window.matchMedia?.("(max-width: 760px)")?.matches;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const mobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  return Boolean(narrow || coarse || mobileAgent || isIOSLike());
}

function estimatedBookSeconds() {
  return state.chapters.reduce((sum, chapter) => {
    if (Number(chapter.duration) > 0 && chapter.renderedSignature === signatureString(chapter)) return sum + Number(chapter.duration);
    const words = wordCount(chapter.text);
    return sum + (words / (155 * Number(chapter.speed || 1))) * 60;
  }, 0);
}

function isLongMobileExport() {
  const totalWords = state.chapters.reduce((sum, chapter) => sum + wordCount(chapter.text), 0);
  return estimatedBookSeconds() >= 45 * 60 || state.chapters.length >= 12 || totalWords >= 9000;
}

function renderMetadata() {
  const project = currentMetadata();
  ["bookTitle", "bookAuthor", "bookGenre", "bookDescription"].forEach((id) => {
    if (document.activeElement !== $("#" + id)) $("#" + id).value = project[id] || "";
  });
  const picker = $(".cover-picker");
  if (state.cover?.url) {
    $("#coverPreview").src = state.cover.url;
    picker.classList.add("has-cover");
  } else {
    $("#coverPreview").removeAttribute("src");
    picker.classList.remove("has-cover");
  }
}

async function setCover(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return toast("Choose a JPG, PNG or WebP image.", "error");
  const blob = file.slice(0, file.size, file.type);
  const dataUrl = await blobToDataUrl(blob);
  if (state.cover?.url) URL.revokeObjectURL(state.cover.url);
  state.cover = { blob, dataUrl, url: URL.createObjectURL(blob), type: file.type, name: file.name };
  saveLocalProject();
  renderMetadata();
}

function hydrateMetadataInputs(metadata = null) {
  const source = metadata || safeJsonParse(storageGet("article-audiobook-metadata") || "{}", {});
  ["bookTitle", "bookAuthor", "bookGenre", "bookDescription"].forEach((id) => {
    const element = $("#" + id);
    if (element && Object.prototype.hasOwnProperty.call(source, id)) element.value = source[id] ?? "";
  });
}

function currentMetadata() {
  const stored = safeJsonParse(storageGet("article-audiobook-metadata") || "{}", {});
  const valueOf = (id, fallback = "") => {
    const element = $("#" + id);
    return element ? element.value : (stored[id] ?? fallback);
  };
  return {
    bookTitle: valueOf("bookTitle"),
    bookAuthor: valueOf("bookAuthor"),
    bookGenre: valueOf("bookGenre", "Articles"),
    bookDescription: valueOf("bookDescription"),
  };
}

function saveLocalProject() {
  const metadata = currentMetadata();
  storageSet("article-audiobook-project", JSON.stringify({ version: 1, chapters: state.chapters, selectedId: state.selectedId, metadata, coverDataUrl: state.cover?.dataUrl || null }));
  storageSet("article-audiobook-metadata", JSON.stringify(metadata));
}

function restoreLocalProject() {
  try {
    const saved = safeJsonParse(storageGet("article-audiobook-project") || "null", null);
    if (saved?.chapters) {
      state.chapters = saved.chapters;
      state.selectedId = saved.selectedId && state.chapters.some((chapter) => chapter.id === saved.selectedId) ? saved.selectedId : state.chapters[0]?.id || null;
      if (saved.metadata) storageSet("article-audiobook-metadata", JSON.stringify(saved.metadata));
      if (saved.coverDataUrl) restoreCoverFromDataUrl(saved.coverDataUrl);
    }
    const theme = storageGet("article-audiobook-theme");
    if (theme) document.documentElement.dataset.theme = theme;
    const performanceMode = storageGet("article-audiobook-performance") || "auto";
    if ($("#performanceMode")) $("#performanceMode").value = ["auto", "webgpu", "wasm"].includes(performanceMode) ? performanceMode : "auto";
  } catch (error) {
    console.warn("Could not restore saved project", error);
  }
}

async function restoreCoverFromDataUrl(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    state.cover = { blob, dataUrl, url: URL.createObjectURL(blob), type: blob.type, name: "cover" };
    renderMetadata();
  } catch {}
}

function downloadProject() {
  const payload = {
    format: "Article Audiobook Studio Project",
    version: 1,
    exportedAt: new Date().toISOString(),
    chapters: state.chapters,
    metadata: currentMetadata(),
    coverDataUrl: state.cover?.dataUrl || null,
    note: "Narration audio remains in this browser's local cache. Changed or missing chapters can be regenerated.",
  };
  const title = currentMetadata().bookTitle || "article-audiobook-project";
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeFilename(title)}.aabproject.json`);
}

async function loadProjectFile(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (!Array.isArray(payload.chapters)) throw new Error("This is not a valid Article Audiobook Studio project.");
    state.chapters = payload.chapters.map((chapter) => ({ voice: "af_heart", iosPreviewVoiceURI: "__system_default__", speed: 1, renderedSignature: "", duration: 0, ...chapter, id: chapter.id || makeId() }));
    for (const chapter of state.chapters) {
      const cached = await getAudio(chapter.id);
      if (cached?.blob && cached.signature === signatureString(chapter)) {
        chapter.renderedSignature = cached.signature;
        chapter.duration = cached.duration || chapter.duration || 0;
      } else {
        chapter.renderedSignature = "";
        chapter.duration = 0;
      }
    }
    state.selectedId = state.chapters[0]?.id || null;
    storageSet("article-audiobook-metadata", JSON.stringify(payload.metadata || {}));
    hydrateMetadataInputs(payload.metadata || {});
    if (payload.coverDataUrl) await restoreCoverFromDataUrl(payload.coverDataUrl); else state.cover = null;
    saveLocalProject(); renderAll();
    toast("Project loaded. Cached audio is reused when available.", "success");
  } catch (error) {
    toast(error.message || String(error), "error");
  } finally {
    $("#loadProjectInput").value = "";
  }
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  storageSet("article-audiobook-theme", next);
}

async function updateStorageBadge() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate) return $("#storageBadge").textContent = "Local site storage";
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    $("#storageBadge").textContent = `${formatBytes(used)} site storage used`;
    $("#storageBadge").title = quota ? `${formatBytes(used)} of ${formatBytes(quota)} storage used by this site, including the voice model, generated audio, encoder files, and app cache` : "Storage used by this website";
    if (navigator.storage.persist) await navigator.storage.persist();
  } catch {
    $("#storageBadge").textContent = "Local site storage";
  }
}

function setAddStatus(message, error = false) {
  $("#addStatus").textContent = message;
  $("#addStatus").style.color = error ? "var(--danger)" : "var(--muted)";
}

function toast(message, type = "") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  $("#toastRegion").appendChild(item);
  setTimeout(() => item.remove(), 4500);
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);
    return [...values].map((value) => value.toString(16).padStart(8, "0")).join("-");
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function selectedChapter() { return state.chapters.find((chapter) => chapter.id === state.selectedId) || null; }
function signatureString(chapter) { return `${chapter.text}\u241f${chapter.voice}\u241f${Number(chapter.speed).toFixed(2)}\u241fkokoro-82m-v1`; }
function wordCount(text) { return (String(text || "").trim().match(/[\p{L}\p{N}’'-]+/gu) || []).length; }
function cleanWhitespace(text) { return String(text || "").replace(/\s+/g, " ").trim(); }
function cleanImportedText(text) { return String(text || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function firstSentence(text) { return (String(text).match(/^.{1,120}?(?:[.!?](?:\s|$)|$)/s) || [""])[0].trim(); }
function titleFromUrl(url) { return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || url.hostname).replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function safeFilename(value) { return String(value || "file").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "file"; }
function formatDuration(seconds) { const total = Math.max(0, Math.round(Number(seconds) || 0)); const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60); const secs = total % 60; return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${secs}s` : `${secs}s`; }
function formatBytes(bytes) { const units = ["B", "KB", "MB", "GB"]; let value = Number(bytes) || 0; let unit = 0; while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; } return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`; }
function prettifyVoice(name) { const prefix = name.startsWith("af_") ? "American female" : name.startsWith("am_") ? "American male" : name.startsWith("bf_") ? "British female" : name.startsWith("bm_") ? "British male" : "Voice"; return `${name.split("_").slice(1).join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase())} — ${prefix}`; }
function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
function audioUrlFor(id, blob) { const old = state.audioUrls.get(id); if (old) URL.revokeObjectURL(old); const url = URL.createObjectURL(blob); state.audioUrls.set(id, url); return url; }
async function durationOfBlob(blob) { const context = new AudioContext(); try { const buffer = await context.decodeAudioData(await blob.arrayBuffer()); return buffer.duration; } finally { await context.close(); } }
async function waitUntil(predicate, timeout, message) { const started = Date.now(); while (!predicate()) { if (Date.now() - started > timeout) throw new Error(message); await new Promise((resolve) => setTimeout(resolve, 100)); } }
async function safeDelete(ffmpeg, names) { for (const name of names) { try { await ffmpeg.deleteFile(name); } catch {} } }

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB is not supported in this browser."));
    const request = indexedDB.open("article-audiobook-studio", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("audio")) database.createObjectStore("audio", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser audio storage."));
    request.onblocked = () => reject(new Error("Browser audio storage is blocked by another tab."));
  });
}
function dbRequest(mode, operation) {
  if (!db) return Promise.reject(new Error("Persistent browser audio storage is not ready."));
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("audio", mode);
      const store = transaction.objectStore("audio");
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error || new Error("Browser storage transaction failed."));
    } catch (error) {
      reject(error);
    }
  });
}
function putAudio(record) {
  state.memoryAudio.set(record.id, record);
  return db ? dbRequest("readwrite", (store) => store.put(record)).catch(() => record) : Promise.resolve(record);
}
function getAudio(id) {
  if (!db) return Promise.resolve(state.memoryAudio.get(id));
  return dbRequest("readonly", (store) => store.get(id)).then((record) => record || state.memoryAudio.get(id)).catch(() => state.memoryAudio.get(id));
}
function deleteAudio(id) {
  state.memoryAudio.delete(id);
  return db ? dbRequest("readwrite", (store) => store.delete(id)).catch(() => undefined) : Promise.resolve();
}
function clearAllAudio() {
  state.memoryAudio.clear();
  return db ? dbRequest("readwrite", (store) => store.clear()).catch(() => undefined) : Promise.resolve();
}


async function reconcileAudioCache() {
  for (const chapter of state.chapters) {
    try {
      const cached = await getAudio(chapter.id);
      if (cached?.blob && cached.signature === signatureString(chapter)) {
        chapter.renderedSignature = cached.signature;
        chapter.duration = cached.duration || chapter.duration || 0;
      } else {
        chapter.renderedSignature = "";
        chapter.duration = 0;
      }
    } catch {
      chapter.renderedSignature = "";
      chapter.duration = 0;
    }
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
