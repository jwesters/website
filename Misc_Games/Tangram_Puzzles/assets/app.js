(() => {
  'use strict';

  const puzzles = (window.TANGRAM_PUZZLES || []).slice();
  const svgNS = 'http://www.w3.org/2000/svg';
  const BOARD_W = 760;
  const BOARD_H = 600;
  const TARGET_PAD = 54;
  const MAX_TARGET_SCALE = 86;
  const FREE_SCALE = 68;
  const SNAP_DISTANCE = 34;
  const paletteIds = ['L1','L2','M','S1','S2','Q','P'];

  const pieceDefs = {
    L1: { type: 'large', name: 'Large triangle', color: '#f45454', points: [[0,0],[2,0],[0,2]] },
    L2: { type: 'large', name: 'Large triangle', color: '#ff8a18', points: [[0,0],[2,0],[0,2]] },
    M:  { type: 'medium', name: 'Medium triangle', color: '#ffd23a', points: [[0,0],[Math.SQRT2,0],[0,Math.SQRT2]] },
    S1: { type: 'small', name: 'Small triangle', color: '#35cc91', points: [[0,0],[1,0],[0,1]] },
    S2: { type: 'small', name: 'Small triangle', color: '#3aa4ee', points: [[0,0],[1,0],[0,1]] },
    Q:  { type: 'square', name: 'Square', color: '#8874e8', points: [[0,0],[1,0],[1,1],[0,1]] },
    P:  { type: 'para', name: 'Parallelogram', color: '#e56ac9', points: [[0,0],[Math.SQRT2,0],[Math.SQRT2+Math.SQRT1_2,Math.SQRT1_2],[Math.SQRT1_2,Math.SQRT1_2]] }
  };

  for (const id of paletteIds) {
    const c = polygonCentroid(pieceDefs[id].points);
    pieceDefs[id].local = pieceDefs[id].points.map(([x,y]) => [x - c.x, y - c.y]);
  }

  const els = {
    board: byId('board'), targetLayer: byId('targetLayer'), solutionLayer: byId('solutionLayer'), hintLayer: byId('hintLayer'), pieceLayer: byId('pieceLayer'),
    paletteGrid: byId('paletteGrid'), puzzleName: byId('puzzleName'), puzzleCount: byId('puzzleCount'), difficulty: byId('difficultyText'), status: byId('statusText'),
    selectionLabel: byId('selectionLabel'), rotateLeft: byId('rotateLeftBtn'), rotateRight: byId('rotateRightBtn'), flip: byId('flipBtn'), deleteBtn: byId('deleteBtn'),
    solutionBtn: byId('solutionBtn'), puzzleToolbar: byId('puzzleToolbar'), freeToolbar: byId('freeToolbar'), puzzleModeBtn: byId('puzzleModeBtn'), freeModeBtn: byId('freeModeBtn'),
    puzzleDialog: byId('puzzleDialog'), puzzleGrid: byId('puzzleGrid'), helpDialog: byId('helpDialog'), completeDialog: byId('completeDialog')
  };

  const savedIndex = safeNumber(localStorageGet('tangramPuzzleIndex'), 0);
  const state = {
    mode: 'puzzle',
    puzzleIndex: Math.max(0, Math.min(puzzles.length - 1, savedIndex)),
    pieces: new Map(),
    selectedId: null,
    drag: null,
    nextPieceId: 1,
    showSolution: false,
    hintTimer: null,
    completionShown: false,
    fit: { scale: FREE_SCALE, cx: BOARD_W / 2, cy: BOARD_H / 2 }
  };

  buildPalette();
  buildPuzzleGrid();
  bindControls();
  loadPuzzle(state.puzzleIndex);

  function byId(id) { return document.getElementById(id); }
  function localStorageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function localStorageSet(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* file:// can restrict storage */ } }
  function safeNumber(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

  function polygonCentroid(points) {
    let twiceArea = 0, x = 0, y = 0;
    for (let i = 0; i < points.length; i++) {
      const [x1,y1] = points[i], [x2,y2] = points[(i+1)%points.length];
      const f = x1*y2 - x2*y1;
      twiceArea += f; x += (x1+x2)*f; y += (y1+y2)*f;
    }
    const area6 = 3 * twiceArea;
    return { x: x / area6, y: y / area6 };
  }

  function createSvg(tag, attrs = {}) {
    const el = document.createElementNS(svgNS, tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function pointsString(points, scale = 1) {
    return points.map(([x,y]) => `${(x*scale).toFixed(3)},${(y*scale).toFixed(3)}`).join(' ');
  }

  function outlinePath(loops, scale = 1, tx = 0, ty = 0) {
    return (loops || []).map(loop => {
      if (!loop.length) return '';
      const pts = loop.map(([x,y]) => [tx + x*scale, ty + y*scale]);
      return `M ${pts.map(([x,y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join(' L ')} Z`;
    }).join(' ');
  }

  function transformPoint([x,y], tx, ty, angle, flip, scale = 1) {
    x *= scale; y *= scale;
    if (flip) x = -x;
    const r = angle * Math.PI / 180;
    return [x*Math.cos(r)-y*Math.sin(r)+tx, x*Math.sin(r)+y*Math.cos(r)+ty];
  }

  function buildPalette() {
    els.paletteGrid.innerHTML = '';
    for (const source of paletteIds) {
      const def = pieceDefs[source];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-piece';
      btn.dataset.source = source;
      btn.setAttribute('aria-label', `Add ${def.name}`);
      btn.title = `Add ${def.name}`;
      const svg = createSvg('svg', { viewBox: '-65 -55 130 110', 'aria-hidden': 'true' });
      const poly = createSvg('polygon', { points: pointsString(def.local, 44), fill: def.color });
      svg.appendChild(poly);
      btn.appendChild(svg);
      const label = document.createElement('span'); label.textContent = def.name; btn.appendChild(label);
      btn.addEventListener('pointerdown', onPalettePointerDown);
      els.paletteGrid.appendChild(btn);
    }
  }

  function bindControls() {
    byId('prevBtn').addEventListener('click', () => changePuzzle(-1));
    byId('nextBtn').addEventListener('click', () => changePuzzle(1));
    byId('randomBtn').addEventListener('click', randomPuzzle);
    byId('chooseBtn').addEventListener('click', () => els.puzzleDialog.showModal());
    byId('hintBtn').addEventListener('click', showHint);
    els.solutionBtn.addEventListener('click', toggleSolution);
    byId('resetBtn').addEventListener('click', resetBoard);
    byId('freeResetBtn').addEventListener('click', resetBoard);
    byId('helpBtn').addEventListener('click', () => els.helpDialog.showModal());
    els.puzzleModeBtn.addEventListener('click', () => setMode('puzzle'));
    els.freeModeBtn.addEventListener('click', () => setMode('free'));
    els.rotateLeft.addEventListener('click', () => rotateSelected(-45));
    els.rotateRight.addEventListener('click', () => rotateSelected(45));
    els.flip.addEventListener('click', flipSelected);
    els.deleteBtn.addEventListener('click', deleteSelected);
    byId('completeCloseBtn').addEventListener('click', () => els.completeDialog.close());
    byId('completeNextBtn').addEventListener('click', () => { els.completeDialog.close(); changePuzzle(1); });

    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => byId(btn.dataset.close).close()));

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', onGlobalPointerUp, { passive: false });
    window.addEventListener('pointercancel', onGlobalPointerUp, { passive: false });
    els.board.addEventListener('wheel', onBoardWheel, { passive: false });

    window.addEventListener('keydown', e => {
      if (document.querySelector('dialog[open]')) return;
      if (e.key.toLowerCase() === 'q') { e.preventDefault(); rotateSelected(-45); }
      if (e.key.toLowerCase() === 'e') { e.preventDefault(); rotateSelected(45); }
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); flipSelected(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) { e.preventDefault(); deleteSelected(); }
    });
  }

  function buildPuzzleGrid() {
    els.puzzleGrid.innerHTML = '';
    puzzles.forEach((puzzle, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'puzzle-card';
      btn.dataset.index = index;
      btn.innerHTML = previewSvg(puzzle) + `<span class="puzzle-card-title">${escapeHtml(puzzle.name)}</span><span class="puzzle-card-difficulty">${escapeHtml(puzzle.difficulty)}</span>`;
      btn.addEventListener('click', () => { els.puzzleDialog.close(); loadPuzzle(index); });
      els.puzzleGrid.appendChild(btn);
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function previewSvg(puzzle) {
    const bounds = rawPuzzleBounds(puzzle);
    const pad = Math.max(.4, Math.min(bounds.w, bounds.h) * .12);
    return `<svg viewBox="${bounds.minx-pad} ${bounds.miny-pad} ${bounds.w+pad*2} ${bounds.h+pad*2}" aria-hidden="true"><path class="preview-outline" d="${outlinePath(puzzle.outline)}"></path></svg>`;
  }

  function rawPuzzleBounds(puzzle) {
    const pts = [];
    for (const slot of puzzle.pieces) {
      const def = pieceDefs[slot.source];
      for (const pt of def.local) pts.push(transformPoint(pt, slot.x, slot.y, slot.a, slot.f, 1));
    }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    return { minx, maxx, miny, maxy, w: Math.max(.1,maxx-minx), h: Math.max(.1,maxy-miny) };
  }

  function computeFit(puzzle) {
    const b = rawPuzzleBounds(puzzle);
    const maxW = BOARD_W - TARGET_PAD * 2;
    const maxH = BOARD_H - TARGET_PAD * 2;
    const scale = Math.min(MAX_TARGET_SCALE, maxW / b.w, maxH / b.h);
    const centerRawX = (b.minx + b.maxx) / 2;
    const centerRawY = (b.miny + b.maxy) / 2;
    return { scale, cx: BOARD_W/2 - centerRawX*scale, cy: BOARD_H/2 - centerRawY*scale };
  }

  function slotTransform(slot) {
    return `translate(${state.fit.cx + slot.x*state.fit.scale} ${state.fit.cy + slot.y*state.fit.scale}) rotate(${slot.a}) scale(${slot.f ? -1 : 1} 1)`;
  }

  function loadPuzzle(index) {
    if (!puzzles.length) return;
    state.puzzleIndex = (index + puzzles.length) % puzzles.length;
    localStorageSet('tangramPuzzleIndex', state.puzzleIndex);
    state.fit = computeFit(puzzles[state.puzzleIndex]);
    state.completionShown = false;
    state.showSolution = false;
    els.solutionBtn.textContent = 'Show Solution';
    clearHint();
    clearBoardPieces();
    renderTarget();
    updatePuzzleMeta();
    updatePuzzleGridActive();
    setStatus('Choose a piece from the palette.');
  }

  function updatePuzzleMeta() {
    const p = puzzles[state.puzzleIndex];
    els.puzzleName.textContent = p.name;
    els.difficulty.textContent = p.difficulty;
    els.puzzleCount.textContent = `${state.puzzleIndex + 1} / ${puzzles.length}`;
  }

  function updatePuzzleGridActive() {
    els.puzzleGrid.querySelectorAll('.puzzle-card').forEach((el,i) => el.classList.toggle('active', i === state.puzzleIndex));
  }

  function renderTarget() {
    els.targetLayer.innerHTML = '';
    els.solutionLayer.innerHTML = '';
    if (state.mode !== 'puzzle') return;
    const puzzle = puzzles[state.puzzleIndex];
    const path = createSvg('path', {
      class: 'target-outline',
      d: outlinePath(puzzle.outline, state.fit.scale, state.fit.cx, state.fit.cy)
    });
    els.targetLayer.appendChild(path);
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    const isPuzzle = mode === 'puzzle';
    els.puzzleToolbar.classList.toggle('hidden', !isPuzzle);
    els.freeToolbar.classList.toggle('hidden', isPuzzle);
    els.puzzleModeBtn.classList.toggle('active', isPuzzle);
    els.freeModeBtn.classList.toggle('active', !isPuzzle);
    els.targetLayer.classList.toggle('hidden', !isPuzzle);
    els.solutionLayer.classList.add('hidden');
    els.hintLayer.classList.toggle('hidden', !isPuzzle);
    state.showSolution = false;
    els.solutionBtn.textContent = 'Show Solution';
    clearHint();
    clearBoardPieces();
    if (isPuzzle) {
      state.fit = computeFit(puzzles[state.puzzleIndex]);
      renderTarget();
      setStatus('Choose a piece from the palette.');
    } else {
      state.fit = { scale: FREE_SCALE, cx: BOARD_W/2, cy: BOARD_H/2 };
      els.targetLayer.innerHTML = '';
      setStatus('Free Build is ready. Add as many pieces as you like.');
    }
  }

  function changePuzzle(delta) {
    if (state.mode !== 'puzzle') setMode('puzzle');
    loadPuzzle(state.puzzleIndex + delta);
  }

  function randomPuzzle() {
    if (puzzles.length < 2) return;
    let n;
    do n = Math.floor(Math.random() * puzzles.length); while (n === state.puzzleIndex);
    loadPuzzle(n);
  }

  function resetBoard() {
    clearHint();
    clearBoardPieces();
    state.completionShown = false;
    if (state.mode === 'puzzle') setStatus('Choose a piece from the palette.');
    else setStatus('Free Build is ready. Add as many pieces as you like.');
  }

  function clearBoardPieces() {
    state.drag = null;
    state.selectedId = null;
    state.pieces.clear();
    els.pieceLayer.innerHTML = '';
    updateSelectionUi();
  }

  function spawnPiece(source, clientX = null, clientY = null) {
    const def = pieceDefs[source];
    const id = `piece-${state.nextPieceId++}`;
    const p = {
      id, source, type: def.type, x: BOARD_W/2, y: BOARD_H/2, angle: 0, flip: false,
      slotIndex: null, el: null, scale: state.mode === 'puzzle' ? state.fit.scale : FREE_SCALE
    };
    if (clientX !== null && clientY !== null) {
      const pt = svgPoint(clientX, clientY);
      p.x = pt.x; p.y = pt.y;
    }
    const g = createSvg('g', { class: 'piece', 'data-piece-id': id, tabindex: '0', role: 'button', 'aria-label': def.name });
    const poly = createSvg('polygon', { points: pointsString(def.local, p.scale), fill: def.color });
    g.appendChild(poly);
    p.el = g;
    state.pieces.set(id, p);
    els.pieceLayer.appendChild(g);
    g.addEventListener('pointerdown', onBoardPiecePointerDown);
    g.addEventListener('focus', () => selectPiece(id));
    updatePieceTransform(p);
    selectPiece(id);
    return p;
  }

  function onPalettePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const source = e.currentTarget.dataset.source;
    const p = spawnPiece(source, e.clientX, e.clientY);
    const pt = svgPoint(e.clientX, e.clientY);
    state.drag = { id: p.id, pointerId: e.pointerId, dx: pt.x - p.x, dy: pt.y - p.y, fromPalette: true, moved: false, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onBoardPiecePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const id = e.currentTarget.dataset.pieceId;
    const p = state.pieces.get(id);
    if (!p) return;
    selectPiece(id);
    releaseSlot(p);
    const pt = svgPoint(e.clientX, e.clientY);
    state.drag = { id, pointerId: e.pointerId, dx: pt.x - p.x, dy: pt.y - p.y, fromPalette: false, moved: false, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onGlobalPointerMove(e) {
    if (!state.drag || state.drag.pointerId !== e.pointerId) return;
    const p = state.pieces.get(state.drag.id);
    if (!p) return;
    const pt = svgPoint(e.clientX, e.clientY);
    p.x = pt.x - state.drag.dx;
    p.y = pt.y - state.drag.dy;
    if (Math.hypot(e.clientX - state.drag.startX, e.clientY - state.drag.startY) > 5) state.drag.moved = true;
    updatePieceTransform(p);
    e.preventDefault();
  }

  function onGlobalPointerUp(e) {
    if (!state.drag || state.drag.pointerId !== e.pointerId) return;
    const drag = state.drag;
    state.drag = null;
    const p = state.pieces.get(drag.id);
    if (!p) return;

    const rect = els.board.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    // A simple tap on the palette adds a new copy near the board center.
    if (drag.fromPalette && !drag.moved && !inside) {
      p.x = BOARD_W/2 + randomJitter(20);
      p.y = BOARD_H/2 + randomJitter(20);
      updatePieceTransform(p);
      setStatus(`${pieceDefs[p.source].name} added.`);
      return;
    }

    if (!inside && drag.fromPalette) {
      removePiece(p.id);
      setStatus('Drag a piece onto the board to add it.');
      return;
    }

    p.x = clamp(p.x, 8, BOARD_W-8);
    p.y = clamp(p.y, 8, BOARD_H-8);
    updatePieceTransform(p);
    if (state.mode === 'puzzle') {
      trySnap(p);
      checkCompletion();
    }
    e.preventDefault();
  }

  function randomJitter(n) { return (Math.random()*2 - 1) * n; }

  function svgPoint(clientX, clientY) {
    const pt = els.board.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const m = els.board.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: BOARD_W/2, y: BOARD_H/2 };
  }

  function selectPiece(id) {
    if (!state.pieces.has(id)) return;
    state.selectedId = id;
    for (const [pid,p] of state.pieces) p.el.classList.toggle('selected', pid === id);
    const p = state.pieces.get(id);
    els.pieceLayer.appendChild(p.el);
    updateSelectionUi();
  }

  function updateSelectionUi() {
    const p = state.selectedId ? state.pieces.get(state.selectedId) : null;
    els.selectionLabel.textContent = p ? pieceDefs[p.source].name : 'None';
    els.rotateLeft.disabled = !p;
    els.rotateRight.disabled = !p;
    els.flip.disabled = !p || p.type !== 'para';
    els.deleteBtn.disabled = !p;
  }

  function updatePieceTransform(p) {
    p.el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.angle}) scale(${p.flip ? -1 : 1} 1)`);
    p.el.classList.toggle('snapped', Number.isInteger(p.slotIndex));
  }

  function onBoardWheel(e) {
    const pieceEl = e.target.closest?.('.piece');
    if (!pieceEl && !state.selectedId) return;
    if (pieceEl) selectPiece(pieceEl.dataset.pieceId);
    e.preventDefault();
    rotateSelected(e.deltaY > 0 ? 45 : -45);
  }

  function rotateSelected(delta) {
    const p = state.selectedId ? state.pieces.get(state.selectedId) : null;
    if (!p) return;
    releaseSlot(p);
    p.angle = normalizeAngle(p.angle + delta);
    updatePieceTransform(p);
    if (state.mode === 'puzzle') { trySnap(p, true); checkCompletion(); }
  }

  function flipSelected() {
    const p = state.selectedId ? state.pieces.get(state.selectedId) : null;
    if (!p || p.type !== 'para') return;
    releaseSlot(p);
    p.flip = !p.flip;
    updatePieceTransform(p);
    if (state.mode === 'puzzle') { trySnap(p, true); checkCompletion(); }
  }

  function deleteSelected() {
    if (!state.selectedId) return;
    removePiece(state.selectedId);
    setStatus('Piece removed.');
  }

  function removePiece(id) {
    const p = state.pieces.get(id);
    if (!p) return;
    p.el.remove();
    state.pieces.delete(id);
    if (state.selectedId === id) state.selectedId = null;
    updateSelectionUi();
  }

  function releaseSlot(p) {
    if (Number.isInteger(p.slotIndex)) p.slotIndex = null;
    p.el.classList.remove('snapped');
  }

  function occupiedSlots(exceptPieceId = null) {
    const set = new Set();
    for (const [id,p] of state.pieces) {
      if (id !== exceptPieceId && Number.isInteger(p.slotIndex)) set.add(p.slotIndex);
    }
    return set;
  }

  function trySnap(p, quiet = false) {
    if (state.mode !== 'puzzle') return false;
    const puzzle = puzzles[state.puzzleIndex];
    const occupied = occupiedSlots(p.id);
    let best = null;
    puzzle.pieces.forEach((slot, index) => {
      if (occupied.has(index)) return;
      if (pieceDefs[slot.source].type !== p.type) return;
      if (!orientationMatches(p, slot)) return;
      const sx = state.fit.cx + slot.x*state.fit.scale;
      const sy = state.fit.cy + slot.y*state.fit.scale;
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d <= SNAP_DISTANCE && (!best || d < best.d)) best = { index, slot, sx, sy, d };
    });

    if (!best) {
      if (!quiet) setStatus('Piece placed.');
      return false;
    }

    p.x = best.sx; p.y = best.sy; p.angle = best.slot.a; p.flip = Boolean(best.slot.f); p.slotIndex = best.index;
    updatePieceTransform(p);
    setStatus('Piece snapped into place.');
    checkCompletion();
    return true;
  }

  function orientationMatches(p, slot) {
    if (p.type === 'para' && Boolean(p.flip) !== Boolean(slot.f)) return false;
    let symmetry = 360;
    if (p.type === 'square') symmetry = 90;
    if (p.type === 'para') symmetry = 180;
    return angleDistanceModulo(p.angle, slot.a, symmetry) < 1;
  }

  function angleDistanceModulo(a,b,period) {
    let d = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % period;
    if (d > period/2) d = period-d;
    return d;
  }

  function normalizeAngle(a) { return ((a % 360) + 360) % 360; }
  function clamp(v,min,max) { return Math.max(min, Math.min(max,v)); }

  // Completion is based on how well the player's pieces fill the silhouette,
  // not on whether they used the original seven pieces. Some puzzle outlines
  // are intentionally a few pixels looser than their stored reference layout,
  // so we first measure how well the puzzle's own reference solution fits its
  // outline and use that as the baseline. This makes alternate solutions (for
  // example, replacing two small triangles with another medium triangle) work.
  function checkCompletion() {
    if (state.mode !== 'puzzle' || state.pieces.size === 0) return;
    const puzzle = puzzles[state.puzzleIndex];
    const loops = (puzzle.outline || []).map(loop => loop.map(([x,y]) => [state.fit.cx + x*state.fit.scale, state.fit.cy + y*state.fit.scale]));

    const playerPolys = [];
    for (const p of state.pieces.values()) {
      const def = pieceDefs[p.source];
      playerPolys.push(def.local.map(pt => transformPoint(pt, p.x, p.y, p.angle, p.flip, p.scale)));
    }

    // The stored reference pieces define what "complete" looks like for this
    // particular outline. We compare the player against that achievable fit
    // rather than requiring an impossible 98%+ match to a slightly loose path.
    const referencePolys = puzzle.pieces.map(slot => {
      const def = pieceDefs[slot.source];
      const tx = state.fit.cx + slot.x * state.fit.scale;
      const ty = state.fit.cy + slot.y * state.fit.scale;
      return def.local.map(pt => transformPoint(pt, tx, ty, slot.a, Boolean(slot.f), state.fit.scale));
    });

    const allTargetPts = loops.flat();
    if (!allTargetPts.length) return;
    const minx = Math.max(0, Math.floor(Math.min(...allTargetPts.map(q => q[0])) - 16));
    const maxx = Math.min(BOARD_W, Math.ceil(Math.max(...allTargetPts.map(q => q[0])) + 16));
    const miny = Math.max(0, Math.floor(Math.min(...allTargetPts.map(q => q[1])) - 16));
    const maxy = Math.min(BOARD_H, Math.ceil(Math.max(...allTargetPts.map(q => q[1])) + 16));

    const step = 4;
    let targetCount = 0;
    let coveredTarget = 0, outsideCovered = 0;
    let referenceCoveredTarget = 0, referenceOutsideCovered = 0;

    for (let y = miny + step/2; y < maxy; y += step) {
      for (let x = minx + step/2; x < maxx; x += step) {
        const inTarget = pointInLoops(x, y, loops);
        const covered = playerPolys.some(poly => pointInPolygon(x, y, poly));
        const referenceCovered = referencePolys.some(poly => pointInPolygon(x, y, poly));

        if (inTarget) {
          targetCount++;
          if (covered) coveredTarget++;
          if (referenceCovered) referenceCoveredTarget++;
        } else {
          if (covered) outsideCovered++;
          if (referenceCovered) referenceOutsideCovered++;
        }
      }
    }

    if (!targetCount) return;

    const coverage = coveredTarget / targetCount;
    const spill = outsideCovered / targetCount;
    const referenceCoverage = referenceCoveredTarget / targetCount;
    const referenceSpill = referenceOutsideCovered / targetCount;

    // Allow a small amount of hand-placement error. A visibly missing tangram
    // piece is much larger than this margin, but a few-pixel edge mismatch is not.
    const coverageNeeded = Math.max(0.90, referenceCoverage - 0.02);
    const spillAllowed = Math.max(0.025, referenceSpill + 0.02);
    const solved = coverage >= coverageNeeded && spill <= spillAllowed;

    if (solved) {
      setStatus('Puzzle complete!');
      if (!state.completionShown) {
        state.completionShown = true;
        setTimeout(() => { if (!els.completeDialog.open) els.completeDialog.showModal(); }, 180);
      }
    } else {
      state.completionShown = false;
    }
  }

  function pointInLoops(x, y, loops) {
    let inside = false;
    for (const loop of loops) if (pointInPolygon(x, y, loop)) inside = !inside;
    return inside;
  }

  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
      if (hit) inside = !inside;
    }
    return inside;
  }

  function showHint() {
    if (state.mode !== 'puzzle') return;
    clearHint();
    const puzzle = puzzles[state.puzzleIndex];
    const occupied = occupiedSlots();
    let slotIndex = null;
    const selected = state.selectedId ? state.pieces.get(state.selectedId) : null;
    if (selected) {
      slotIndex = puzzle.pieces.findIndex((slot,i) => !occupied.has(i) && pieceDefs[slot.source].type === selected.type);
    }
    if (slotIndex === -1 || slotIndex === null) slotIndex = puzzle.pieces.findIndex((slot,i) => !occupied.has(i));
    if (slotIndex < 0) return;
    const slot = puzzle.pieces[slotIndex];
    const poly = createSvg('polygon', {
      class: 'hint-piece',
      points: pointsString(pieceDefs[slot.source].local, state.fit.scale),
      transform: slotTransform(slot)
    });
    els.hintLayer.appendChild(poly);
    setStatus('Hint: one piece location is highlighted.');
    state.hintTimer = setTimeout(clearHint, 1800);
  }

  function clearHint() {
    if (state.hintTimer) clearTimeout(state.hintTimer);
    state.hintTimer = null;
    els.hintLayer.innerHTML = '';
  }

  function toggleSolution() {
    if (state.mode !== 'puzzle') return;
    state.showSolution = !state.showSolution;
    els.solutionBtn.textContent = state.showSolution ? 'Hide Solution' : 'Show Solution';
    els.solutionLayer.innerHTML = '';
    els.solutionLayer.classList.toggle('hidden', !state.showSolution);
    if (state.showSolution) {
      const puzzle = puzzles[state.puzzleIndex];
      puzzle.pieces.forEach(slot => {
        const poly = createSvg('polygon', {
          class: 'solution-piece', fill: pieceDefs[slot.source].color,
          points: pointsString(pieceDefs[slot.source].local, state.fit.scale),
          transform: slotTransform(slot)
        });
        els.solutionLayer.appendChild(poly);
      });
      setStatus('Solution is visible.');
    } else {
      setStatus('Solution hidden.');
    }
  }

  function setStatus(text) { els.status.textContent = text; }
})();
