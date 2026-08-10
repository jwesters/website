const MAX_DIMENSION = 2200;
const OCR_TARGET_PANEL_WIDTH = 1500;

const fileInput = document.getElementById('fileInput');
const fileMeta = document.getElementById('fileMeta');
const detectBtn = document.getElementById('detectBtn');
const clearBoxesBtn = document.getElementById('clearBoxesBtn');
const cleanBtn = document.getElementById('cleanBtn');
const recleanBtn = document.getElementById('recleanBtn');
const cancelBtn = document.getElementById('cancelBtn');
const resetMaskBtn = document.getElementById('resetMaskBtn');
const downloadBtn = document.getElementById('downloadBtn');
const paintToolBtn = document.getElementById('paintToolBtn');
const eraseToolBtn = document.getElementById('eraseToolBtn');
const showOriginalBtn = document.getElementById('showOriginalBtn');
const showCleanedBtn = document.getElementById('showCleanedBtn');
const confidenceSlider = document.getElementById('confidenceSlider');
const confidenceValue = document.getElementById('confidenceValue');
const paddingSlider = document.getElementById('paddingSlider');
const paddingValue = document.getElementById('paddingValue');
const brushSlider = document.getElementById('brushSlider');
const brushValue = document.getElementById('brushValue');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const canvasWrap = document.getElementById('canvasWrap');
const emptyState = document.getElementById('emptyState');
const imageCanvas = document.getElementById('imageCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');

const imageCtx = imageCanvas.getContext('2d');
const overlayCtx = overlayCanvas.getContext('2d');

let originalCanvas = null;
let cleanedCanvas = null;
let maskCanvas = null;
let detectedWords = [];
let detectedPanels = [];
let panelDividers = [];
let displayMode = 'original';
let drawMode = 'paint';
let isDrawing = false;
let isProcessing = false;
let cancelRequested = false;
let lastPoint = null;

function setStatus(text) { statusEl.textContent = text; }
function setProgress(text = '') { progressEl.textContent = text; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function luminance(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function makeOffscreen(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getScaledSize(width, height, maxDimension = MAX_DIMENSION) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
}

function setCanvasSize(width, height) {
  [imageCanvas, overlayCanvas].forEach(canvas => {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });
}

function setWorkspaceEnabled(hasImage) {
  const disabled = !hasImage || isProcessing;
  detectBtn.disabled = disabled;
  clearBoxesBtn.disabled = disabled;
  paintToolBtn.disabled = disabled;
  eraseToolBtn.disabled = disabled;
  cleanBtn.disabled = disabled;
  recleanBtn.disabled = disabled;
  resetMaskBtn.disabled = disabled;
  confidenceSlider.disabled = disabled;
  paddingSlider.disabled = disabled;
  brushSlider.disabled = disabled;
  fileInput.disabled = isProcessing;
  cancelBtn.disabled = !isProcessing;
  showOriginalBtn.disabled = !hasImage;
  showCleanedBtn.disabled = !cleanedCanvas || isProcessing;
  downloadBtn.disabled = !cleanedCanvas || isProcessing;
}

function setProcessingState(value) {
  isProcessing = value;
  setWorkspaceEnabled(Boolean(originalCanvas));
}

function resetProjectState() {
  originalCanvas = null;
  cleanedCanvas = null;
  maskCanvas = null;
  detectedWords = [];
  detectedPanels = [];
  panelDividers = [];
  displayMode = 'original';
  drawMode = 'paint';
  isDrawing = false;
  isProcessing = false;
  cancelRequested = false;
  lastPoint = null;

  imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  canvasWrap.classList.add('empty');
  canvasWrap.classList.remove('ready');
  overlayCanvas.classList.remove('drawing');
  emptyState.style.display = 'block';
  fileMeta.textContent = 'Supports JPG, PNG, and WebP. One image at a time.';
  showOriginalBtn.classList.add('active');
  showCleanedBtn.classList.remove('active');
  setWorkspaceEnabled(false);
}

function enableWorkspace() {
  canvasWrap.classList.remove('empty');
  canvasWrap.classList.add('ready');
  emptyState.style.display = 'none';
  setWorkspaceEnabled(true);
  syncToolUI();
}

function renderImageCanvas() {
  if (!originalCanvas) return;
  const source = displayMode === 'cleaned' && cleanedCanvas ? cleanedCanvas : originalCanvas;
  imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  imageCtx.drawImage(source, 0, 0);
}

function renderOverlay() {
  if (!maskCanvas) return;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  overlayCtx.save();
  overlayCtx.globalAlpha = 0.48;
  overlayCtx.drawImage(maskCanvas, 0, 0);
  overlayCtx.restore();
}

function syncToolUI() {
  paintToolBtn.classList.toggle('active', drawMode === 'paint');
  eraseToolBtn.classList.toggle('active', drawMode === 'erase');
  showOriginalBtn.classList.toggle('active', displayMode === 'original');
  showCleanedBtn.classList.toggle('active', displayMode === 'cleaned');
  if (originalCanvas) overlayCanvas.classList.add('drawing');
}

function eventPoint(evt) {
  const rect = overlayCanvas.getBoundingClientRect();
  const touch = evt.touches?.[0] || evt.changedTouches?.[0];
  const clientX = touch ? touch.clientX : evt.clientX;
  const clientY = touch ? touch.clientY : evt.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * overlayCanvas.width,
    y: ((clientY - rect.top) / rect.height) * overlayCanvas.height,
  };
}

function drawLineOnMask(from, to, mode) {
  if (!maskCanvas) return;
  const ctx = maskCanvas.getContext('2d');
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Number(brushSlider.value);
  if (mode === 'paint') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ff0000';
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  }
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
  renderOverlay();
}

function beginDraw(evt) {
  if (!maskCanvas || !originalCanvas || isProcessing) return;
  evt.preventDefault();
  isDrawing = true;
  const pt = eventPoint(evt);
  lastPoint = pt;
  drawLineOnMask(pt, pt, drawMode);
}

function moveDraw(evt) {
  if (!isDrawing || !lastPoint || isProcessing) return;
  evt.preventDefault();
  const pt = eventPoint(evt);
  drawLineOnMask(lastPoint, pt, drawMode);
  lastPoint = pt;
}

function endDraw(evt) {
  if (evt) evt.preventDefault();
  isDrawing = false;
  lastPoint = null;
}

function groupColumns(columns) {
  if (!columns.length) return [];
  const groups = [];
  let start = columns[0];
  let end = columns[0];
  for (let i = 1; i < columns.length; i++) {
    if (columns[i] <= end + 2) {
      end = columns[i];
    } else {
      groups.push({ start, end, center: Math.round((start + end) / 2) });
      start = end = columns[i];
    }
  }
  groups.push({ start, end, center: Math.round((start + end) / 2) });
  return groups;
}

function detectComicPanels() {
  if (!originalCanvas) return { panels: [], dividers: [] };
  const { width, height } = originalCanvas;
  const data = originalCanvas.getContext('2d').getImageData(0, 0, width, height).data;
  const candidates = [];

  for (let x = 0; x < width; x++) {
    let dark = 0;
    for (let y = 0; y < height; y++) {
      const p = (y * width + x) * 4;
      if (luminance(data[p], data[p + 1], data[p + 2]) < 90) dark++;
    }
    if (dark / height >= 0.45) candidates.push(x);
  }

  const groups = groupColumns(candidates).filter(g => g.end - g.start <= Math.max(8, width * 0.018));
  let boundaries = groups.map(g => g.center).filter(x => x > width * 0.005 && x < width * 0.995);

  if (boundaries.length >= 2) {
    if (boundaries[0] > width * 0.06) boundaries.unshift(0);
    if (boundaries[boundaries.length - 1] < width * 0.94) boundaries.push(width - 1);
  } else {
    boundaries = [0, width - 1];
  }

  const panels = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const x0 = boundaries[i];
    const x1 = boundaries[i + 1];
    const panelWidth = x1 - x0;
    if (panelWidth < Math.max(70, width * 0.12)) continue;
    const inset = Math.min(4, Math.floor(panelWidth * 0.01));
    panels.push({
      x: clamp(x0 + inset, 0, width - 1),
      y: 0,
      w: clamp(panelWidth - inset * 2, 1, width),
      h: height,
    });
  }

  if (!panels.length) panels.push({ x: 0, y: 0, w: width, h: height });
  return { panels, dividers: boundaries.slice(1, -1) };
}

function computeOtsuThreshold(grayValues) {
  const histogram = new Uint32Array(256);
  for (const v of grayValues) histogram[v]++;
  const total = grayValues.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 165;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * Math.pow(mB - mF, 2);
    if (between > maxVariance) {
      maxVariance = between;
      threshold = t;
    }
  }
  return clamp(threshold, 115, 210);
}

function makeOcrPanelCanvas(panel, mode) {
  const scale = clamp(OCR_TARGET_PANEL_WIDTH / panel.w, 1.7, 3.4);
  const width = Math.max(1, Math.round(panel.w * scale));
  const height = Math.max(1, Math.round(panel.h * scale));
  const canvas = makeOffscreen(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(originalCanvas, panel.x, panel.y, panel.w, panel.h, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const grays = new Uint8Array(width * height);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    grays[p] = Math.round(luminance(pixels[i], pixels[i + 1], pixels[i + 2]));
  }

  const threshold = mode === 'binary' ? computeOtsuThreshold(grays) : 0;
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    let v = grays[p];
    if (mode === 'contrast') {
      v = clamp(Math.round((v - 128) * 1.65 + 128), 0, 255);
    } else if (mode === 'binary') {
      v = v < threshold ? 0 : 255;
    }
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
    pixels[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return { canvas, scale };
}

function boxIoU(a, b) {
  const x0 = Math.max(a.x0, b.x0);
  const y0 = Math.max(a.y0, b.y0);
  const x1 = Math.min(a.x1, b.x1);
  const y1 = Math.min(a.y1, b.y1);
  if (x1 <= x0 || y1 <= y0) return 0;
  const intersection = (x1 - x0) * (y1 - y0);
  const areaA = (a.x1 - a.x0) * (a.y1 - a.y0);
  const areaB = (b.x1 - b.x0) * (b.y1 - b.y0);
  return intersection / Math.max(1, areaA + areaB - intersection);
}

function dedupeWords(words) {
  const sorted = words.slice().sort((a, b) => b.confidence - a.confidence);
  const kept = [];
  for (const word of sorted) {
    const duplicateIndex = kept.findIndex(existing => boxIoU(existing, word) > 0.42);
    if (duplicateIndex === -1) {
      kept.push(word);
    } else {
      const existing = kept[duplicateIndex];
      existing.x0 = Math.min(existing.x0, word.x0);
      existing.y0 = Math.min(existing.y0, word.y0);
      existing.x1 = Math.max(existing.x1, word.x1);
      existing.y1 = Math.max(existing.y1, word.y1);
      existing.confidence = Math.max(existing.confidence, word.confidence);
      if ((word.text || '').length > (existing.text || '').length) existing.text = word.text;
    }
  }
  return kept.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
}

function isProtectedCredit(word) {
  if (!originalCanvas) return false;
  const W = originalCanvas.width;
  const H = originalCanvas.height;
  const w = word.x1 - word.x0;
  const h = word.y1 - word.y0;
  const cx = (word.x0 + word.x1) / 2;

  // Typical newspaper signature/date strip along the bottom edge.
  if (word.y0 > H * 0.83 && h < H * 0.085) return true;

  // Narrow rotated copyright text next to a panel divider.
  const dividerDistance = panelDividers.length
    ? Math.min(...panelDividers.map(x => Math.abs(cx - x)))
    : Infinity;
  if (dividerDistance < Math.max(18, W * 0.024)) {
    if (h > w * 1.25) return true;
    if (w < W * 0.045 && h < H * 0.22) return true;
  }

  return false;
}

function estimateBackground(imageData, box, ring = 7) {
  const W = imageData.width;
  const H = imageData.height;
  const x0 = clamp(Math.floor(box.x0 - ring), 0, W - 1);
  const y0 = clamp(Math.floor(box.y0 - ring), 0, H - 1);
  const x1 = clamp(Math.ceil(box.x1 + ring), 0, W - 1);
  const y1 = clamp(Math.ceil(box.y1 + ring), 0, H - 1);
  const samples = [];

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nearOuter = x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1;
      if (!nearOuter) continue;
      const p = (y * W + x) * 4;
      const r = imageData.data[p];
      const g = imageData.data[p + 1];
      const b = imageData.data[p + 2];
      const lum = luminance(r, g, b);
      samples.push({ r, g, b, lum });
    }
  }

  if (!samples.length) return { r: 245, g: 245, b: 245, lum: 245 };
  samples.sort((a, b) => b.lum - a.lum);
  const bright = samples.slice(0, Math.max(8, Math.floor(samples.length * 0.55)));
  let r = 0, g = 0, b = 0, lum = 0;
  for (const s of bright) {
    r += s.r; g += s.g; b += s.b; lum += s.lum;
  }
  const n = bright.length;
  return { r: r / n, g: g / n, b: b / n, lum: lum / n };
}

function dilateBinaryMask(binary, width, height, radius) {
  let current = binary;
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(current);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (current[idx]) continue;
        let found = false;
        for (let oy = -1; oy <= 1 && !found; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = x + ox;
            const ny = y + oy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (current[ny * width + nx]) { found = true; break; }
          }
        }
        if (found) next[idx] = 1;
      }
    }
    current = next;
  }
  return current;
}

function paintPreciseTextMask(words) {
  if (!maskCanvas || !originalCanvas) return;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  const source = originalCanvas.getContext('2d').getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  const W = source.width;
  const H = source.height;
  const binary = new Uint8Array(W * H);

  for (const word of words) {
    const bg = estimateBackground(source, word, 8);
    const x0 = clamp(Math.floor(word.x0 - 1), 0, W - 1);
    const y0 = clamp(Math.floor(word.y0 - 1), 0, H - 1);
    const x1 = clamp(Math.ceil(word.x1 + 1), 0, W - 1);
    const y1 = clamp(Math.ceil(word.y1 + 1), 0, H - 1);
    const darkThreshold = clamp(bg.lum - 26, 72, 190);
    let marked = 0;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const p = (y * W + x) * 4;
        const lum = luminance(source.data[p], source.data[p + 1], source.data[p + 2]);
        if (lum < darkThreshold || (bg.lum > 205 && lum < 175)) {
          binary[y * W + x] = 1;
          marked++;
        }
      }
    }

    // Very thin/low-contrast lettering fallback: accept darker pixels within the OCR box.
    const boxArea = Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1));
    if (marked < Math.max(3, boxArea * 0.025)) {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const p = (y * W + x) * 4;
          const lum = luminance(source.data[p], source.data[p + 1], source.data[p + 2]);
          if (lum < Math.min(185, bg.lum - 12)) binary[y * W + x] = 1;
        }
      }
    }
  }

  const dilation = clamp(Math.round(Number(paddingSlider.value) / 5), 1, 6);
  const expanded = dilateBinaryMask(binary, W, H, dilation);
  const output = maskCtx.createImageData(W, H);
  for (let i = 0; i < expanded.length; i++) {
    if (!expanded[i]) continue;
    const p = i * 4;
    output.data[p] = 255;
    output.data[p + 1] = 0;
    output.data[p + 2] = 0;
    output.data[p + 3] = 255;
  }
  maskCtx.putImageData(output, 0, 0);
  renderOverlay();
}

async function detectText() {
  if (!originalCanvas) return;
  setProcessingState(true);
  setStatus('Looking for comic panels...');
  setProgress('Preparing enhanced OCR passes...');
  await nextFrame();

  let worker = null;
  try {
    const panelResult = detectComicPanels();
    detectedPanels = panelResult.panels;
    panelDividers = panelResult.dividers;
    const totalPasses = detectedPanels.length * 2;
    let completedPasses = 0;
    const allWords = [];
    const minConfidence = Number(confidenceSlider.value);

    worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const localPct = Math.round((m.progress || 0) * 100);
          setProgress(`OCR pass ${Math.min(completedPasses + 1, totalPasses)} of ${totalPasses} · ${localPct}%`);
        }
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: String(Tesseract.PSM.SPARSE_TEXT),
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });

    for (let panelIndex = 0; panelIndex < detectedPanels.length; panelIndex++) {
      const panel = detectedPanels[panelIndex];
      for (const mode of ['contrast', 'binary']) {
        setStatus(`Scanning panel ${panelIndex + 1} of ${detectedPanels.length} (${mode === 'contrast' ? 'enhanced' : 'black & white'} pass)...`);
        await nextFrame();
        const prepared = makeOcrPanelCanvas(panel, mode);
        const { data } = await worker.recognize(prepared.canvas);

        for (const word of data.words || []) {
          const text = (word.text || '').trim();
          const confidence = Number(word.confidence ?? 0);
          if (!text || confidence < minConfidence || !word.bbox) continue;
          const mapped = {
            x0: panel.x + word.bbox.x0 / prepared.scale,
            y0: panel.y + word.bbox.y0 / prepared.scale,
            x1: panel.x + word.bbox.x1 / prepared.scale,
            y1: panel.y + word.bbox.y1 / prepared.scale,
            confidence,
            text,
          };
          const w = mapped.x1 - mapped.x0;
          const h = mapped.y1 - mapped.y0;
          if (w < 2 || h < 2) continue;
          if (isProtectedCredit(mapped)) continue;
          allWords.push(mapped);
        }
        completedPasses++;
      }
    }

    detectedWords = dedupeWords(allWords);
    paintPreciseTextMask(detectedWords);

    setStatus(`Detection complete. Scanned ${detectedPanels.length} panel${detectedPanels.length === 1 ? '' : 's'} twice and kept ${detectedWords.length} dialogue/caption word regions.`);
    setProgress('Red should now hug the lettering more closely. Add mask manually if anything is still missed.');
  } catch (error) {
    console.error(error);
    setStatus('Could not complete text detection.');
    setProgress(error.message || 'OCR failed.');
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    setProcessingState(false);
  }
}

function hasVisibleMask() {
  if (!maskCanvas) return false;
  const data = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
  return false;
}

function getMaskRegions(maskAlpha, width, height) {
  const visited = new Uint8Array(width * height);
  const regions = [];
  const queue = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || !maskAlpha[idx]) continue;
      visited[idx] = 1;
      queue.length = 0;
      queue.push(idx);
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;

      while (queue.length) {
        const current = queue.pop();
        const cx = current % width;
        const cy = (current - cx) / width;
        area++;
        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);

        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            const nx = cx + ox, ny = cy + oy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const n = ny * width + nx;
            if (visited[n] || !maskAlpha[n]) continue;
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
      if (area >= 3) regions.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
    }
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}

function collectRegionContextColors(src, localMask, width, height) {
  const samples = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (localMask[idx]) continue;
      const neighbor =
        (x > 0 && localMask[idx - 1]) || (x < width - 1 && localMask[idx + 1]) ||
        (y > 0 && localMask[idx - width]) || (y < height - 1 && localMask[idx + width]);
      if (!neighbor) continue;
      const p = idx * 4;
      const r = src[p], g = src[p + 1], b = src[p + 2];
      samples.push({ r, g, b, lum: luminance(r, g, b) });
    }
  }

  if (!samples.length) return { bgColor: [245, 245, 245], bgLum: 245, variance: 0 };
  samples.sort((a, b) => b.lum - a.lum);
  const chosen = samples.slice(0, Math.max(6, Math.floor(samples.length * 0.6)));
  let r = 0, g = 0, b = 0, lum = 0;
  for (const s of chosen) { r += s.r; g += s.g; b += s.b; lum += s.lum; }
  r /= chosen.length; g /= chosen.length; b /= chosen.length; lum /= chosen.length;
  let variance = 0;
  for (const s of chosen) variance += Math.pow(s.lum - lum, 2);
  variance /= chosen.length;
  return { bgColor: [r, g, b], bgLum: lum, variance };
}

function sampleNearestColors(data, localMask, width, height, x, y, maxRadius = 12) {
  const found = [];
  for (let radius = 1; radius <= maxRadius; radius++) {
    const candidates = [
      [x - radius, y], [x + radius, y], [x, y - radius], [x, y + radius],
      [x - radius, y - radius], [x + radius, y - radius],
      [x - radius, y + radius], [x + radius, y + radius]
    ];
    for (const [sx, sy] of candidates) {
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      if (localMask[sy * width + sx]) continue;
      const p = (sy * width + sx) * 4;
      found.push([data[p], data[p + 1], data[p + 2]]);
    }
    if (found.length >= 5) break;
  }
  if (!found.length) return null;
  const avg = [0, 0, 0];
  for (const c of found) { avg[0] += c[0]; avg[1] += c[1]; avg[2] += c[2]; }
  return avg.map(v => v / found.length);
}

function cleanRegion(baseImageData, maskImageData, region) {
  const margin = Math.max(7, Math.min(24, Math.round(Math.max(region.w, region.h) * 0.35)));
  const rx = clamp(region.x - margin, 0, baseImageData.width - 1);
  const ry = clamp(region.y - margin, 0, baseImageData.height - 1);
  const rw = Math.min(baseImageData.width - rx, region.w + margin * 2);
  const rh = Math.min(baseImageData.height - ry, region.h + margin * 2);
  const srcRegion = new Uint8ClampedArray(rw * rh * 4);
  const localMask = new Uint8Array(rw * rh);

  for (let y = 0; y < rh; y++) {
    const globalOffset = ((ry + y) * baseImageData.width + rx) * 4;
    srcRegion.set(baseImageData.data.subarray(globalOffset, globalOffset + rw * 4), y * rw * 4);
    for (let x = 0; x < rw; x++) {
      const globalPixel = (ry + y) * baseImageData.width + (rx + x);
      localMask[y * rw + x] = maskImageData.data[globalPixel * 4 + 3] > 0 ? 1 : 0;
    }
  }

  const { bgColor, bgLum, variance } = collectRegionContextColors(srcRegion, localMask, rw, rh);
  const bubbleMode = bgLum > 168 && variance < 1150;
  const out = new Uint8ClampedArray(srcRegion);

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = y * rw + x;
      if (!localMask[idx]) continue;
      const p = idx * 4;
      if (bubbleMode) {
        out[p] = Math.round(bgColor[0]);
        out[p + 1] = Math.round(bgColor[1]);
        out[p + 2] = Math.round(bgColor[2]);
      } else {
        const patch = sampleNearestColors(srcRegion, localMask, rw, rh, x, y, 14) || bgColor;
        out[p] = Math.round(patch[0]);
        out[p + 1] = Math.round(patch[1]);
        out[p + 2] = Math.round(patch[2]);
      }
      out[p + 3] = 255;
    }
  }

  return { rx, ry, rw, rh, data: out };
}

async function cleanImage() {
  if (!originalCanvas || !maskCanvas) return;
  if (!hasVisibleMask()) {
    setStatus('There is no mask to clean yet.');
    setProgress('Run Auto Detect Text or paint over missed lettering first.');
    return;
  }

  cancelRequested = false;
  setProcessingState(true);
  setStatus('Preparing text removal...');
  setProgress('Splitting the red lettering mask into small regions...');
  await nextFrame();

  try {
    // Always rebuild from the untouched original so repeated cleaning does not accumulate artifacts.
    const baseImageData = originalCanvas.getContext('2d').getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const maskImageData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskAlpha = new Uint8Array(maskCanvas.width * maskCanvas.height);
    for (let i = 0, p = 3; i < maskAlpha.length; i++, p += 4) maskAlpha[i] = maskImageData.data[p] > 0 ? 1 : 0;
    const regions = getMaskRegions(maskAlpha, maskCanvas.width, maskCanvas.height);

    if (!regions.length) {
      setStatus('No masked lettering was found.');
      setProgress('Try detecting again or add mask manually.');
      return;
    }

    const resultImageData = new ImageData(new Uint8ClampedArray(baseImageData.data), baseImageData.width, baseImageData.height);
    let processed = 0;

    for (let i = 0; i < regions.length; i++) {
      if (cancelRequested) break;
      const region = regions[i];
      setStatus(`Cleaning text region ${i + 1} of ${regions.length}...`);
      setProgress(`${Math.round((i / regions.length) * 100)}% complete`);
      if (i % 8 === 0) await nextFrame();

      const patch = cleanRegion(resultImageData, maskImageData, region);
      for (let y = 0; y < patch.rh; y++) {
        const globalOffset = ((patch.ry + y) * resultImageData.width + patch.rx) * 4;
        const localOffset = y * patch.rw * 4;
        resultImageData.data.set(patch.data.subarray(localOffset, localOffset + patch.rw * 4), globalOffset);
      }
      processed++;
    }

    const resultCanvas = makeOffscreen(originalCanvas.width, originalCanvas.height);
    resultCanvas.getContext('2d').putImageData(resultImageData, 0, 0);
    cleanedCanvas = resultCanvas;
    displayMode = 'cleaned';
    renderImageCanvas();
    renderOverlay();
    syncToolUI();

    if (cancelRequested) {
      setStatus(`Cleaning cancelled after ${processed} of ${regions.length} regions.`);
      setProgress('A partial result is shown.');
    } else {
      setStatus(`Finished cleaning ${processed} lettering regions.`);
      setProgress('Done. Check the Cleaned view; adjust the mask and use Clean Again if needed.');
    }
  } catch (error) {
    console.error(error);
    setStatus('Could not remove the text.');
    setProgress(error.message || 'Canvas cleaning failed.');
  } finally {
    setProcessingState(false);
  }
}

function resetMaskToDetected() {
  if (!maskCanvas) return;
  if (detectedWords.length) {
    paintPreciseTextMask(detectedWords);
    setStatus('Mask reset to the last automatic dialogue detection.');
    setProgress('Ready to clean.');
  } else {
    maskCanvas.getContext('2d').clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderOverlay();
    setStatus('Mask cleared.');
    setProgress('Run Auto Detect Text or paint a mask manually.');
  }
}

function clearAutoDetection() {
  detectedWords = [];
  if (maskCanvas) {
    maskCanvas.getContext('2d').clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderOverlay();
  }
  setStatus('Automatic detection cleared.');
  setProgress('The mask is empty.');
}

async function loadSelectedFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setStatus('Unsupported file type. Please choose a JPG, PNG, or WebP image.');
    return;
  }

  resetProjectState();
  setStatus('Loading image...');
  setProgress('Preparing workspace...');

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height, scale } = getScaledSize(bitmap.width, bitmap.height);
    originalCanvas = makeOffscreen(width, height);
    originalCanvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    maskCanvas = makeOffscreen(width, height);
    cleanedCanvas = null;

    setCanvasSize(width, height);
    renderImageCanvas();
    renderOverlay();
    enableWorkspace();

    const initialPanels = detectComicPanels();
    detectedPanels = initialPanels.panels;
    panelDividers = initialPanels.dividers;
    fileMeta.textContent = `Loaded: ${file.name} · ${bitmap.width}×${bitmap.height}px${scale < 1 ? ` · working at ${width}×${height}px` : ''} · ${detectedPanels.length} likely panel${detectedPanels.length === 1 ? '' : 's'}`;
    setStatus('Image loaded. Click Auto Detect Text.');
    setProgress('The detector will upscale and scan each panel twice.');
  } catch (error) {
    console.error(error);
    setStatus('Could not load that image.');
    setProgress(error.message || 'Image load failed.');
  }
}

function downloadCleaned() {
  if (!cleanedCanvas) return;
  const link = document.createElement('a');
  const base = fileInput.files?.[0]?.name?.replace(/\.[^.]+$/, '') || 'comic';
  link.download = `${base}-text-removed.png`;
  link.href = cleanedCanvas.toDataURL('image/png');
  link.click();
}

fileInput.addEventListener('change', () => loadSelectedFile(fileInput.files?.[0]));
detectBtn.addEventListener('click', detectText);
cleanBtn.addEventListener('click', cleanImage);
recleanBtn.addEventListener('click', cleanImage);
cancelBtn.addEventListener('click', () => {
  cancelRequested = true;
  setStatus('Cancelling after the current text region...');
  setProgress('Please wait a moment.');
});
resetMaskBtn.addEventListener('click', resetMaskToDetected);
clearBoxesBtn.addEventListener('click', clearAutoDetection);
downloadBtn.addEventListener('click', downloadCleaned);

paintToolBtn.addEventListener('click', () => { drawMode = 'paint'; syncToolUI(); });
eraseToolBtn.addEventListener('click', () => { drawMode = 'erase'; syncToolUI(); });
showOriginalBtn.addEventListener('click', () => { displayMode = 'original'; renderImageCanvas(); syncToolUI(); });
showCleanedBtn.addEventListener('click', () => {
  if (!cleanedCanvas) return;
  displayMode = 'cleaned';
  renderImageCanvas();
  syncToolUI();
});

confidenceSlider.addEventListener('input', () => { confidenceValue.textContent = confidenceSlider.value; });
paddingSlider.addEventListener('input', () => {
  paddingValue.textContent = paddingSlider.value;
  if (detectedWords.length && !isProcessing) paintPreciseTextMask(detectedWords);
});
brushSlider.addEventListener('input', () => { brushValue.textContent = brushSlider.value; });

['mousedown', 'touchstart'].forEach(name => overlayCanvas.addEventListener(name, beginDraw, { passive: false }));
['mousemove', 'touchmove'].forEach(name => overlayCanvas.addEventListener(name, moveDraw, { passive: false }));
['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(name => overlayCanvas.addEventListener(name, endDraw, { passive: false }));

resetProjectState();
confidenceValue.textContent = confidenceSlider.value;
paddingValue.textContent = paddingSlider.value;
brushValue.textContent = brushSlider.value;
