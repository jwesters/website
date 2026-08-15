(() => {
  'use strict';

  const strategies = Array.isArray(window.STRATEGIES) ? window.STRATEGIES : [];
  const categories = Array.isArray(window.CATEGORIES) ? window.CATEGORIES : [];
  const liveCategories = categories.filter(c => c.live);
  const byId = new Map(strategies.map(s => [s.id, s]));
  const ALL = 'All strategies';

  const els = {
    categoryList: document.getElementById('categoryList'),
    strategyGrid: document.getElementById('strategyGrid'),
    searchInput: document.getElementById('searchInput'),
    typeFilters: document.getElementById('typeFilters'),
    resultCount: document.getElementById('resultCount'),
    emptyState: document.getElementById('emptyState'),
    resetButton: document.getElementById('resetButton'),
    favoritesFilter: document.getElementById('favoritesFilter'),
    dialog: document.getElementById('strategyDialog'),
    dialogContent: document.getElementById('dialogContent'),
    dialogClose: document.getElementById('dialogClose'),
    themeButton: document.getElementById('themeButton'),
    menuButton: document.getElementById('menuButton'),
    sidebar: document.getElementById('sidebar'),
    scrim: document.getElementById('scrim'),
    heroEyebrow: document.getElementById('heroEyebrow'),
    heroTitle: document.getElementById('heroTitle'),
    heroAccent: document.getElementById('heroAccent'),
    heroDescription: document.getElementById('heroDescription'),
    heroImage: document.getElementById('heroImage'),
    liveCount: document.getElementById('liveCount')
  };

  const state = {
    category: ALL,
    query: '',
    type: 'All',
    favoritesOnly: false,
    favorites: new Set(readJson('ii-favorites', []))
  };

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function saveFavorites() {
    try { localStorage.setItem('ii-favorites', JSON.stringify([...state.favorites])); } catch {}
  }

  function escapeHtml(value='') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function liveStrategyCount() {
    const names = new Set(liveCategories.map(c => c.name));
    return strategies.filter(s => names.has(s.category)).length;
  }

  function renderCategories() {
    if (!els.categoryList) return;
    const allButton = `<button class="category-button live ${state.category===ALL?'active':''}" data-category="${ALL}" title="Browse all strategies">
      <span class="dot" aria-hidden="true"></span><span><strong>All strategies</strong><small>${liveStrategyCount()} entries</small></span>
    </button>`;
    els.categoryList.innerHTML = allButton + categories.map(cat => `
      <button class="category-button ${cat.live ? 'live' : ''} ${state.category===cat.name?'active':''}" ${cat.live ? `data-category="${escapeHtml(cat.name)}"` : 'disabled'} title="${cat.live ? 'Open category' : 'Coming in a later build'}">
        <span class="dot" aria-hidden="true"></span>
        <span><strong>${escapeHtml(cat.name)}</strong><small>${escapeHtml(cat.note || 'Coming later')}</small></span>
      </button>
    `).join('');
    els.categoryList.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.category, true)));
    if (els.liveCount) els.liveCount.textContent = `${liveStrategyCount()} live`;
  }

  function categoryMeta() {
    if (state.category === ALL) return {
      eyebrow: '',
      title: 'Instructional Intelligence', accent: '',
      description: 'Browse every student-facing strategy, routine, structure, and organizer in the library. Search by name, purpose, classroom use, group size, or a known alias.',
      image: 'assets/previews/see-think-wonder.svg',
      imageAlt: 'Preview of a thinking routine from the live strategy library'
    };
    return categories.find(c => c.name === state.category) || liveCategories[0] || {};
  }

  function renderHero() {
    const meta = categoryMeta();
    if (els.heroEyebrow) els.heroEyebrow.textContent = meta.eyebrow || 'LIVE CATEGORY';
    if (els.heroTitle) els.heroTitle.textContent = meta.title || state.category;
    if (els.heroAccent) els.heroAccent.textContent = meta.accent || '';
    if (els.heroDescription) els.heroDescription.textContent = meta.description || '';
    if (els.heroImage) {
      els.heroImage.src = meta.image || 'assets/previews/fishbone.svg';
      els.heroImage.alt = meta.imageAlt || `${state.category} preview`;
    }
  }

  function setCategory(name, updateUrl=false) {
    if (name !== ALL && !liveCategories.some(c => c.name === name)) return;
    state.category = name;
    state.type = 'All';
    renderCategories(); renderHero(); renderTypeFilters(); renderCards();
    toggleSidebar(false);
    if (updateUrl) {
      const url = new URL(location.href);
      if (name === ALL) url.searchParams.delete('category'); else url.searchParams.set('category', name);
      url.hash = '';
      history.replaceState(null, '', url.pathname + url.search);
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    }
  }

  function typeLabel(type='') {
    if (type.includes('Thinking Routine Family')) return 'Thinking Routine Family';
    if (type.includes('Thinking Routine')) return 'Thinking Routine';
    if (type.includes('Thinking Tactic')) return 'Thinking Tactic';
    if (type.includes('Creative Thinking')) return 'Creative Thinking Strategy';
    if (type.includes('Instructional Strategy')) return 'Instructional Strategy';
    if (type.includes('Vocabulary')) return 'Vocabulary Strategy';
    if (type.includes('Writing')) return 'Writing Strategy';
    if (type.includes('Formative') || type.includes('Diagnostic') || type.includes('Transfer Check') || type.includes('Success-Criteria')) return 'Assessment-for-Learning Routine';
    if (type.includes('Memory') || type.includes('Metacognitive')) return 'Learning & Memory Strategy';
    if (type.includes('Language') || type.includes('Cross-Language') || type.includes('Reconstruction') || type.includes('Concrete Language')) return 'Language Support';
    if (type.includes('Inquiry')) return 'Inquiry Strategy';
    if (type.includes('Problem')) return 'Problem-Solving Strategy';
    if (type.includes('Cooperative')) return 'Cooperative Structure';
    if (type.includes('Visual Thinking')) return 'Visual Organizer';
    if (type.includes('Graphic')) return 'Graphic Organizer';
    if (type.includes('Strategy')) return 'Strategy';
    return type || 'Instructional Approach';
  }

  function inActiveCategory(s) {
    return state.category === ALL || s.category === state.category;
  }

  function renderTypeFilters() {
    if (!els.typeFilters) return;
    const pool = strategies.filter(inActiveCategory);
    const types = ['All', ...new Set(pool.map(s => typeLabel(s.type)))];
    if (!types.includes(state.type)) state.type = 'All';
    els.typeFilters.innerHTML = types.map(t => `<button class="chip ${state.type===t?'active':''}" data-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
    els.typeFilters.querySelectorAll('[data-type]').forEach(btn => btn.addEventListener('click', () => {
      state.type = btn.dataset.type;
      renderTypeFilters(); renderCards();
    }));
  }

  function searchable(s) {
    return [s.name, ...(s.aliases||[]), s.summary, s.type, s.category, s.time, s.group, ...(s.useWhen||[]), ...(s.avoidWhen||[]), s.example, s.teacherTip].join(' ').toLowerCase();
  }

  function filteredStrategies() {
    const q = state.query.trim().toLowerCase();
    return strategies.filter(s => {
      if (!inActiveCategory(s)) return false;
      if (q && !searchable(s).includes(q)) return false;
      if (state.type !== 'All' && typeLabel(s.type) !== state.type) return false;
      if (state.favoritesOnly && !state.favorites.has(s.id)) return false;
      return true;
    });
  }

  function renderCards() {
    if (!els.strategyGrid) return;
    const list = filteredStrategies();
    els.resultCount.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`;
    els.emptyState.hidden = list.length > 0;
    els.strategyGrid.hidden = list.length === 0;
    els.strategyGrid.innerHTML = list.map(s => {
      const saved = state.favorites.has(s.id);
      const primaryResource = s.resources?.[0];
      return `<article class="strategy-card" data-id="${s.id}">
        <div class="preview-wrap"><img loading="lazy" src="${escapeHtml(s.preview)}" alt="Preview graphic for ${escapeHtml(s.name)}"></div>
        <div class="card-body">
          <div class="meta-line"><span class="type-pill">${escapeHtml(typeLabel(s.type))}</span><button class="favorite-button ${saved?'saved':''}" data-favorite="${s.id}" aria-label="${saved?'Remove from':'Add to'} favorites">${saved?'★':'☆'}</button></div>
          <h2>${escapeHtml(s.name)}</h2>
          <p class="summary">${escapeHtml(s.summary)}</p>
          <div class="quick"><span>◷ ${escapeHtml(s.time)}</span><span>◉ ${escapeHtml(s.group)}</span></div>
          <div class="card-actions"><button class="primary-button" data-open="${s.id}">Explore strategy</button>${primaryResource ? `<a class="secondary-button" href="${escapeHtml(primaryResource.file)}" target="_blank" rel="noopener">PDF</a>`:''}${primaryResource?.doc ? `<a class="secondary-button docx-button" href="${escapeHtml(primaryResource.doc)}" download>DOCX</a>`:''}</div>
        </div>
      </article>`;
    }).join('');

    els.strategyGrid.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openStrategy(btn.dataset.open, true)));
    els.strategyGrid.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation(); toggleFavorite(btn.dataset.favorite);
    }));
  }

  function listHtml(items) {
    return `<ul>${items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  }

  function openStrategy(id, updateHash=false) {
    const s = byId.get(id);
    if (!s || !els.dialog) return;
    const resourceLinks = (s.resources || []).map(r => `<div class="resource-item"><strong class="resource-item-title">${escapeHtml(r.label)}</strong><div class="resource-downloads"><a class="resource-link" href="${escapeHtml(r.file)}" target="_blank" rel="noopener">Open PDF ↗</a>${r.doc ? `<a class="resource-link docx-link" href="${escapeHtml(r.doc)}" download>Download DOCX ↓</a>` : ''}</div></div>`).join('');
    const related = (s.related || []).map(id => byId.get(id)).filter(Boolean);
    els.dialogContent.innerHTML = `
      <section class="detail-hero">
        <div><p class="eyebrow">${escapeHtml(typeLabel(s.type))}</p><h2>${escapeHtml(s.name)}</h2><p>${escapeHtml(s.summary)}</p>
          <div class="detail-meta"><span>◷ ${escapeHtml(s.time)}</span><span>◉ ${escapeHtml(s.group)}</span><span>${escapeHtml(s.type)}</span></div>
        </div>
        <img src="${escapeHtml(s.preview)}" alt="${escapeHtml(s.name)} visual preview">
      </section>
      <section class="detail-body">
        <div class="detail-main">
          <div class="detail-section two-col">
            <div class="callout"><h3>Use it when</h3>${listHtml(s.useWhen || [])}</div>
            <div class="callout warn"><h3>Choose something else when</h3>${listHtml(s.avoidWhen || [])}</div>
          </div>
          <div class="detail-section"><h3>How to use it</h3><ol class="steps">${(s.steps||[]).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol></div>
          <div class="detail-section"><h3>Classroom example</h3><p>${escapeHtml(s.example)}</p></div>
          <div class="detail-section callout"><h3>Teacher tip</h3><p>${escapeHtml(s.teacherTip)}</p></div>
          ${related.length ? `<div class="detail-section"><h3>Related strategies</h3><div class="related-list">${related.map(r=>`<button data-related="${r.id}">${escapeHtml(r.name)}</button>`).join('')}</div></div>`:''}
        </div>
        <aside class="resource-panel">
          <h3>Printable resources</h3>
          <div class="resource-list">${resourceLinks || '<p>No dedicated printable is needed for this entry.</p>'}</div>
          <button class="text-button ${state.favorites.has(s.id)?'active':''}" data-dialog-favorite="${s.id}" style="margin-top:12px;width:100%">${state.favorites.has(s.id)?'★ Saved to favorites':'☆ Save to favorites'}</button>
          <p class="source-note"><strong>Source note:</strong> ${escapeHtml(s.sourceNote || '')}<br><br>Explanations, graphics, and printables in this app are original syntheses and companion resources rather than reproduced source pages.</p>
        </aside>
      </section>`;

    els.dialogContent.querySelectorAll('[data-related]').forEach(btn => btn.addEventListener('click', () => openStrategy(btn.dataset.related, true)));
    const fav = els.dialogContent.querySelector('[data-dialog-favorite]');
    if (fav) fav.addEventListener('click', () => { toggleFavorite(s.id); openStrategy(s.id, false); });

    if (!els.dialog.open) els.dialog.showModal();
    if (updateHash) history.replaceState(null, '', `#${s.id}`);
  }

  function closeDialog(clearHash=true) {
    if (els.dialog?.open) els.dialog.close();
    if (clearHash && location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function toggleFavorite(id) {
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    saveFavorites(); renderCards();
    els.favoritesFilter?.classList.toggle('active', state.favoritesOnly);
  }

  function resetFilters() {
    state.query=''; state.type='All'; state.favoritesOnly=false;
    els.searchInput.value='';
    els.favoritesFilter?.classList.remove('active');
    renderTypeFilters(); renderCards();
  }

  function toggleSidebar(open) {
    if (!els.sidebar) return;
    const desired = typeof open === 'boolean' ? open : !els.sidebar.classList.contains('open');
    els.sidebar.classList.toggle('open', desired);
    els.menuButton?.setAttribute('aria-expanded', String(desired));
    if (els.scrim) { els.scrim.hidden = !desired; els.scrim.classList.toggle('show', desired); }
  }

  function initTheme() {
    let saved=''; try { saved = localStorage.getItem('ii-theme') || ''; } catch {}
    if (saved) document.documentElement.dataset.theme=saved;
    els.themeButton?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      const next = current === 'dark' ? 'light' : current === 'light' ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
      document.documentElement.dataset.theme=next;
      try { localStorage.setItem('ii-theme',next); } catch {}
    });
  }

  const requestedCategory = new URLSearchParams(location.search).get('category');
  if (requestedCategory === ALL || liveCategories.some(c => c.name === requestedCategory)) state.category = requestedCategory;

  const initialId = location.hash.slice(1);
  const initialStrategy = byId.get(initialId);
  if (initialStrategy && liveCategories.some(c => c.name === initialStrategy.category)) state.category = initialStrategy.category;

  renderCategories();
  renderHero();
  renderTypeFilters();
  renderCards();
  initTheme();

  els.searchInput?.addEventListener('input', e => { state.query=e.target.value; renderCards(); });
  els.searchInput?.addEventListener('keydown', e => { if(e.key==='Escape'){ e.target.value=''; state.query=''; renderCards(); }});
  els.favoritesFilter?.addEventListener('click', () => { state.favoritesOnly=!state.favoritesOnly; els.favoritesFilter.classList.toggle('active',state.favoritesOnly); renderCards(); });
  els.resetButton?.addEventListener('click', resetFilters);
  els.dialogClose?.addEventListener('click', () => closeDialog(true));
  els.dialog?.addEventListener('click', e => { if(e.target===els.dialog) closeDialog(true); });
  els.dialog?.addEventListener('close', () => { if(location.hash) history.replaceState(null,'',location.pathname+location.search); });
  els.menuButton?.addEventListener('click', () => toggleSidebar());
  els.scrim?.addEventListener('click', () => toggleSidebar(false));
  document.addEventListener('keydown', e => {
    if (e.key==='/' && document.activeElement?.tagName!=='INPUT') { e.preventDefault(); els.searchInput?.focus(); }
  });
  window.addEventListener('hashchange', () => {
    const id=location.hash.slice(1); const s=byId.get(id);
    if(s){ if (state.category!==ALL && state.category!==s.category && liveCategories.some(c=>c.name===s.category)) setCategory(s.category); openStrategy(id,false); }
  });
  if(initialStrategy) openStrategy(initialId,false);
})();
