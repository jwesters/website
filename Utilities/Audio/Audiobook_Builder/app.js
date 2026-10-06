(() => {
  'use strict';

  const APP_VERSION = '2026.10.05-fast1';
  console.info(`Audiobook Builder ${APP_VERSION}`);

  const $ = sel => document.querySelector(sel);
  const els = {
    themeToggle: $('#themeToggle'), helpBtn: $('#helpBtn'), helpDialog: $('#helpDialog'), closeHelpBtn: $('#closeHelpBtn'),
    dropZone: $('#dropZone'), chooseFilesBtn: $('#chooseFilesBtn'), fileInput: $('#fileInput'), compatBanner: $('#compatBanner'),
    chapterSummary: $('#chapterSummary'), chapterList: $('#chapterList'), sortBtn: $('#sortBtn'), clearBtn: $('#clearBtn'),
    coverBtn: $('#coverBtn'), coverInput: $('#coverInput'), coverPreview: $('#coverPreview'), removeCoverBtn: $('#removeCoverBtn'),
    metaTitle: $('#metaTitle'), metaAuthor: $('#metaAuthor'), metaNarrator: $('#metaNarrator'), metaYear: $('#metaYear'), metaGenre: $('#metaGenre'), metaDescription: $('#metaDescription'),
    buildMode: $('#buildMode'), qualityPreset: $('#qualityPreset'), bitrate: $('#bitrate'), channels: $('#channels'), sampleRate: $('#sampleRate'), normalize: $('#normalize'), silence: $('#silence'), silenceValue: $('#silenceValue'),
    engineNote: $('#engineNote'),
    buildBtn: $('#buildBtn'), cancelBtn: $('#cancelBtn'), buildStatus: $('#buildStatus'), progressWrap: $('#progressWrap'), progressBar: $('#progressBar'), progressLabel: $('#progressLabel'), progressPercent: $('#progressPercent'),
    resultPanel: $('#resultPanel'), resultName: $('#resultName'), resultInfo: $('#resultInfo'), downloadBtn: $('#downloadBtn')
  };

  const AUDIO_EXTS = new Set(['mp3','wav','m4a','aac','flac','ogg','opus']);
  const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  let chapters = [];
  let cover = null;
  let resultUrl = null;
  let resultBlob = null;
  let cancelled = false;
  let busy = false;
  let draggedId = null;
  let lastEngineState = null;

  function baseName(name) { return name.replace(/\.[^.]+$/, ''); }
  function ext(name) { const m = name.toLowerCase().match(/\.([^.]+)$/); return m ? m[1] : ''; }
  function fmtTime(sec) {
    if (!Number.isFinite(sec)) return '—';
    const s = Math.max(0, Math.round(sec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600)/60), r = s % 60;
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${m}:${String(r).padStart(2,'0')}`;
  }
  function fmtBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    const u = ['B','KB','MB','GB','TB']; let i=0, n=bytes;
    while (n >= 1024 && i < u.length-1) { n/=1024; i++; }
    return `${n >= 100 || i===0 ? n.toFixed(0) : n.toFixed(1)} ${u[i]}`;
  }
  function safeFilename(name) {
    const s = (name || 'audiobook').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').replace(/[. ]+$/g,'');
    return `${s || 'audiobook'}.m4b`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function setBanner(message, kind='') {
    if (!message) { els.compatBanner.className = 'banner hidden'; els.compatBanner.textContent=''; return; }
    els.compatBanner.className = `banner ${kind}`.trim();
    els.compatBanner.textContent = message;
  }
  function updateProgress(pct, label) {
    const n = Math.max(0, Math.min(100, pct));
    els.progressBar.style.width = `${n}%`;
    els.progressPercent.textContent = `${Math.round(n)}%`;
    if (label) els.progressLabel.textContent = label;
  }
  function throwIfCancelled() { if (cancelled) throw new DOMException('Build cancelled', 'AbortError'); }
  function nextFrame() { return new Promise(r => requestAnimationFrame(() => r())); }
  function sleep(ms=0) { return new Promise(r => setTimeout(r, ms)); }
  function isFastMode() { return !els.buildMode || els.buildMode.value === 'fast'; }
  function isSafeMode() { return els.buildMode && els.buildMode.value === 'safe'; }

  function restoreTheme() {
    const saved = localStorage.getItem('audiobookBuilderTheme');
    if (saved) document.documentElement.dataset.theme = saved;
    else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
  }
  restoreTheme();
  els.themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    localStorage.setItem('audiobookBuilderTheme', dark ? 'light' : 'dark');
  });

  els.helpBtn.addEventListener('click', () => els.helpDialog.showModal());
  els.closeHelpBtn.addEventListener('click', () => els.helpDialog.close());
  els.helpDialog.addEventListener('click', e => { if (e.target === els.helpDialog) els.helpDialog.close(); });

  els.chooseFilesBtn.addEventListener('click', e => { e.stopPropagation(); els.fileInput.click(); });
  els.dropZone.addEventListener('click', e => { if (e.target === els.dropZone || e.target.closest('.drop-icon,h2,p,small')) els.fileInput.click(); });
  els.dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); } });
  for (const ev of ['dragenter','dragover']) els.dropZone.addEventListener(ev, e => { e.preventDefault(); els.dropZone.classList.add('dragover'); });
  for (const ev of ['dragleave','drop']) els.dropZone.addEventListener(ev, e => { e.preventDefault(); els.dropZone.classList.remove('dragover'); });
  els.dropZone.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
  els.fileInput.addEventListener('change', () => { addFiles([...els.fileInput.files]); els.fileInput.value=''; });

  async function probeDuration(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('audio');
      let settled = false;
      const done = val => {
        if (settled) return; settled = true;
        URL.revokeObjectURL(url); a.removeAttribute('src'); try { a.load(); } catch {}
        resolve(val);
      };
      const timer = setTimeout(() => done(NaN), 10000);
      a.preload = 'metadata';
      a.onloadedmetadata = () => { clearTimeout(timer); done(a.duration); };
      a.onerror = () => { clearTimeout(timer); done(NaN); };
      a.src = url;
    });
  }

  async function addFiles(files) {
    if (busy) return;
    clearResult();
    const audio = files.filter(f => AUDIO_EXTS.has(ext(f.name)) || (f.type && f.type.startsWith('audio/')));
    if (!audio.length) { setBanner('No supported audio files were selected.', 'error'); return; }
    setBanner(`Reading ${audio.length} file${audio.length===1?'':'s'}…`);
    const incoming = [];
    for (const file of audio) {
      incoming.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        file,
        name: baseName(file.name),
        duration: await probeDuration(file),
        previewUrl: URL.createObjectURL(file)
      });
    }
    chapters.push(...incoming);
    chapters.sort((a,b) => naturalCompare(a.file.name,b.file.name));
    if (!els.metaTitle.value && chapters.length) {
      const first = chapters[0].file.name;
      const guess = baseName(first).replace(/(?:^|[ _.-])(?:chapter|chap|ch)?\s*\d+.*$/i,'').replace(/[ _.-]+$/,'').trim();
      if (guess.length >= 3) els.metaTitle.value = guess;
    }
    renderChapters();
    await refreshEngineStatus(true);
  }

  function renderChapters() {
    const total = chapters.reduce((s,c) => s + (Number.isFinite(c.duration) ? c.duration : 0), 0);
    els.chapterSummary.textContent = chapters.length ? `${chapters.length} chapter${chapters.length===1?'':'s'} • about ${fmtTime(total)}` : 'No chapters added yet.';
    els.sortBtn.disabled = !chapters.length || busy;
    els.clearBtn.disabled = !chapters.length || busy;
    els.buildBtn.disabled = !chapters.length || busy;

    if (!chapters.length) {
      els.chapterList.className = 'chapter-list empty-state';
      els.chapterList.innerHTML = '<div class="empty-message">Each uploaded file becomes one chapter. You can rename and rearrange them here.</div>';
      els.buildStatus.textContent = 'Add at least one audio file to begin.';
      return;
    }

    els.chapterList.className = 'chapter-list';
    els.chapterList.innerHTML = '';
    chapters.forEach((c, idx) => {
      const row = document.createElement('div');
      row.className = 'chapter-row'; row.draggable = !busy; row.dataset.id = c.id;
      row.innerHTML = `
        <div class="drag-handle" title="Drag to reorder" aria-hidden="true">☰</div>
        <div class="chapter-main">
          <input class="chapter-name" value="${escapeHtml(c.name)}" aria-label="Chapter ${idx+1} name" ${busy?'disabled':''} />
          <div class="chapter-file"><span>${escapeHtml(c.file.name)}</span><span class="duration">${fmtTime(c.duration)} • ${fmtBytes(c.file.size)}</span></div>
        </div>
        <div class="chapter-preview"><audio controls preload="none" src="${c.previewUrl}"></audio></div>
        <div class="chapter-actions">
          <button class="mini-btn move-up" type="button" title="Move up" ${idx===0||busy?'disabled':''}>↑</button>
          <button class="mini-btn move-down" type="button" title="Move down" ${idx===chapters.length-1||busy?'disabled':''}>↓</button>
          <button class="mini-btn remove" type="button" title="Remove chapter" ${busy?'disabled':''}>×</button>
        </div>`;
      const input = row.querySelector('.chapter-name');
      input.addEventListener('input', () => c.name = input.value);
      row.querySelector('.move-up').addEventListener('click', () => moveChapter(idx, idx-1));
      row.querySelector('.move-down').addEventListener('click', () => moveChapter(idx, idx+1));
      row.querySelector('.remove').addEventListener('click', () => removeChapter(c.id));
      row.addEventListener('dragstart', e => { draggedId = c.id; row.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
      row.addEventListener('dragend', () => { draggedId=null; row.classList.remove('dragging'); });
      row.addEventListener('dragover', e => { if (!busy) { e.preventDefault(); e.dataTransfer.dropEffect='move'; } });
      row.addEventListener('drop', e => {
        if (busy) return; e.preventDefault();
        const from = chapters.findIndex(x=>x.id===draggedId), to = chapters.findIndex(x=>x.id===c.id);
        if (from >= 0 && to >= 0 && from !== to) moveChapter(from,to);
      });
      els.chapterList.appendChild(row);
    });

    const silenceSeconds = Number(els.silence.value || 0);
    const durationWithGaps = total + Math.max(0, chapters.length - 1) * silenceSeconds;
    const aacBytes = durationWithGaps * Number(els.bitrate.value || 96000) / 8;
    const compatRate = Number(els.sampleRate.value || 44100) * 34 * 8 / 64 * Number(els.channels.value || 1);
    const compatBytes = durationWithGaps * compatRate / 8;
    els.buildStatus.textContent = `Estimated AAC: ${fmtBytes(aacBytes)}. Built-in compatibility fallback: ${fmtBytes(compatBytes)}.`;
  }

  function moveChapter(from,to) {
    if (to < 0 || to >= chapters.length || from===to) return;
    clearResult();
    const [item] = chapters.splice(from,1); chapters.splice(to,0,item); renderChapters();
  }
  function removeChapter(id) {
    clearResult();
    const i = chapters.findIndex(c=>c.id===id); if (i<0) return;
    URL.revokeObjectURL(chapters[i].previewUrl); chapters.splice(i,1); renderChapters();
  }
  function clearChapters() {
    for (const c of chapters) URL.revokeObjectURL(c.previewUrl);
    chapters = []; renderChapters(); clearResult(); setBanner('');
  }
  els.sortBtn.addEventListener('click', () => { chapters.sort((a,b)=>naturalCompare(a.file.name,b.file.name)); renderChapters(); });
  els.clearBtn.addEventListener('click', clearChapters);

  els.coverBtn.addEventListener('click', () => els.coverInput.click());
  els.coverInput.addEventListener('change', async () => {
    const f = els.coverInput.files[0]; if (!f) return;
    if (!['image/jpeg','image/png'].includes(f.type) && !/\.(jpe?g|png)$/i.test(f.name)) { setBanner('Cover art must be JPG or PNG.', 'error'); return; }
    clearResult();
    cover = { file: f, mime: f.type || (/png$/i.test(f.name)?'image/png':'image/jpeg'), bytes: new Uint8Array(await f.arrayBuffer()), url: URL.createObjectURL(f) };
    els.coverPreview.innerHTML = `<img src="${cover.url}" alt="Cover preview" />`;
    els.removeCoverBtn.disabled = false;
    els.coverInput.value='';
  });
  els.removeCoverBtn.addEventListener('click', () => {
    clearResult();
    if (cover?.url) URL.revokeObjectURL(cover.url); cover=null; els.coverPreview.textContent='No cover'; els.removeCoverBtn.disabled=true;
  });

  els.silence.addEventListener('input', () => { clearResult(); els.silenceValue.textContent = `${Number(els.silence.value).toFixed(1)} s`; renderChapters(); });
  els.qualityPreset.addEventListener('change', () => {
    clearResult();
    const presets = {
      compact: {bitrate:'64000',channels:'1',sampleRate:'22050'},
      standard:{bitrate:'96000',channels:'1',sampleRate:'32000'},
      high:{bitrate:'128000',channels:'1',sampleRate:'44100'},
      veryhigh:{bitrate:'160000',channels:'2',sampleRate:'44100'}
    };
    const p = presets[els.qualityPreset.value];
    els.bitrate.value=p.bitrate; els.channels.value=p.channels; els.sampleRate.value=p.sampleRate;
    renderChapters(); refreshEngineStatus(false);
  });
  for (const el of [els.buildMode, els.bitrate, els.channels, els.sampleRate, els.normalize]) el.addEventListener('change', () => { clearResult(); renderChapters(); refreshEngineStatus(false); });
  for (const el of [els.metaTitle,els.metaAuthor,els.metaNarrator,els.metaYear,els.metaGenre,els.metaDescription]) el.addEventListener('input', clearResult);

  function desiredAacConfig() {
    return {
      codec:'mp4a.40.2',
      sampleRate:Number(els.sampleRate.value),
      numberOfChannels:Number(els.channels.value),
      bitrate:Number(els.bitrate.value)
    };
  }

  async function findAacConfig(desired = desiredAacConfig()) {
    if (!window.isSecureContext || location.protocol === 'file:' || !('AudioEncoder' in window) || !('AudioData' in window)) return null;
    const candidates = [];
    const add = (sampleRate, numberOfChannels, bitrate) => {
      const key = `${sampleRate}/${numberOfChannels}/${bitrate}`;
      if (!candidates.some(c => c.key === key)) candidates.push({ key, config:{codec:'mp4a.40.2',sampleRate,numberOfChannels,bitrate} });
    };
    add(desired.sampleRate, desired.numberOfChannels, desired.bitrate);
    for (const rate of [desired.sampleRate, 48000, 44100, 32000, 22050]) {
      for (const br of [desired.bitrate, 64000, 96000, 128000, 160000, 192000]) add(rate, desired.numberOfChannels, br);
    }
    if (desired.numberOfChannels !== 1) {
      for (const rate of [desired.sampleRate, 48000, 44100, 32000, 22050]) {
        for (const br of [64000, 96000, 128000]) add(rate, 1, br);
      }
    }
    for (const c of candidates) {
      try {
        const support = await AudioEncoder.isConfigSupported(c.config);
        if (support.supported) return { config:{...c.config,...(support.config || {})}, changed:c.key !== `${desired.sampleRate}/${desired.numberOfChannels}/${desired.bitrate}` };
      } catch {}
    }
    return null;
  }

  async function refreshEngineStatus(showBanner=false) {
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
      lastEngineState = {mode:'none'};
      if (els.engineNote) els.engineNote.textContent = 'This browser does not provide Web Audio decoding.';
      if (showBanner) setBanner('This browser cannot decode audio locally. Use current Chrome, Edge, or Safari.', 'error');
      return;
    }
    const choice = isSafeMode() ? null : await findAacConfig();
    const mp3Fallback = window.isSecureContext && ('AudioDecoder' in window) && ('EncodedAudioChunk' in window);
    const mp3Note = mp3Fallback ? ' Low-level MP3 fallback is available.' : (location.protocol === 'file:' ? ' This web build must be hosted over HTTPS for the low-level MP3 fallback.' : '');
    if (choice) {
      lastEngineState = {mode:'aac',choice,mp3Fallback};
      if (els.engineNote) els.engineNote.textContent = `${isFastMode() ? 'Fast' : (isSafeMode() ? 'Compatibility' : 'Balanced')}: AAC-LC is available. If AAC fails, the app automatically retries with the built-in Apple IMA4 compatibility encoder.${mp3Note}`;
      if (showBanner && chapters.length) setBanner(`Ready. AAC-LC is available, with an automatic built-in output fallback.${mp3Fallback ? ' MP3 fallback decoding is also ready.' : ''}`, 'success');
    } else {
      lastEngineState = {mode:'ima4',mp3Fallback};
      if (els.engineNote) els.engineNote.textContent = `Built-in compatibility mode: Apple IMA4 will be used for output. It needs no browser AAC encoder.${mp3Note}`;
      if (showBanner && chapters.length) setBanner(`Ready in compatibility mode.${mp3Fallback ? ' Low-level MP3 fallback decoding is also ready.' : ''}`, 'success');
    }
  }

  function setBusy(v) {
    busy=v;
    els.buildBtn.disabled = v || !chapters.length;
    els.cancelBtn.classList.toggle('hidden', !v);
    els.fileInput.disabled = v; els.coverBtn.disabled=v; els.removeCoverBtn.disabled=v || !cover; els.sortBtn.disabled=v || !chapters.length; els.clearBtn.disabled=v || !chapters.length;
    for (const el of [els.metaTitle,els.metaAuthor,els.metaNarrator,els.metaYear,els.metaGenre,els.metaDescription,els.buildMode,els.qualityPreset,els.bitrate,els.channels,els.sampleRate,els.normalize,els.silence]) el.disabled=v;
    renderChapters();
  }

  function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl=null; resultBlob=null; els.resultPanel.classList.add('hidden');
  }

  els.cancelBtn.addEventListener('click', () => { cancelled=true; els.cancelBtn.disabled=true; els.progressLabel.textContent='Cancelling after the current audio task…'; });
  els.downloadBtn.addEventListener('click', () => {
    if (!resultUrl || !resultBlob) return;
    const a=document.createElement('a'); a.href=resultUrl; a.download=els.resultName.textContent; document.body.appendChild(a); a.click(); a.remove();
  });
  els.buildBtn.addEventListener('click', buildAudiobook);

  function getMetadata() {
    return {
      title: els.metaTitle.value.trim() || 'Audiobook',
      author: els.metaAuthor.value.trim(),
      narrator: els.metaNarrator.value.trim(),
      year: els.metaYear.value.trim(),
      genre: els.metaGenre.value.trim() || 'Audiobook',
      description: els.metaDescription.value.trim()
    };
  }

  async function buildAudiobook() {
    if (!chapters.length || busy) return;
    const unnamed = chapters.find(c => !c.name.trim());
    if (unnamed) { setBanner('Every chapter needs a name before building.', 'error'); return; }
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) { setBanner('This browser cannot decode audio locally.', 'error'); return; }

    clearResult(); cancelled=false; els.cancelBtn.disabled=false; setBusy(true); els.progressWrap.classList.remove('hidden'); updateProgress(0,'Preparing audiobook…'); setBanner('');
    const metadata = getMetadata();
    let aacFailure = null;
    try {
      throwIfCancelled();
      const choice = isSafeMode() ? null : await findAacConfig();
      let outcome = null;
      if (choice) {
        try {
          outcome = await buildWithAac(choice, metadata);
        } catch (e) {
          if (e?.name === 'AbortError') throw e;
          aacFailure = e;
          console.warn('AAC build failed, retrying with built-in compatibility encoder:', e);
          setBanner(`AAC encoding failed (${e?.message || e}). Retrying automatically with the built-in compatibility encoder…`);
          updateProgress(1,'Switching to built-in compatibility encoder…');
          await sleep(50);
        }
      }
      if (!outcome) outcome = await buildWithIma4(metadata);
      throwIfCancelled();

      resultBlob = outcome.blob;
      resultUrl = URL.createObjectURL(resultBlob);
      const filename = safeFilename(metadata.title);
      els.resultName.textContent = filename;
      els.resultInfo.textContent = `${fmtBytes(resultBlob.size)} • ${chapters.length} chapter${chapters.length===1?'':'s'} • ${fmtTime(outcome.duration)} • ${outcome.codecLabel}`;
      els.resultPanel.classList.remove('hidden');
      els.buildStatus.textContent = `Audiobook built successfully using ${outcome.codecLabel}. Your source audio never left this device.`;
      updateProgress(100,'Complete');
      if (outcome.codec === 'ima4') {
        setBanner(aacFailure ? 'M4B created successfully with the built-in compatibility encoder after the browser AAC encoder failed.' : 'M4B created successfully with the built-in compatibility encoder.', 'success');
      } else {
        setBanner('M4B created successfully with AAC-LC.', 'success');
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
        els.buildStatus.textContent = 'Build cancelled.'; setBanner('Build cancelled. No output file was created.'); updateProgress(0,'Cancelled');
      } else {
        console.error(e);
        els.buildStatus.textContent = 'Build failed.';
        setBanner(`Build failed: ${e?.message || e}`, 'error');
        updateProgress(0,'Build failed');
      }
    } finally {
      setBusy(false); els.cancelBtn.disabled=false; refreshEngineStatus(false);
    }
  }

  function createDecodeContext(sampleRate) {
    // OfflineAudioContext avoids opening an audio output device. It is ideal
    // here because we only need decodeAudioData(), and it works in headless,
    // muted, and ordinary desktop/browser environments.
    if ('OfflineAudioContext' in window) return new OfflineAudioContext(1, 1, sampleRate);
    const Ctx = window.AudioContext || window.webkitAudioContext;
    return new Ctx({ sampleRate });
  }

  async function closeDecodeContext(ctx) {
    if (!ctx) return;
    if (typeof ctx.close === 'function' && ctx.state !== 'closed') {
      try { await ctx.close(); } catch {}
    }
  }

  function parseMp3Header(bytes, offset) {
    if (offset + 4 > bytes.length) return null;
    const b0 = bytes[offset], b1 = bytes[offset + 1], b2 = bytes[offset + 2], b3 = bytes[offset + 3];
    if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null;
    const versionBits = (b1 >> 3) & 3;
    const layerBits = (b1 >> 1) & 3;
    const bitrateIndex = (b2 >> 4) & 15;
    const sampleRateIndex = (b2 >> 2) & 3;
    const padding = (b2 >> 1) & 1;
    const channelMode = (b3 >> 6) & 3;
    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) return null;

    const version = versionBits === 3 ? 1 : (versionBits === 2 ? 2 : 2.5);
    const bitratesMpeg1 = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
    const bitratesMpeg2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0];
    const bitrate = (version === 1 ? bitratesMpeg1 : bitratesMpeg2)[bitrateIndex] * 1000;
    let sampleRate = [44100,48000,32000][sampleRateIndex];
    if (version === 2) sampleRate /= 2;
    else if (version === 2.5) sampleRate /= 4;
    const samplesPerFrame = version === 1 ? 1152 : 576;
    const frameLength = Math.floor((version === 1 ? 144 : 72) * bitrate / sampleRate) + padding;
    if (!frameLength || frameLength < 24) return null;
    return { version, sampleRate, channels: channelMode === 3 ? 1 : 2, samplesPerFrame, frameLength, bitrate };
  }

  function id3v2End(bytes) {
    if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;
    if ((bytes[6] | bytes[7] | bytes[8] | bytes[9]) & 0x80) return 0;
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    return Math.min(bytes.length, 10 + size + ((bytes[5] & 0x10) ? 10 : 0));
  }

  function parseMp3Frames(bytes) {
    const frames = [];
    let offset = id3v2End(bytes);
    let locked = false;
    let reference = null;

    while (offset + 4 <= bytes.length) {
      const h = parseMp3Header(bytes, offset);
      if (!h || offset + h.frameLength > bytes.length) {
        if (locked && bytes.length - offset < 4096) break;
        locked = false;
        reference = null;
        offset++;
        continue;
      }

      if (!locked) {
        const nextOffset = offset + h.frameLength;
        const next = parseMp3Header(bytes, nextOffset);
        // Require two consecutive frames before locking on to a sync word. This
        // avoids false sync patterns in tags, cover art, or arbitrary binary data.
        if (!next || next.sampleRate !== h.sampleRate || next.version !== h.version || nextOffset + next.frameLength > bytes.length) {
          offset++;
          continue;
        }
        locked = true;
        reference = { sampleRate: h.sampleRate, version: h.version, channels: h.channels };
      }

      if (h.sampleRate !== reference.sampleRate || h.version !== reference.version) {
        // A legal MP3 should not change sample rate/version midstream. Resync if
        // the file contains junk between frame groups.
        locked = false;
        reference = null;
        offset++;
        continue;
      }

      frames.push({ offset, length: h.frameLength, sampleRate: h.sampleRate, channels: h.channels, samplesPerFrame: h.samplesPerFrame, bitrate: h.bitrate });
      offset += h.frameLength;
    }

    if (frames.length < 2) return null;
    const first = frames[0];
    const totalSamples = frames.reduce((sum, f) => sum + f.samplesPerFrame, 0);
    return {
      frames,
      sampleRate: first.sampleRate,
      channels: first.channels,
      totalSamples,
      duration: totalSamples / first.sampleRate
    };
  }

  async function decodeMp3WithWebCodecs(file) {
    if (!window.isSecureContext || !('AudioDecoder' in window) || !('EncodedAudioChunk' in window)) {
      throw new Error('The MP3 fallback decoder requires this app to be hosted over HTTPS in Chrome/Edge.');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    throwIfCancelled();
    const parsed = parseMp3Frames(bytes);
    if (!parsed) throw new Error('The file does not contain a readable MPEG Layer III frame stream.');

    let support;
    try {
      support = await AudioDecoder.isConfigSupported({ codec: 'mp3', sampleRate: parsed.sampleRate, numberOfChannels: parsed.channels });
    } catch (e) {
      throw new Error(`This browser could not check MP3 decoder support: ${e?.message || e}`);
    }
    if (!support?.supported) throw new Error('This browser does not expose its MP3 decoder through WebCodecs.');

    // Allocate from the compressed frame count. Decoders may trim encoder
    // delay/padding, so this is an upper bound rather than an exact length.
    const capacity = parsed.totalSamples + 4096;
    const planes = Array.from({ length: parsed.channels }, () => new Float32Array(capacity));
    let written = 0;
    let outputRate = parsed.sampleRate;
    let outputChannels = parsed.channels;
    let decoderError = null;

    const decoder = new AudioDecoder({
      output: data => {
        try {
          const frames = data.numberOfFrames;
          const channels = data.numberOfChannels;
          outputRate = data.sampleRate || outputRate;
          outputChannels = channels || outputChannels;
          if (written + frames > capacity) throw new Error('Decoded MP3 exceeded the expected frame count.');
          for (let c = 0; c < Math.min(channels, planes.length); c++) {
            data.copyTo(planes[c].subarray(written, written + frames), { planeIndex: c, format: 'f32-planar' });
          }
          // If a decoder unexpectedly reports mono from a stereo header, keep
          // the second channel coherent rather than leaving it as silence.
          if (channels === 1 && planes.length > 1) planes[1].set(planes[0].subarray(written, written + frames), written);
          written += frames;
        } catch (e) {
          decoderError = e;
        } finally {
          data.close();
        }
      },
      error: e => { decoderError = e; }
    });

    try {
      decoder.configure({ codec: 'mp3', sampleRate: parsed.sampleRate, numberOfChannels: parsed.channels });
      let timestamp = 0;
      for (let i = 0; i < parsed.frames.length; i++) {
        throwIfCancelled();
        if (decoderError) throw decoderError;
        const f = parsed.frames[i];
        const duration = Math.round(f.samplesPerFrame * 1e6 / f.sampleRate);
        decoder.decode(new EncodedAudioChunk({
          type: 'key',
          timestamp: Math.round(timestamp),
          duration,
          data: bytes.subarray(f.offset, f.offset + f.length)
        }));
        timestamp += f.samplesPerFrame * 1e6 / f.sampleRate;
        const highWater = isFastMode() ? 64 : 24;
        const lowWater = isFastMode() ? 32 : 12;
        if (decoder.decodeQueueSize > highWater) {
          let guard = 0;
          while (decoder.decodeQueueSize > lowWater && guard++ < 800) { throwIfCancelled(); await sleep(isFastMode() ? 0 : 2); }
          if (decoder.decodeQueueSize > lowWater) throw new Error('The browser MP3 decoder queue stopped draining.');
        }
        if ((i & 63) === 0) await sleep(0);
      }
      await withTimeout(decoder.flush(), 60000, 'The browser MP3 decoder stopped responding while finishing this chapter.');
      if (decoderError) throw decoderError;
    } finally {
      if (decoder.state !== 'closed') try { decoder.close(); } catch {}
    }

    if (!written) throw new Error('The MP3 decoder produced no audio samples.');
    const usableChannels = Math.max(1, Math.min(planes.length, outputChannels));
    const views = planes.slice(0, usableChannels).map(p => p.subarray(0, written));
    return {
      sampleRate: outputRate,
      numberOfChannels: usableChannels,
      length: written,
      duration: written / outputRate,
      getChannelData(index) { return views[Math.max(0, Math.min(index, views.length - 1))]; }
    };
  }

  async function decodeChapter(audioContext, chapter) {
    if (chapter.file.size > 600*1024*1024) setBanner(`“${chapter.file.name}” is very large for browser decoding. Processing will continue one chapter at a time.`, 'error');
    let arr = await chapter.file.arrayBuffer();
    throwIfCancelled();
    try {
      const buffer = await audioContext.decodeAudioData(arr);
      arr = null;
      return buffer;
    } catch (webAudioError) {
      arr = null;
      // Chromium's Web Audio decoder can reject some perfectly valid MP3s
      // (often files with unusual tags/VBR headers). WebCodecs accepts raw MP3
      // frames, so use it as an independent second decoder instead of failing
      // the entire audiobook build.
      try {
        const fallbackBuffer = await decodeMp3WithWebCodecs(chapter.file);
        setBanner(`Web Audio rejected “${chapter.file.name}”, so Audiobook Builder switched to its low-level MP3 decoder.`, 'success');
        return fallbackBuffer;
      } catch (mp3Error) {
        const extra = ext(chapter.file.name) === 'mp3' || /mpeg|mp3/i.test(chapter.file.type || '')
          ? ` MP3 fallback also failed: ${mp3Error?.message || mp3Error}`
          : '';
        throw new Error(`Could not decode “${chapter.file.name}”. Web Audio reported: ${webAudioError?.message || webAudioError}.${extra}`.trim());
      }
    }
  }

  function descriptionBytes(description) {
    if (!description) return null;
    if (description instanceof ArrayBuffer) return new Uint8Array(description.slice(0));
    if (ArrayBuffer.isView(description)) return new Uint8Array(description.buffer.slice(description.byteOffset, description.byteOffset + description.byteLength));
    return null;
  }

  function decodedBytesEstimate(buffer) {
    return (buffer?.length || 0) * (buffer?.numberOfChannels || 1) * 4;
  }

  async function prepareFastBuffer(buffer, outRate, targetChannels, gain) {
    if (!isFastMode() || !('OfflineAudioContext' in window)) return null;
    const outFrames = Math.max(1, Math.round(buffer.duration * outRate));
    const estimated = decodedBytesEstimate(buffer) + outFrames * targetChannels * 4;
    // Keep a generous safety margin. Native rendering is dramatically faster,
    // but for giant chapters the streaming resampler is safer on memory.
    if (estimated > 220 * 1024 * 1024) return null;
    try {
      const ctx = new OfflineAudioContext(targetChannels, outFrames, outRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = gain;
      source.connect(g).connect(ctx.destination);
      source.start(0);
      return await ctx.startRendering();
    } catch (e) {
      console.warn('Fast native resampling unavailable; using streaming resampler.', e);
      return null;
    }
  }

  function copyPreparedChunk(buffer, targetChannels, start, frames) {
    const out = new Float32Array(frames * targetChannels);
    if (targetChannels === 1) {
      out.set(buffer.getChannelData(0).subarray(start, start + frames), 0);
    } else {
      out.set(buffer.getChannelData(0).subarray(start, start + frames), 0);
      const r = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);
      out.set(r.subarray(start, start + frames), frames);
    }
    return out;
  }

  function canPrefetchChapter(current, next) {
    if (!isFastMode() || !next) return false;
    // Compressed size is only a rough proxy, but this prevents overlapping two
    // obviously enormous files and keeps Fast mode from becoming a RAM trap.
    return (current.file.size + next.file.size) <= 260 * 1024 * 1024;
  }

  function safeDecodePromise(audioContext, chapter) {
    return decodeChapter(audioContext, chapter).then(buffer => ({buffer}), error => ({error}));
  }

  async function buildWithAac(choice, metadata) {
    const sampleRate = Number(choice.config.sampleRate);
    const targetChannels = Number(choice.config.numberOfChannels);
    const bitrate = Number(choice.config.bitrate);
    if (choice.changed) setBanner(`Using compatible AAC settings: ${sampleRate/1000} kHz, ${targetChannels===1?'mono':'stereo'}, ${Math.round(bitrate/1000)} kbps.`);

    const silenceSeconds = Number(els.silence.value);
    const normalize = els.normalize.checked;
    let audioContext = null;
    let encoder = null;
    let encoderError = null;
    const encodedBlocks = [];
    const sampleSizes = [];
    const durations = [];
    let blockParts = [];
    let blockBytes = 0;
    let decoderConfig = null;
    let totalPcmFrames = 0;
    const chapterMarks = [];

    const flushEncodedBlock = () => {
      if (!blockParts.length) return;
      const block = new Uint8Array(blockBytes); let o=0;
      for (const part of blockParts) { block.set(part,o); o += part.length; }
      encodedBlocks.push(block); blockParts=[]; blockBytes=0;
    };

    try {
      updateProgress(1,'Starting AAC encoder…');
      audioContext = createDecodeContext(sampleRate);
      encoder = new AudioEncoder({
        output: (chunk, meta) => {
          const bytes = new Uint8Array(chunk.byteLength); chunk.copyTo(bytes);
          blockParts.push(bytes); blockBytes += bytes.length; sampleSizes.push(bytes.length);
          if (blockBytes >= 1024*1024) flushEncodedBlock();
          const durFrames = chunk.duration ? Math.max(1, Math.round(chunk.duration * sampleRate / 1e6)) : 1024;
          durations.push(durFrames);
          if (!decoderConfig && meta?.decoderConfig?.description) decoderConfig = descriptionBytes(meta.decoderConfig.description);
        },
        error: e => { encoderError = e; }
      });
      encoder.configure({codec:'mp4a.40.2',sampleRate,numberOfChannels:targetChannels,bitrate});

      let prefetched = null;
      for (let ci=0; ci<chapters.length; ci++) {
        throwIfCancelled(); if (encoderError) throw encoderError;
        const chapter = chapters[ci];
        const pctBase = 2 + ci / chapters.length * 87;
        updateProgress(pctBase, `AAC: decoding chapter ${ci+1} of ${chapters.length}: ${chapter.name}`);
        await nextFrame();
        let buffer;
        if (prefetched) {
          const r = await prefetched; prefetched = null;
          if (r.error) throw r.error;
          buffer = r.buffer;
        } else {
          buffer = await decodeChapter(audioContext, chapter);
        }
        throwIfCancelled();
        const nextChapter = chapters[ci+1];
        if (canPrefetchChapter(chapter, nextChapter)) prefetched = safeDecodePromise(audioContext, nextChapter);

        chapterMarks.push({ time: totalPcmFrames / sampleRate, title: chapter.name.trim() });
        const gain = normalize ? calculateNormalizationGain(buffer, targetChannels) : 1;
        let prepared = await prepareFastBuffer(buffer, sampleRate, targetChannels, gain);
        const outFrames = prepared ? prepared.length : Math.max(1, Math.round(buffer.duration * sampleRate));
        const frameSize = 1024;
        let done = 0;
        while (done < outFrames) {
          throwIfCancelled(); if (encoderError) throw encoderError;
          const n = Math.min(frameSize, outFrames-done);
          const pcm = prepared ? copyPreparedChunk(prepared, targetChannels, done, n) : renderChunk(buffer, sampleRate, targetChannels, done, n, gain);
          const audioData = new AudioData({format:'f32-planar',sampleRate,numberOfFrames:n,numberOfChannels:targetChannels,timestamp:Math.round(totalPcmFrames*1e6/sampleRate),data:pcm});
          encoder.encode(audioData); audioData.close(); totalPcmFrames += n; done += n;
          if (encoder.encodeQueueSize > (isFastMode() ? 28 : 10)) await waitForQueue(encoder, isFastMode() ? 16 : 6);
          if ((done & 0x7fff)===0 || done===outFrames) {
            updateProgress(pctBase + (done/outFrames)*(87/chapters.length), `AAC: encoding chapter ${ci+1} of ${chapters.length}: ${chapter.name}`);
            await sleep(0);
          }
        }
        prepared = null; buffer = null;

        if (ci < chapters.length-1 && silenceSeconds > 0) {
          let left = Math.round(silenceSeconds*sampleRate);
          while (left > 0) {
            throwIfCancelled(); if (encoderError) throw encoderError;
            const n = Math.min(1024,left);
            const zeros = new Float32Array(n*targetChannels);
            const audioData = new AudioData({format:'f32-planar',sampleRate,numberOfFrames:n,numberOfChannels:targetChannels,timestamp:Math.round(totalPcmFrames*1e6/sampleRate),data:zeros});
            encoder.encode(audioData); audioData.close(); totalPcmFrames += n; left -= n;
            if (encoder.encodeQueueSize > 10) await waitForQueue(encoder,6);
          }
        }
      }

      updateProgress(90,'AAC: finishing encoder…');
      await withTimeout(encoder.flush(), 45000, 'The browser AAC encoder stopped responding while finishing the book.');
      if (encoderError) throw encoderError;
      encoder.close(); encoder=null; flushEncodedBlock();
      throwIfCancelled();

      if (!decoderConfig) decoderConfig = makeAacConfig(sampleRate,targetChannels);
      updateProgress(94,'AAC: writing M4B chapters and metadata…');
      const blob = window.M4BMuxer.buildM4B({
        dataBlocks:encodedBlocks, sampleSizes, durations, sampleRate, channels:targetChannels,
        config:decoderConfig, bitrate, metadata, chapters:chapterMarks, cover, codec:'aac'
      });
      updateProgress(98,'AAC: preparing download…');
      return {blob, duration:totalPcmFrames/sampleRate, codec:'aac', codecLabel:`AAC-LC ${Math.round(bitrate/1000)} kbps`};
    } finally {
      if (encoder && encoder.state !== 'closed') try { encoder.close(); } catch {}
      await closeDecodeContext(audioContext)
    }
  }

  // Built-in IMA4 encoder is provided by ima4-encoder.js.

  async function buildWithIma4(metadata) {
    const sampleRate = Number(els.sampleRate.value);
    const targetChannels = Number(els.channels.value);
    const silenceSeconds = Number(els.silence.value);
    const normalize = els.normalize.checked;
    const packetSize = 34 * targetChannels;
    const nominalBitrate = sampleRate * packetSize * 8 / 64;
    const ima = new window.Ima4Compat.StreamEncoder(targetChannels, {blockSize:1024*1024});
    const chapterMarks=[];
    let totalPcmFrames=0;
    let audioContext=null;

    try {
      setBanner(`Using built-in compatibility encoder: Apple IMA4, ${sampleRate/1000} kHz, ${targetChannels===1?'mono':'stereo'} (~${Math.round(nominalBitrate/1000)} kbps). It is larger than AAC but does not depend on the browser AAC encoder.`);
      updateProgress(2,'Compatibility mode: starting decoder…');
      audioContext=createDecodeContext(sampleRate);

      let prefetched = null;
      for(let ci=0;ci<chapters.length;ci++) {
        throwIfCancelled();
        const chapter=chapters[ci];
        const pctBase=3 + ci/chapters.length*87;
        updateProgress(pctBase,`Compatibility mode: decoding chapter ${ci+1} of ${chapters.length}: ${chapter.name}`);
        await nextFrame();
        let buffer;
        if (prefetched) {
          const r=await prefetched; prefetched=null;
          if (r.error) throw r.error;
          buffer=r.buffer;
        } else {
          buffer=await decodeChapter(audioContext,chapter);
        }
        throwIfCancelled();
        const nextChapter=chapters[ci+1];
        if (canPrefetchChapter(chapter,nextChapter)) prefetched=safeDecodePromise(audioContext,nextChapter);
        chapterMarks.push({time:totalPcmFrames/sampleRate,title:chapter.name.trim()});
        const gain=normalize?calculateNormalizationGain(buffer,targetChannels):1;
        let prepared=await prepareFastBuffer(buffer,sampleRate,targetChannels,gain);
        const outFrames=prepared?prepared.length:Math.max(1,Math.round(buffer.duration*sampleRate));
        const batch=isFastMode()?32768:8192;
        let done=0;
        while(done<outFrames) {
          throwIfCancelled();
          const n=Math.min(batch,outFrames-done);
          const pcm=prepared?copyPreparedChunk(prepared,targetChannels,done,n):renderChunk(buffer,sampleRate,targetChannels,done,n,gain);
          ima.pushPlanar(pcm,n);
          done+=n; totalPcmFrames+=n;
          if ((done & 0x7fff)===0 || done===outFrames) {
            updateProgress(pctBase+(done/outFrames)*(87/chapters.length),`Compatibility mode: encoding chapter ${ci+1} of ${chapters.length}: ${chapter.name}`);
            await sleep(0);
          }
        }
        prepared=null; buffer=null;
        if(ci<chapters.length-1 && silenceSeconds>0) {
          const gapFrames=Math.round(silenceSeconds*sampleRate);
          ima.pushSilence(gapFrames); totalPcmFrames+=gapFrames;
        }
      }

      updateProgress(91,'Compatibility mode: finishing audio…');
      const encoded=ima.finish();
      if(!encoded.sampleCount) throw new Error('No audio samples were encoded.');
      throwIfCancelled();
      updateProgress(95,'Compatibility mode: writing M4B chapters and metadata…');
      const blob=window.M4BMuxer.buildM4B({
        dataBlocks:encoded.blocks, sampleRate, channels:targetChannels, bitrate:nominalBitrate,
        metadata, chapters:chapterMarks, cover, codec:'ima4', sampleCount:encoded.sampleCount,
        constantSampleSize:packetSize, lastSampleDuration:encoded.lastDuration
      });
      updateProgress(98,'Compatibility mode: preparing download…');
      return {blob,duration:totalPcmFrames/sampleRate,codec:'ima4',codecLabel:`Apple IMA4 ${Math.round(nominalBitrate/1000)} kbps`};
    } finally {
      await closeDecodeContext(audioContext)
    }
  }

  function calculateNormalizationGain(buffer, targetChannels) {
    const frames = buffer.length;
    const srcCh = buffer.numberOfChannels;
    const maxScan = isFastMode() ? 180000 : 2000000;
    const step = Math.max(1, Math.floor(frames / maxScan));
    let sum=0, count=0, peak=0;
    const arrays = Array.from({length:srcCh},(_,i)=>buffer.getChannelData(i));
    for (let i=0;i<frames;i+=step) {
      if (targetChannels===1) {
        let v=0; const n=Math.min(srcCh,2); for(let c=0;c<n;c++) v+=arrays[c][i]; v/=n;
        sum+=v*v; peak=Math.max(peak,Math.abs(v)); count++;
      } else {
        const l=arrays[0][i], r=srcCh>1?arrays[1][i]:l;
        sum+=l*l+r*r; peak=Math.max(peak,Math.abs(l),Math.abs(r)); count+=2;
      }
    }
    const rms=Math.sqrt(sum/Math.max(1,count));
    if (!Number.isFinite(rms) || rms < 1e-7) return 1;
    const targetRms=Math.pow(10,-20/20), maxPeak=Math.pow(10,-1/20);
    let gain=targetRms/rms;
    gain=Math.min(gain,peak>0?maxPeak/peak:gain);
    return Math.max(Math.pow(10,-12/20),Math.min(Math.pow(10,12/20),gain));
  }

  function renderChunk(buffer, outRate, targetChannels, outStart, frames, gain) {
    const srcRate=buffer.sampleRate, srcCh=buffer.numberOfChannels, ratio=srcRate/outRate;
    const chans=Array.from({length:srcCh},(_,i)=>buffer.getChannelData(i));
    const out=new Float32Array(frames*targetChannels);
    for(let i=0;i<frames;i++) {
      const pos=(outStart+i)*ratio;
      const i0=Math.min(buffer.length-1,Math.floor(pos)), i1=Math.min(buffer.length-1,i0+1), f=pos-i0;
      const sample=c=>{const a=chans[Math.min(c,srcCh-1)];return(a[i0]+(a[i1]-a[i0])*f)*gain;};
      if(targetChannels===1) {
        let v=sample(0); if(srcCh>1)v=(v+sample(1))/2; out[i]=Math.max(-1,Math.min(1,v));
      } else {
        const l=sample(0),r=srcCh>1?sample(1):l; out[i]=Math.max(-1,Math.min(1,l)); out[frames+i]=Math.max(-1,Math.min(1,r));
      }
    }
    return out;
  }

  async function waitForQueue(encoder,target) {
    let guard=0;
    while(encoder.encodeQueueSize>target && guard++<400) { throwIfCancelled(); await sleep(4); }
    if (encoder.encodeQueueSize>target) throw new Error('The browser AAC encoder queue stopped draining.');
  }

  function withTimeout(promise,ms,message) {
    let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);});
    return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
  }

  function makeAacConfig(sampleRate,channels) {
    const rates=[96000,88200,64000,48000,44100,32000,24000,22050,16000,12000,11025,8000,7350];
    let idx=rates.indexOf(sampleRate); if(idx<0)idx=4;
    const bits=(2<<11)|(idx<<7)|(channels<<3);
    return Uint8Array.of((bits>>8)&255,bits&255);
  }

  window.addEventListener('beforeunload', () => {
    for (const c of chapters) URL.revokeObjectURL(c.previewUrl);
    if (cover?.url) URL.revokeObjectURL(cover.url);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  });

  refreshEngineStatus(false);
})();
