(() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    fileInput: $('fileInput'),
    editor: $('editor'),
    emptyState: $('emptyState'),
    fileName: $('fileName'),
    currentTime: $('currentTime'),
    totalTime: $('totalTime'),
    selectionText: $('selectionText'),
    waveScroll: $('waveScroll'),
    waveCanvas: $('waveCanvas'),
    playBtn: $('playBtn'),
    pauseBtn: $('pauseBtn'),
    stopBtn: $('stopBtn'),
    cutBtn: $('cutBtn'),
    copyBtn: $('copyBtn'),
    pasteBtn: $('pasteBtn'),
    clearSelectionBtn: $('clearSelectionBtn'),
    undoBtn: $('undoBtn'),
    redoBtn: $('redoBtn'),
    resetBtn: $('resetBtn'),
    zoomOutBtn: $('zoomOutBtn'),
    zoomFitBtn: $('zoomFitBtn'),
    zoomInBtn: $('zoomInBtn'),
    exportWavBtn: $('exportWavBtn'),
    exportMp3Btn: $('exportMp3Btn'),
    bitrateSelect: $('bitrateSelect'),
    status: $('status'),
    progressWrap: $('progressWrap'),
    progressBar: $('progressBar'),
    progressText: $('progressText'),
  };

  const state = {
    audioCtx: null,
    originalBuffer: null,
    buffer: null,
    source: null,
    fileStem: 'edited-audio',
    isPlaying: false,
    playStartCtxTime: 0,
    playStartOffset: 0,
    pausedAt: 0,
    selection: null,
    clipboardBuffer: null,
    dragStartTime: 0,
    dragging: false,
    dragMoved: false,
    zoom: 1,
    undoStack: [],
    redoStack: [],
    rafId: null,
    waveformCache: new WeakMap(),
  };

  function setStatus(message, type = 'normal') {
    el.status.textContent = message;
    el.status.style.color = type === 'error' ? '#ff8ca0' : type === 'good' ? '#7cf29a' : '#c9bfd1';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatTime(seconds) {
    seconds = Math.max(0, seconds || 0);
    const minutes = Math.floor(seconds / 60);
    const whole = Math.floor(seconds % 60).toString().padStart(2, '0');
    const millis = Math.floor((seconds - Math.floor(seconds)) * 1000).toString().padStart(3, '0');
    return `${minutes}:${whole}.${millis}`;
  }

  function safeFileStem(name) {
    return (name || 'edited-audio')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'edited-audio';
  }

  function ensureAudioContext() {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return state.audioCtx;
  }

  async function loadFile(file) {
    if (!file) return;
    stopPlayback(false);
    setProgress(0, '', false);
    setStatus('Loading and decoding audio…');

    try {
      const ctx = ensureAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));

      state.originalBuffer = decoded;
      state.buffer = decoded;
      state.fileStem = safeFileStem(file.name);
      state.pausedAt = 0;
      state.selection = null;
      state.clipboardBuffer = null;
      state.undoStack = [];
      state.redoStack = [];
      state.zoom = 1;
      state.waveformCache = new WeakMap();

      el.fileName.textContent = file.name;
      el.editor.classList.remove('hidden');
      el.emptyState.classList.add('hidden');
      updateButtons();
      updateReadouts();
      resizeCanvasAndDraw();
      setStatus(`Loaded ${file.name}. Drag across the waveform to choose what to cut.`, 'good');
    } catch (error) {
      console.error(error);
      setStatus('Could not decode that file. Try a standard WAV or MP3 file.', 'error');
    }
  }

  function cloneBuffer(buffer) {
    const ctx = ensureAudioContext();
    const copy = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      copy.copyToChannel(buffer.getChannelData(ch), ch);
    }
    return copy;
  }

  function updateReadouts() {
    const duration = state.buffer ? state.buffer.duration : 0;
    el.currentTime.textContent = formatTime(getCurrentTime());
    el.totalTime.textContent = formatTime(duration);

    if (state.selection && Math.abs(state.selection.end - state.selection.start) > 0.001) {
      const start = Math.min(state.selection.start, state.selection.end);
      const end = Math.max(state.selection.start, state.selection.end);
      el.selectionText.textContent = `${formatTime(start)} → ${formatTime(end)}  (${formatTime(end - start)})`;
    } else {
      el.selectionText.textContent = 'drag across the waveform';
    }
  }

  function updateButtons() {
    const hasAudio = !!state.buffer;
    const hasSelection = hasAudio && state.selection && Math.abs(state.selection.end - state.selection.start) > 0.02;
    el.playBtn.disabled = !hasAudio || state.isPlaying;
    el.pauseBtn.disabled = !hasAudio || !state.isPlaying;
    el.stopBtn.disabled = !hasAudio;
    el.cutBtn.disabled = !hasSelection;
    el.copyBtn.disabled = !hasSelection;
    el.pasteBtn.disabled = !hasAudio || !state.clipboardBuffer;
    el.clearSelectionBtn.disabled = !hasSelection;
    el.undoBtn.disabled = state.undoStack.length === 0;
    el.redoBtn.disabled = state.redoStack.length === 0;
    el.resetBtn.disabled = !hasAudio || state.buffer === state.originalBuffer;
    el.exportWavBtn.disabled = !hasAudio;
    el.exportMp3Btn.disabled = !hasAudio;
  }

  function getCurrentTime() {
    if (!state.buffer) return 0;
    if (!state.isPlaying) return clamp(state.pausedAt, 0, state.buffer.duration);
    const elapsed = ensureAudioContext().currentTime - state.playStartCtxTime;
    return clamp(state.playStartOffset + elapsed, 0, state.buffer.duration);
  }

  function startPlayback(offset = state.pausedAt) {
    if (!state.buffer) return;
    const ctx = ensureAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    stopPlayback(false, true);

    offset = clamp(offset, 0, Math.max(0, state.buffer.duration - 0.001));
    const source = ctx.createBufferSource();
    source.buffer = state.buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (!state.isPlaying) return;
      state.isPlaying = false;
      state.pausedAt = 0;
      state.source = null;
      updateButtons();
      updateReadouts();
      drawWaveform();
      setStatus('Playback finished.');
    };
    source.start(0, offset);

    state.source = source;
    state.isPlaying = true;
    state.playStartCtxTime = ctx.currentTime;
    state.playStartOffset = offset;
    state.pausedAt = offset;
    updateButtons();
    setStatus('Playing…');
    animationLoop();
  }

  function pausePlayback() {
    if (!state.isPlaying) return;
    state.pausedAt = getCurrentTime();
    stopPlayback(false, true);
    state.isPlaying = false;
    updateButtons();
    updateReadouts();
    drawWaveform();
    setStatus(`Paused at ${formatTime(state.pausedAt)}.`);
  }

  function stopPlayback(reset = true, silent = false) {
    if (state.source) {
      state.source.onended = null;
      try { state.source.stop(); } catch (_) {}
      state.source.disconnect();
      state.source = null;
    }
    state.isPlaying = false;
    if (reset) state.pausedAt = 0;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    if (!silent) {
      updateButtons();
      updateReadouts();
      drawWaveform();
      setStatus(reset ? 'Restarted playback position.' : 'Stopped.');
    }
  }

  function seekTo(time) {
    if (!state.buffer) return;
    state.pausedAt = clamp(time, 0, state.buffer.duration);
    if (state.isPlaying) startPlayback(state.pausedAt);
    updateReadouts();
    drawWaveform();
  }

  function animationLoop() {
    updateReadouts();
    drawWaveform();
    if (state.isPlaying) state.rafId = requestAnimationFrame(animationLoop);
  }

  function getCanvasWidthCss() {
    const containerWidth = Math.max(320, el.waveScroll.clientWidth || 900);
    return Math.round(containerWidth * state.zoom);
  }

  function resizeCanvasAndDraw() {
    if (!state.buffer) return;
    const widthCss = getCanvasWidthCss();
    const heightCss = 260;
    const ratio = window.devicePixelRatio || 1;
    el.waveCanvas.style.width = `${widthCss}px`;
    el.waveCanvas.style.height = `${heightCss}px`;
    el.waveCanvas.width = Math.round(widthCss * ratio);
    el.waveCanvas.height = Math.round(heightCss * ratio);
    drawWaveform();
  }

  function buildPeaks(buffer, width) {
    const cacheKey = Math.max(300, Math.round(width));
    let cacheForBuffer = state.waveformCache.get(buffer);
    if (!cacheForBuffer) {
      cacheForBuffer = new Map();
      state.waveformCache.set(buffer, cacheForBuffer);
    }
    if (cacheForBuffer.has(cacheKey)) return cacheForBuffer.get(cacheKey);

    const samples = buffer.length;
    const channels = buffer.numberOfChannels;
    const blockSize = Math.max(1, Math.floor(samples / cacheKey));
    const peaks = new Array(cacheKey);

    for (let x = 0; x < cacheKey; x++) {
      const start = x * blockSize;
      const end = x === cacheKey - 1 ? samples : Math.min(samples, start + blockSize);
      let min = 1;
      let max = -1;
      for (let ch = 0; ch < channels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = start; i < end; i++) {
          const v = data[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      peaks[x] = [min, max];
    }
    cacheForBuffer.set(cacheKey, peaks);
    return peaks;
  }

  function drawWaveform() {
    const canvas = el.waveCanvas;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    const widthCss = width / ratio;
    const heightCss = height / ratio;

    ctx.save();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, widthCss, heightCss);

    ctx.fillStyle = '#12111a';
    ctx.fillRect(0, 0, widthCss, heightCss);

    if (!state.buffer) {
      ctx.restore();
      return;
    }

    const duration = state.buffer.duration;
    const mid = heightCss / 2;
    const amp = heightCss * 0.39;

    drawTimeline(ctx, widthCss, heightCss, duration);

    const peaks = buildPeaks(state.buffer, widthCss);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.92)';
    ctx.beginPath();
    for (let x = 0; x < peaks.length; x++) {
      const [min, max] = peaks[x];
      ctx.moveTo(x + 0.5, mid + min * amp);
      ctx.lineTo(x + 0.5, mid + max * amp);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(widthCss, mid);
    ctx.stroke();

    if (state.selection && Math.abs(state.selection.end - state.selection.start) > 0.001) {
      const sx = timeToX(Math.min(state.selection.start, state.selection.end));
      const ex = timeToX(Math.max(state.selection.start, state.selection.end));
      ctx.fillStyle = 'rgba(255, 92, 122, .27)';
      ctx.fillRect(sx, 0, ex - sx, heightCss);
      ctx.strokeStyle = 'rgba(255, 92, 122, .95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, 1, ex - sx, heightCss - 2);
    }

    const playX = timeToX(getCurrentTime());
    ctx.strokeStyle = '#72ddf7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, heightCss);
    ctx.stroke();

    ctx.restore();
  }

  function drawTimeline(ctx, width, height, duration) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.fillRect(0, 0, width, 28);
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.fillStyle = 'rgba(255,247,223,.82)';
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';

    const targetTickPx = 95;
    const rawTick = duration / Math.max(1, width / targetTickPx);
    const tick = niceTick(rawTick);
    for (let t = 0; t <= duration + 0.001; t += tick) {
      const x = (t / duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillText(formatTimeShort(t), x + 4, 18);
    }
    ctx.restore();
  }

  function niceTick(seconds) {
    const choices = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    return choices.find(v => v >= seconds) || 1200;
  }

  function formatTimeShort(seconds) {
    seconds = Math.max(0, seconds || 0);
    if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function timeToX(time) {
    if (!state.buffer) return 0;
    return (time / state.buffer.duration) * el.waveCanvas.clientWidth;
  }

  function xToTime(x) {
    if (!state.buffer) return 0;
    return clamp((x / el.waveCanvas.clientWidth) * state.buffer.duration, 0, state.buffer.duration);
  }

  function pointerTime(event) {
    const rect = el.waveCanvas.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    return xToTime(x);
  }

  function cutSelection() {
    if (!state.buffer || !state.selection) return;
    const start = Math.min(state.selection.start, state.selection.end);
    const end = Math.max(state.selection.start, state.selection.end);
    if (end - start < 0.02) return;

    stopPlayback(false);
    const source = state.buffer;
    const sampleRate = source.sampleRate;
    const startSample = clamp(Math.round(start * sampleRate), 0, source.length);
    const endSample = clamp(Math.round(end * sampleRate), 0, source.length);
    const removed = endSample - startSample;
    if (removed <= 0) return;

    state.undoStack.push(source);
    state.redoStack = [];

    const ctx = ensureAudioContext();
    const cutClip = ctx.createBuffer(source.numberOfChannels, removed, source.sampleRate);
    const next = ctx.createBuffer(source.numberOfChannels, source.length - removed, source.sampleRate);
    for (let ch = 0; ch < source.numberOfChannels; ch++) {
      const oldData = source.getChannelData(ch);
      cutClip.copyToChannel(oldData.slice(startSample, endSample), ch);

      const newData = new Float32Array(next.length);
      newData.set(oldData.subarray(0, startSample), 0);
      newData.set(oldData.subarray(endSample), startSample);
      next.copyToChannel(newData, ch);
    }

    state.clipboardBuffer = cutClip;
    state.buffer = next;
    state.selection = null;
    state.pausedAt = clamp(start, 0, next.duration);
    updateButtons();
    updateReadouts();
    resizeCanvasAndDraw();
    setStatus(`Cut ${formatTime(removed / sampleRate)} from the audio and copied it for pasting.`, 'good');
  }

  function copySelection() {
    if (!state.buffer || !state.selection) return;
    const start = Math.min(state.selection.start, state.selection.end);
    const end = Math.max(state.selection.start, state.selection.end);
    if (end - start < 0.02) return;

    const source = state.buffer;
    const sampleRate = source.sampleRate;
    const startSample = clamp(Math.round(start * sampleRate), 0, source.length);
    const endSample = clamp(Math.round(end * sampleRate), 0, source.length);
    const copiedLength = endSample - startSample;
    if (copiedLength <= 0) return;

    const ctx = ensureAudioContext();
    const copied = ctx.createBuffer(source.numberOfChannels, copiedLength, source.sampleRate);
    for (let ch = 0; ch < source.numberOfChannels; ch++) {
      copied.copyToChannel(source.getChannelData(ch).slice(startSample, endSample), ch);
    }

    state.clipboardBuffer = copied;
    updateButtons();
    setStatus(`Copied ${formatTime(copied.duration)} of audio. Click the waveform to choose where to paste.`, 'good');
  }

  function pasteClipboard() {
    if (!state.buffer || !state.clipboardBuffer) return;

    stopPlayback(false);
    const source = state.buffer;
    const clip = state.clipboardBuffer;
    const sampleRate = source.sampleRate;
    const insertSample = clamp(Math.round(state.pausedAt * sampleRate), 0, source.length);

    if (clip.sampleRate !== sampleRate) {
      setStatus('That copied audio uses a different sample rate. Copy from the current file and try again.', 'error');
      return;
    }

    state.undoStack.push(source);
    state.redoStack = [];

    const ctx = ensureAudioContext();
    const next = ctx.createBuffer(source.numberOfChannels, source.length + clip.length, sampleRate);
    for (let ch = 0; ch < source.numberOfChannels; ch++) {
      const oldData = source.getChannelData(ch);
      const clipData = clip.getChannelData(Math.min(ch, clip.numberOfChannels - 1));
      const newData = new Float32Array(next.length);
      newData.set(oldData.subarray(0, insertSample), 0);
      newData.set(clipData, insertSample);
      newData.set(oldData.subarray(insertSample), insertSample + clip.length);
      next.copyToChannel(newData, ch);
    }

    const pasteStart = insertSample / sampleRate;
    const pasteEnd = (insertSample + clip.length) / sampleRate;
    state.buffer = next;
    state.selection = { start: pasteStart, end: pasteEnd };
    state.pausedAt = pasteEnd;
    updateButtons();
    updateReadouts();
    resizeCanvasAndDraw();
    setStatus(`Pasted ${formatTime(clip.duration)} at ${formatTime(pasteStart)}.`, 'good');
  }

  function clearSelection() {
    state.selection = null;
    updateButtons();
    updateReadouts();
    drawWaveform();
    setStatus('Selection cleared.');
  }

  function undo() {
    if (!state.undoStack.length) return;
    stopPlayback(false);
    state.redoStack.push(state.buffer);
    state.buffer = state.undoStack.pop();
    state.selection = null;
    state.pausedAt = clamp(state.pausedAt, 0, state.buffer.duration);
    updateButtons();
    updateReadouts();
    resizeCanvasAndDraw();
    setStatus('Undo complete.', 'good');
  }

  function redo() {
    if (!state.redoStack.length) return;
    stopPlayback(false);
    state.undoStack.push(state.buffer);
    state.buffer = state.redoStack.pop();
    state.selection = null;
    state.pausedAt = clamp(state.pausedAt, 0, state.buffer.duration);
    updateButtons();
    updateReadouts();
    resizeCanvasAndDraw();
    setStatus('Redo complete.', 'good');
  }

  function resetAudio() {
    if (!state.originalBuffer || state.buffer === state.originalBuffer) return;
    stopPlayback(false);
    state.undoStack.push(state.buffer);
    state.redoStack = [];
    state.buffer = state.originalBuffer;
    state.selection = null;
    state.pausedAt = 0;
    updateButtons();
    updateReadouts();
    resizeCanvasAndDraw();
    setStatus('Audio reset to the original upload.', 'good');
  }

  function setZoom(nextZoom) {
    const oldWidth = el.waveCanvas.clientWidth || 1;
    const center = el.waveScroll.scrollLeft + el.waveScroll.clientWidth / 2;
    const centerRatio = center / oldWidth;
    state.zoom = clamp(nextZoom, 1, 36);
    resizeCanvasAndDraw();
    const newWidth = el.waveCanvas.clientWidth || 1;
    el.waveScroll.scrollLeft = Math.max(0, centerRatio * newWidth - el.waveScroll.clientWidth / 2);
    setStatus(`Zoom: ${Math.round(state.zoom * 100)}%.`);
  }

  function encodeWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = clamp(channelData[ch][i], -1, 1);
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportWav() {
    if (!state.buffer) return;
    setStatus('Exporting WAV…');
    const blob = encodeWav(state.buffer);
    downloadBlob(blob, `${state.fileStem}-chopped.wav`);
    setStatus('WAV exported.', 'good');
  }

  function floatTo16BitPcm(float32) {
    const output = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = clamp(float32[i], -1, 1);
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  function getMp3Channels(buffer) {
    if (buffer.numberOfChannels === 1) {
      return { channels: 1, left: floatTo16BitPcm(buffer.getChannelData(0)), right: null };
    }
    return {
      channels: 2,
      left: floatTo16BitPcm(buffer.getChannelData(0)),
      right: floatTo16BitPcm(buffer.getChannelData(1)),
    };
  }

  function delayFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  function setProgress(percent, text, visible = true) {
    el.progressWrap.classList.toggle('hidden', !visible);
    el.progressBar.style.width = `${clamp(percent, 0, 100)}%`;
    el.progressText.textContent = text || '';
  }

  async function exportMp3() {
    if (!state.buffer) return;
    if (!window.lamejs || !window.lamejs.Mp3Encoder) {
      setStatus('MP3 encoder could not load. Check your internet connection, or export WAV instead.', 'error');
      return;
    }

    const kbps = Number(el.bitrateSelect.value) || 128;
    const buffer = state.buffer;
    const sampleRate = buffer.sampleRate;
    const { channels, left, right } = getMp3Channels(buffer);
    const encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Data = [];
    const blockSize = 1152;
    const totalBlocks = Math.ceil(left.length / blockSize);

    setStatus(`Encoding MP3 at ${kbps} kbps…`);
    setProgress(0, 'Encoding MP3…', true);
    toggleExportButtons(true);

    try {
      for (let block = 0; block < totalBlocks; block++) {
        const start = block * blockSize;
        const end = Math.min(start + blockSize, left.length);
        const leftChunk = left.subarray(start, end);
        let mp3buf;
        if (channels === 1) {
          mp3buf = encoder.encodeBuffer(leftChunk);
        } else {
          const rightChunk = right.subarray(start, end);
          mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
        }
        if (mp3buf.length > 0) mp3Data.push(mp3buf);

        if (block % 35 === 0 || block === totalBlocks - 1) {
          const percent = Math.round(((block + 1) / totalBlocks) * 96);
          setProgress(percent, `Encoding MP3… ${percent}%`, true);
          await delayFrame();
        }
      }

      const finalBuffer = encoder.flush();
      if (finalBuffer.length > 0) mp3Data.push(finalBuffer);
      setProgress(100, 'MP3 ready.', true);
      const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
      downloadBlob(blob, `${state.fileStem}-chopped.mp3`);
      setStatus('MP3 exported.', 'good');
      setTimeout(() => setProgress(0, '', false), 900);
    } catch (error) {
      console.error(error);
      setStatus('MP3 export failed. Try a shorter file, lower bitrate, or export WAV.', 'error');
      setProgress(0, '', false);
    } finally {
      toggleExportButtons(false);
    }
  }

  function toggleExportButtons(disabled) {
    el.exportWavBtn.disabled = disabled || !state.buffer;
    el.exportMp3Btn.disabled = disabled || !state.buffer;
  }

  function bindEvents() {
    el.fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));
    el.playBtn.addEventListener('click', () => startPlayback());
    el.pauseBtn.addEventListener('click', pausePlayback);
    el.stopBtn.addEventListener('click', () => stopPlayback(true));
    el.cutBtn.addEventListener('click', cutSelection);
    el.copyBtn.addEventListener('click', copySelection);
    el.pasteBtn.addEventListener('click', pasteClipboard);
    el.clearSelectionBtn.addEventListener('click', clearSelection);
    el.undoBtn.addEventListener('click', undo);
    el.redoBtn.addEventListener('click', redo);
    el.resetBtn.addEventListener('click', resetAudio);
    el.zoomOutBtn.addEventListener('click', () => setZoom(state.zoom / 1.65));
    el.zoomFitBtn.addEventListener('click', () => setZoom(1));
    el.zoomInBtn.addEventListener('click', () => setZoom(state.zoom * 1.65));
    el.exportWavBtn.addEventListener('click', exportWav);
    el.exportMp3Btn.addEventListener('click', exportMp3);

    el.waveCanvas.addEventListener('pointerdown', (event) => {
      if (!state.buffer) return;
      state.dragging = true;
      state.dragMoved = false;
      state.dragStartTime = pointerTime(event);
      state.selection = { start: state.dragStartTime, end: state.dragStartTime };
      el.waveCanvas.setPointerCapture(event.pointerId);
      updateButtons();
      updateReadouts();
      drawWaveform();
    });

    el.waveCanvas.addEventListener('pointermove', (event) => {
      if (!state.dragging || !state.buffer) return;
      const time = pointerTime(event);
      if (Math.abs(time - state.dragStartTime) > 0.02) state.dragMoved = true;
      state.selection.end = time;
      updateButtons();
      updateReadouts();
      drawWaveform();
    });

    el.waveCanvas.addEventListener('pointerup', (event) => {
      if (!state.dragging || !state.buffer) return;
      state.dragging = false;
      const endTime = pointerTime(event);
      const diff = Math.abs(endTime - state.dragStartTime);
      if (!state.dragMoved || diff < 0.02) {
        state.selection = null;
        seekTo(endTime);
        setStatus(`Playhead moved to ${formatTime(endTime)}.`);
      } else {
        state.selection.start = Math.min(state.dragStartTime, endTime);
        state.selection.end = Math.max(state.dragStartTime, endTime);
        setStatus('Selection ready. Cut it, copy it, or move the playhead and paste copied audio.');
      }
      updateButtons();
      updateReadouts();
      drawWaveform();
    });

    el.waveCanvas.addEventListener('pointercancel', () => {
      state.dragging = false;
    });

    window.addEventListener('resize', () => {
      if (!state.buffer) return;
      resizeCanvasAndDraw();
    });

    window.addEventListener('keydown', (event) => {
      if (!state.buffer) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;

      if (event.code === 'Space') {
        event.preventDefault();
        state.isPlaying ? pausePlayback() : startPlayback();
      } else if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      } else if (event.key.toLowerCase() === 'c' && (event.ctrlKey || event.metaKey)) {
        if (state.selection) {
          event.preventDefault();
          copySelection();
        }
      } else if (event.key.toLowerCase() === 'v' && (event.ctrlKey || event.metaKey)) {
        if (state.clipboardBuffer) {
          event.preventDefault();
          pasteClipboard();
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selection) {
          event.preventDefault();
          cutSelection();
        }
      } else if (event.key === 'Escape') {
        clearSelection();
      }
    });
  }

  bindEvents();
  updateButtons();
})();
