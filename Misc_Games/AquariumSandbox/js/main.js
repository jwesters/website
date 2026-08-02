(function () {
  'use strict';

  const QUICK_SAVE_KEY = 'aquariumSandboxQuickSaveV4';
  const AUTO_SAVE_KEY = 'aquariumSandboxAutoSaveV4';
  const OVERLAY_KEY = 'aquariumSandboxOverlayHiddenV4';

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function start() {
    const A = window.Aquarium;
    if (!A || !A.AquariumEngine || !A.CreatureSystem) {
      document.getElementById('errorBanner').hidden = false;
      return;
    }

    const canvas = document.getElementById('tank');
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent || '');
    const mobileMode = mobileUserAgent || (coarsePointer && Math.min(window.screen.width, window.screen.height) < 1100);
    document.body.classList.toggle('mobile-mode', mobileMode);
    document.body.dataset.deviceMode = mobileMode ? 'mobile' : 'desktop';
    if (mobileMode) {
      canvas.width = 900;
      canvas.height = 540;
    } else {
      canvas.width = 1200;
      canvas.height = 720;
    }
    const engine = new A.AquariumEngine(canvas);
    const creatures = new A.CreatureSystem(canvas.width, canvas.height, engine.cell, engine.grid, engine.cols, engine.rows);

    const materialTools = document.getElementById('materialTools');
    const plantTools = document.getElementById('plantTools');
    const creatureTools = document.getElementById('creatureTools');
    const decorationTools = document.getElementById('decorationTools');
    const forceTools = document.getElementById('forceTools');

    const status = document.getElementById('statusPill');
    const countEl = document.getElementById('particleCount');
    const creatureEl = document.getElementById('creatureCount');
    const fpsEl = document.getElementById('fps');

    const brush = document.getElementById('brushSize');
    const speed = document.getElementById('speed');
    const light = document.getElementById('light');

    const pauseBtn = document.getElementById('pauseBtn');
    const helpBtn = document.getElementById('helpBtn');
    const optionsBtn = document.getElementById('optionsBtn');
    const zenBtn = document.getElementById('zenBtn');
    const undoBtn = document.getElementById('undoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exitZenBtn = document.getElementById('exitZenBtn');

    const rotateOverlay = document.getElementById('rotateOverlay');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const helpOverlay = document.getElementById('helpOverlay');
    const optionsOverlay = document.getElementById('optionsOverlay');
    const inspectOverlay = document.getElementById('inspectOverlay');

    const resumeOverlayBtn = document.getElementById('resumeOverlayBtn');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const closeOptionsBtn = document.getElementById('closeOptionsBtn');
    const closeInspectBtn = document.getElementById('closeInspectBtn');
    const inspectContent = document.getElementById('inspectContent');
    const autosaveStatus = document.getElementById('autosaveStatus');

    const quickSaveBtn = document.getElementById('quickSaveBtn');
    const quickLoadBtn = document.getElementById('quickLoadBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
    const togglePeacefulBtn = document.getElementById('togglePeacefulBtn');

    let selected = { kind: 'material', id: A.WATER, label: 'Water' };
    const pointer = { down: false, x: 0, y: 0 };
    let lastPos = null;
    let frames = 0;
    let lastFpsAt = performance.now();
    let lastFrameAt = performance.now();
    let accumulator = 0;
    const FIXED_DT = 1 / 30;
    const MAX_SUBSTEPS = 3;
    let lastCreatureStamp = 0;
    let overlayHidden = localStorage.getItem(OVERLAY_KEY) === '1';
    let manualPaused = false;
    let orientationPaused = false;
    let grabbed = null;
    let netHolding = null;
    let lastAutosave = performance.now();
    const undoStack = [];

    const TYPE_LABELS = new Map();
    A.MATERIALS.forEach((m) => TYPE_LABELS.set(m.id, m.label));
    A.PLANTS.forEach((p) => TYPE_LABELS.set(p.id, p.label));
    TYPE_LABELS.set(A.EMPTY, 'Empty');
    TYPE_LABELS.set(A.DECOR_DRIFTWOOD, 'Driftwood Decoration');
    TYPE_LABELS.set(A.DECOR_CORAL, 'Coral Decoration');
    TYPE_LABELS.set(A.DECOR_CASTLE, 'Castle Decoration');
    TYPE_LABELS.set(A.DECOR_SHIP, 'Sunken Ship Decoration');

    function flashStatus(message) { status.textContent = message; }

    function setOverlayHidden(hidden) {
      overlayHidden = !!hidden;
      document.body.classList.toggle('overlay-hidden', overlayHidden);
      toggleOverlayBtn.textContent = overlayHidden ? 'Show Overlay' : 'Hide Overlay';
      localStorage.setItem(OVERLAY_KEY, overlayHidden ? '1' : '0');
    }

    function updatePeacefulButton() { togglePeacefulBtn.textContent = 'Peaceful: ' + (creatures.peacefulMode ? 'On' : 'Off'); }

    function hideAllModalOverlays() {
      helpOverlay.hidden = true;
      optionsOverlay.hidden = true;
      inspectOverlay.hidden = true;
    }

    function syncPauseState() {
      engine.paused = manualPaused || orientationPaused || !helpOverlay.hidden || !optionsOverlay.hidden || !inspectOverlay.hidden;
      pauseBtn.textContent = manualPaused ? 'Resume' : 'Pause';
      pauseOverlay.hidden = !(manualPaused && !orientationPaused && helpOverlay.hidden && optionsOverlay.hidden && inspectOverlay.hidden);
    }

    function syncMobileOrientation() {
      if (!mobileMode) {
        orientationPaused = false;
        rotateOverlay.hidden = true;
        syncPauseState();
        return;
      }
      orientationPaused = window.innerHeight > window.innerWidth;
      rotateOverlay.hidden = !orientationPaused;
      document.body.classList.toggle('mobile-portrait', orientationPaused);
      syncPauseState();
    }

    function openOverlay(element) {
      hideAllModalOverlays();
      element.hidden = false;
      syncPauseState();
    }
    function closeOverlay(element) {
      element.hidden = true;
      syncPauseState();
    }

    function cloneState() {
      return {
        version: 5,
        ui: { brush: Number(brush.value), speed: Number(speed.value), light: Number(light.value), overlayHidden, peacefulMode: creatures.peacefulMode },
        engine: engine.exportState(),
        creatures: creatures.exportState()
      };
    }

    function applyState(state) {
      if (!state || !state.engine || !state.creatures) throw new Error('Invalid save data');
      engine.importState(state.engine);
      creatures.importState(state.creatures);
      if (state.ui) {
        brush.value = String(state.ui.brush || 5);
        speed.value = String(state.ui.speed || 1);
        light.value = String(state.ui.light || 72);
        engine.light = Number(light.value) / 100;
        creatures.peacefulMode = !(state.ui.peacefulMode === false);
        setOverlayHidden(!!state.ui.overlayHidden);
        updatePeacefulButton();
      }
      document.getElementById('brushValue').textContent = brush.value;
      document.getElementById('speedValue').textContent = speed.value;
      document.getElementById('lightValue').textContent = light.value + '%';
      flashStatus('Aquarium loaded');
    }

    function pushUndoSnapshot() {
      undoStack.push(cloneState());
      if (undoStack.length > 12) undoStack.shift();
    }

    function addTool(container, item, kind, id) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tool';
      button.innerHTML = '<span class="icon" aria-hidden="true">' + item.icon + '</span><span class="label">' + item.label + '</span>';
      button.addEventListener('click', function () {
        document.querySelectorAll('.tool').forEach((el) => el.classList.remove('active'));
        button.classList.add('active');
        selected = { kind, id, label: item.label };
        flashStatus(item.label + ' selected');
      });
      container.appendChild(button);
      return button;
    }

    let defaultToolBtn = null;
    A.MATERIALS.forEach((item) => { const btn = addTool(materialTools, item, 'material', item.id); if (item.id === A.WATER) defaultToolBtn = btn; });
    A.PLANTS.forEach((item) => addTool(plantTools, item, 'plant', item.id));
    A.CREATURE_TOOL_DEFS.forEach((item) => addTool(creatureTools, item, 'creature', item.id));
    A.DECORATIONS.forEach((item) => addTool(decorationTools, item, 'decoration', item.id));
    A.FORCE_TOOLS.forEach((item) => addTool(forceTools, item, 'force', item.id));
    if (defaultToolBtn) defaultToolBtn.classList.add('active');

    function canvasPosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width * engine.cols,
        y: (event.clientY - rect.top) / rect.height * engine.rows,
        px: (event.clientX - rect.left) / rect.width * canvas.width,
        py: (event.clientY - rect.top) / rect.height * canvas.height
      };
    }

    function materialInfo(position) {
      const x = clamp(Math.floor(position.x), 0, engine.cols - 1);
      const y = clamp(Math.floor(position.y), 0, engine.rows - 1);
      const type = engine.grid[engine.idx(x, y)];
      return '<p><strong>Material:</strong> ' + (TYPE_LABELS.get(type) || ('Type ' + type)) + '</p><p><strong>Cell:</strong> ' + x + ', ' + y + '</p><p><strong>Age:</strong> ' + engine.age[engine.idx(x, y)] + ' ticks</p>';
    }

    function inspectAt(position) {
      const creature = creatures.findAt(position.px, position.py);
      inspectContent.innerHTML = creature ? creatures.inspectText(creature) : materialInfo(position);
      openOverlay(inspectOverlay);
    }

    function pickCell(position) {
      const x = clamp(Math.floor(position.x), 0, engine.cols - 1);
      const y = clamp(Math.floor(position.y), 0, engine.rows - 1);
      const decor = engine.getDecorationAt(x, y);
      if (decor) return { kind: 'decor', decor };
      const type = engine.grid[engine.idx(x, y)];
      if (type === A.EMPTY) return null;
      engine.eraseAt(x, y);
      return { kind: 'cell', type };
    }

    function placeGrabbed(position) {
      if (!grabbed) return;
      if (grabbed.kind === 'cell') engine.paint(Math.floor(position.x), Math.floor(position.y), grabbed.type, 1);
      else if (grabbed.kind === 'creature') { grabbed.creature.x = position.px; grabbed.creature.y = position.py; grabbed.creature.vx = 0; grabbed.creature.vy = 0; }
      else if (grabbed.kind === 'decor') engine.placeDecoration(grabbed.decor.kind, Math.floor(position.x), Math.floor(position.y));
      grabbed = null;
      flashStatus(selected.label + ' selected');
    }

    function doOneShot(position) {
      if (selected.kind === 'creature') {
        const now = performance.now();
        if (now - lastCreatureStamp > 140) {
          creatures.add(selected.id, position.px, position.py);
          lastCreatureStamp = now;
        }
        return;
      }
      if (selected.kind === 'decoration') { engine.placeDecoration(selected.id, Math.floor(position.x), Math.floor(position.y)); return; }
      if (selected.kind !== 'force') return;
      if (selected.id === 'inspect') { inspectAt(position); return; }
      if (selected.id === 'explode') { engine.explode(position.x, position.y, Number(brush.value) + 2); creatures.explode(position.px, position.py, (Number(brush.value) + 2) * engine.cell); return; }
      if (selected.id === 'grab') {
        const creature = creatures.findAt(position.px, position.py);
        if (creature) { grabbed = { kind: 'creature', creature }; flashStatus('Dragging ' + creature.name); return; }
        const picked = pickCell(position);
        if (picked) {
          if (picked.kind === 'decor') { engine.clearDecoration(picked.decor.id); grabbed = { kind: 'decor', decor: picked.decor }; flashStatus('Dragging decoration'); }
          else { grabbed = picked; flashStatus('Grabbed ' + (TYPE_LABELS.get(picked.type) || 'material')); }
        }
        return;
      }
      if (selected.id === 'net') {
        if (!netHolding) {
          const creature = creatures.findAt(position.px, position.py);
          if (creature) { netHolding = creature; flashStatus('Caught ' + creature.name); }
        } else {
          netHolding.x = position.px; netHolding.y = position.py; netHolding.vx = 0; netHolding.vy = 0; flashStatus('Released ' + netHolding.name); netHolding = null;
        }
      }
    }

    function doDrag(position) {
      const radius = Number(brush.value);
      if (selected.kind === 'material' || selected.kind === 'plant') { engine.paint(Math.floor(position.x), Math.floor(position.y), selected.id, radius); return; }
      if (selected.kind === 'creature') {
        const now = performance.now();
        if (now - lastCreatureStamp > 140) { creatures.add(selected.id, position.px, position.py); lastCreatureStamp = now; }
        return;
      }
      if (selected.kind !== 'force') return;
      if (selected.id === 'erase') { engine.paint(Math.floor(position.x), Math.floor(position.y), A.EMPTY, radius); return; }
      if (selected.id === 'drain') { engine.drain(position.x, position.y, radius); return; }
      if (selected.id === 'stir' && lastPos) { engine.stir(lastPos, position, radius + 1, false); return; }
      if (selected.id === 'current' && lastPos) { engine.stir(lastPos, position, radius + 2, true); return; }
      if (selected.id === 'heat') { engine.applyHeatCool(position.x, position.y, radius + 1, false); return; }
      if (selected.id === 'cool') { engine.applyHeatCool(position.x, position.y, radius + 1, true); return; }
      if (selected.id === 'grab' && grabbed && grabbed.kind === 'creature') {
        grabbed.creature.x = position.px; grabbed.creature.y = position.py; grabbed.creature.vx = 0; grabbed.creature.vy = 0;
      }
    }

    canvas.addEventListener('pointerdown', function (event) {
      if (orientationPaused || !helpOverlay.hidden || !optionsOverlay.hidden || !inspectOverlay.hidden) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      pointer.down = true;
      const pos = canvasPosition(event);
      pointer.x = pos.px; pointer.y = pos.py; lastPos = pos;
      pushUndoSnapshot();
      doOneShot(pos);
      doDrag(pos);
    });
    canvas.addEventListener('pointermove', function (event) {
      const pos = canvasPosition(event);
      pointer.x = pos.px; pointer.y = pos.py;
      if (netHolding) { netHolding.x = pos.px; netHolding.y = pos.py; netHolding.vx = 0; netHolding.vy = 0; }
      if (!pointer.down) return;
      doDrag(pos);
      lastPos = pos;
    });
    function endPointer(event) {
      if (pointer.down && grabbed) placeGrabbed(lastPos || { x: 0, y: 0, px: 0, py: 0 });
      pointer.down = false;
      lastPos = null;
      if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    pauseBtn.addEventListener('click', function () { manualPaused = !manualPaused; syncPauseState(); });
    resumeOverlayBtn.addEventListener('click', function () { manualPaused = false; syncPauseState(); });
    helpBtn.addEventListener('click', function () { openOverlay(helpOverlay); });
    closeHelpBtn.addEventListener('click', function () { closeOverlay(helpOverlay); });
    optionsBtn.addEventListener('click', function () { openOverlay(optionsOverlay); });
    closeOptionsBtn.addEventListener('click', function () { closeOverlay(optionsOverlay); });
    closeInspectBtn.addEventListener('click', function () { closeOverlay(inspectOverlay); });

    function exitZen() { document.body.classList.remove('zen'); exitZenBtn.hidden = true; flashStatus('Zen Mode off'); }
    zenBtn.addEventListener('click', function () { document.body.classList.add('zen'); exitZenBtn.hidden = false; flashStatus('Zen Mode active — press Esc or click Exit Zen Mode'); });
    exitZenBtn.addEventListener('click', exitZen);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (document.body.classList.contains('zen')) exitZen();
        closeOverlay(helpOverlay); closeOverlay(optionsOverlay); closeOverlay(inspectOverlay);
      }
    });

    brush.addEventListener('input', function () { document.getElementById('brushValue').textContent = brush.value; });
    speed.addEventListener('input', function () { document.getElementById('speedValue').textContent = speed.value; });
    light.addEventListener('input', function () { engine.light = Number(light.value) / 100; document.getElementById('lightValue').textContent = light.value + '%'; });

    undoBtn.addEventListener('click', function () {
      if (!undoStack.length) { flashStatus('Nothing to undo'); return; }
      applyState(undoStack.pop());
      flashStatus('Undo');
    });
    resetBtn.addEventListener('click', function () {
      pushUndoSnapshot();
      engine.reset(); creatures.reset(); manualPaused = false; syncPauseState(); flashStatus('Aquarium reset');
    });

    toggleOverlayBtn.addEventListener('click', function () { setOverlayHidden(!overlayHidden); });
    togglePeacefulBtn.addEventListener('click', function () { creatures.peacefulMode = !creatures.peacefulMode; updatePeacefulButton(); flashStatus(creatures.peacefulMode ? 'Peaceful mode on' : 'Peaceful mode off'); });

    function saveToKey(key) { localStorage.setItem(key, JSON.stringify(cloneState())); }
    function loadFromKey(key) { const raw = localStorage.getItem(key); if (!raw) return false; applyState(JSON.parse(raw)); return true; }
    quickSaveBtn.addEventListener('click', function () { saveToKey(QUICK_SAVE_KEY); flashStatus('Quick saved'); });
    quickLoadBtn.addEventListener('click', function () { if (!loadFromKey(QUICK_SAVE_KEY) && !loadFromKey(AUTO_SAVE_KEY)) flashStatus('No save found'); });
    exportBtn.addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(cloneState())], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'AquariumSandbox.sav'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 500); flashStatus('Save exported');
    });
    importBtn.addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function () {
      const file = importFile.files && importFile.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { try { applyState(JSON.parse(String(reader.result || ''))); flashStatus('Save imported'); } catch (e) { flashStatus('Could not import save file'); } importFile.value = ''; };
      reader.readAsText(file);
    });

    function updateAutosave(now) {
      if (now - lastAutosave > 60000) {
        lastAutosave = now;
        try { saveToKey(AUTO_SAVE_KEY); autosaveStatus.textContent = 'Autosave: ' + new Date().toLocaleTimeString(); }
        catch (e) { autosaveStatus.textContent = 'Autosave: unavailable'; }
      }
    }

    function loop(now) {
      const elapsed = Math.min(0.1, (now - lastFrameAt) / 1000);
      lastFrameAt = now;
      accumulator += elapsed;
      const simSpeed = Number(speed.value);
      let steps = 0;
      while (accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
        engine.step(simSpeed);
        if (!engine.paused) creatures.update(pointer, FIXED_DT * simSpeed, engine.light);
        accumulator -= FIXED_DT;
        steps += 1;
      }
      const count = engine.render();
      creatures.draw(engine.ctx, engine.light);
      if (netHolding) {
        engine.ctx.save(); engine.ctx.strokeStyle = '#ffffff'; engine.ctx.lineWidth = 2; engine.ctx.beginPath(); engine.ctx.arc(netHolding.x, netHolding.y, netHolding.size + 8, 0, Math.PI * 2); engine.ctx.stroke(); engine.ctx.restore();
      }

      countEl.textContent = count.toLocaleString() + ' particles';
      const stats = creatures.getStats();
      const warnings = [];
      if (stats.hungry) warnings.push(stats.hungry + ' hungry');
      if (stats.dry) warnings.push(stats.dry + ' need water');
      if (stats.dead) warnings.push(stats.dead + ' dead');
      if (stats.eggs) warnings.push(stats.eggs + ' eggs');
      if (stats.babies) warnings.push(stats.babies + ' babies');
      creatureEl.textContent = stats.alive + ' alive' + (warnings.length ? ' • ' + warnings.join(' • ') : '');
      creatureEl.classList.toggle('warning', warnings.length > 0);

      frames += 1;
      if (now - lastFpsAt > 500) {
        fpsEl.textContent = Math.round(frames * 1000 / (now - lastFpsAt)) + ' FPS';
        frames = 0; lastFpsAt = now;
      }
      updateAutosave(now);
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', syncMobileOrientation, { passive: true });
    window.addEventListener('orientationchange', function () { setTimeout(syncMobileOrientation, 120); }, { passive: true });

    setOverlayHidden(overlayHidden);
    updatePeacefulButton();
    document.getElementById('brushValue').textContent = brush.value;
    document.getElementById('speedValue').textContent = speed.value;
    document.getElementById('lightValue').textContent = light.value + '%';
    engine.light = Number(light.value) / 100;
    syncMobileOrientation();
    document.body.dataset.aquariumReady = 'true';
    document.body.dataset.toolCount = String(document.querySelectorAll('.tool').length);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
