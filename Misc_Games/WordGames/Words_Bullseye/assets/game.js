/* Word Bullseye — playable, fully offline word-hunting game. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const keys = {
    random: 'wordbullseye-game-random-v1',
    daily: 'wordbullseye-game-daily-v1',
    stats: 'wordbullseye-stats-v1',
    theme: 'wb-theme-v1'
  };
  const TARGETS = typeof window.WB_MYSTERY_RAW === 'string' ? window.WB_MYSTERY_RAW.split('\n') : [];
  const VALID = typeof window.WB_VALID_RAW === 'string' ? window.WB_VALID_RAW.split('\n') : [];
  window.WB_MYSTERY_RAW = null;
  window.WB_VALID_RAW = null;
  const TOTAL_TARGETS = Math.max(0, TARGETS.length - 2);
  let activeMode = 'random';
  let game = null;
  let toastTimer = null;
  let currentScreen = 'welcome';
  let stats = readStats();

  // The two lists have deliberately different purposes. Never sample from VALID.
  function lowerBound(arr, needle) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] < needle) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  function upperBound(arr, needle) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] <= needle) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  function includes(arr, needle) {
    const index = lowerBound(arr, needle);
    return index < arr.length && arr[index] === needle;
  }
  function dateToday() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  }
  function dailyIndex(date) {
    // FNV-1a: the same calendar date always gives the same puzzle on any device.
    const seed = 'WORD-BULLSEYE-DAILY-V1:' + date;
    let hash = 2166136261;
    for (let i=0;i<seed.length;i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash,16777619) >>> 0;
    }
    return 1 + (hash % TOTAL_TARGETS);
  }
  function randomIndex() {
    const n = TOTAL_TARGETS;
    if (window.crypto && window.crypto.getRandomValues) {
      const view = new Uint32Array(1);
      const limit = Math.floor(4294967296 / n) * n;
      do { window.crypto.getRandomValues(view); } while (view[0] >= limit);
      return 1 + (view[0] % n);
    }
    return 1 + Math.floor(Math.random() * n);
  }
  function safeRead(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(_) { return null; }
  }
  function safeWrite(key, object) {
    try { localStorage.setItem(key, JSON.stringify(object)); } catch(_) { /* Game remains playable without storage. */ }
  }
  function emptyModeStats() {
    return {played:0,wins:0,totalGuesses:0,totalScore:0,totalHints:0,bestScore:null,bestGuesses:null,streak:0,bestStreak:0,lastWinDate:null};
  }
  function readStats() {
    const s = safeRead(keys.stats);
    const sanitize = t => {
      const def = emptyModeStats();
      if (!t || typeof t !== 'object') return def;
      for (const key of Object.keys(def)) {
        if (['lastWinDate'].includes(key)) { if (typeof t[key]==='string') def[key] = t[key]; }
        else if (t[key] === null && ['bestScore','bestGuesses'].includes(key)) def[key] = null;
        else if (typeof t[key] === 'number' && Number.isFinite(t[key]) && t[key]>=0) def[key]=t[key];
      }
      return def;
    };
    return {random:sanitize(s?.random),daily:sanitize(s?.daily)};
  }
  function writeStats(){safeWrite(keys.stats, stats);}
  function isPlayableGame(s,mode) {
    return !!(s && typeof s==='object' && s.mode===mode &&
      typeof s.secret==='string' && includes(TARGETS,s.secret) &&
      s.secret!==TARGETS[0] && s.secret!==TARGETS[TARGETS.length-1] &&
      Array.isArray(s.guesses) && s.guesses.length<3000 &&
      s.guesses.every(x=>x && typeof x.word==='string' && includes(VALID,x.word) && ['before','after','hit'].includes(x.relation)) &&
      Number.isInteger(s.hintsUsed) && s.hintsUsed>=0 && s.hintsUsed<=3 &&
      typeof s.finished==='boolean' &&
      (mode!=='daily' || s.date===dateToday()));
  }
  function readGame(mode) {
    const item = safeRead(keys[mode]);
    if (!isPlayableGame(item,mode)) return null;
    // Preserve clues bought in the older game, instead of silently charging twice.
    if (!Array.isArray(item.hints)) {
      item.hints = [];
      if(item.hintsUsed>=1) item.hints.push({type:'length',value:item.secret.length});
      if(item.hintsUsed>=2) item.hints.push({type:'letter',index:0,char:item.secret[0]});
      if(item.hintsUsed>=3) item.hints.push({type:'letter',index:item.secret.length-1,char:item.secret.at(-1)});
    }
    if(item.hints.length!==item.hintsUsed || item.hints.some(h=>!h || !['letter','length'].includes(h.type) ||
      (h.type==='letter' && (!Number.isInteger(h.index) || h.index<0 || h.index>=item.secret.length || item.secret[h.index]!==h.char)))) return null;
    return item;
  }
  function saveGame(){if(game) safeWrite(keys[activeMode],game);}
  function newGame(mode){
    const secret = TARGETS[mode==='random'?randomIndex():dailyIndex(dateToday())];
    stats[mode].played++;
    writeStats();
    return {version:2,mode,date:mode==='daily'?dateToday():null,secret,guesses:[],hints:[],hintsUsed:0,finished:false,startedAt:Date.now(),finishedAt:null};
  }
  function startMode(mode, fresh=false) {
    if (!['random','daily'].includes(mode)) return;
    if (TOTAL_TARGETS!==4998 || VALID.length<5000) { toast('The vocabulary files could not be loaded.'); return; }
    activeMode = mode;
    game = (!fresh && readGame(mode)) || newGame(mode);
    saveGame();
    currentScreen = 'game';
    $('welcome-screen').classList.add('hidden');
    $('game-screen').classList.remove('hidden');
    $('game-eyebrow').innerHTML = mode==='daily'?'<span class="spark"></span> DAILY CHALLENGE · '+dateToday() : '<span class="spark"></span> FREE PLAY · ENDLESS WORDS';
    $('new-button').classList.toggle('hidden',mode==='daily');
    $('mode-random').classList.toggle('selected',mode==='random');
    $('mode-daily').classList.toggle('selected',mode==='daily');
    clearFeedback();
    $('guess-input').value='';
    render();
    if(!game.finished) requestAnimationFrame(()=>$('guess-input').focus({preventScroll:true}));
  }
  function goHome() {
    currentScreen = 'welcome';
    game = null;
    $('game-screen').classList.add('hidden');
    $('welcome-screen').classList.remove('hidden');
    updateResume();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function updateResume() {
    const r=readGame('random'), d=readGame('daily');
    const found=[r,d].find(g=>g && !g.finished);
    $('resume-button').classList.toggle('hidden',!found);
    if(found) {
      $('resume-button').textContent=found.mode==='daily'?'↻ Resume today\'s daily challenge':'↻ Resume your unfinished free-play game';
      $('resume-button').dataset.mode=found.mode;
    }
  }
  function score() { return game.guesses.length + game.hintsUsed*3; }
  function bounds() {
    let after=null,before=null;
    for(const item of game.guesses) {
      if(item.relation==='before' && (after===null || item.word>after)) after=item.word;
      if(item.relation==='after' && (before===null || item.word<before)) before=item.word;
    }
    return {after,before};
  }
  function commonPrefix(left,right) {
    if (!left || !right) return '';
    let i=0;
    while(i<left.length && i<right.length && left[i]===right[i]) i++;
    return left.slice(0,i);
  }
  function knownPrefix() {
    const {after,before}=bounds();
    let known=commonPrefix(after,before);
    // Extend with already purchased letter clues, but never re-purchase a known letter.
    while(known.length<game.secret.length) {
      const clue=game.hints.find(h=>h.type==='letter' && h.index===known.length);
      if (!clue) break;
      known+=clue.char;
    }
    return known;
  }
  function nextUnknownLetter() {
    const index=knownPrefix().length;
    return index<game.secret.length ? index : -1;
  }
  function ordinal(n) {
    const rest=n%100;
    return n+(rest>=11 && rest<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th');
  }
  function lengthHintUsed() { return game.hints.some(h=>h.type==='length'); }
  function candidates(lower,upper) {
    const lo=Math.max(1,lower?upperBound(TARGETS,lower):1);
    const hi=Math.min(TARGETS.length-2,upper?lowerBound(TARGETS,upper)-1:TARGETS.length-2);
    return {lo,hi,count:Math.max(0,hi-lo+1)};
  }
  function displayWord(s){return s ? s.toUpperCase() : '—';}
  function render() {
    if (!game) return;
    const {after,before}=bounds();
    const c=candidates(after,before);
    $('guess-count').textContent=String(game.guesses.length);
    $('history-count').textContent=String(game.guesses.length);
    $('effective-score').textContent=String(score());
    $('after-word').textContent=displayWord(after);
    $('before-word').textContent=displayWord(before);
    $('after-helper').textContent=after?'Closest lower guess':'No lower bound yet';
    $('before-helper').textContent=before?'Closest upper guess':'No upper bound yet';
    $('possible-count').innerHTML=c.count.toLocaleString()+' <span>'+ (c.count===1?'word':'words') +'</span>';
    $('range-window').style.left= ((c.lo-1)/TOTAL_TARGETS*100)+'%';
    $('range-window').style.width=(c.count/TOTAL_TARGETS*100)+'%';
    $('status-label').textContent=game.finished?'FOUND IT':'HUNTING';
    $('guess-input').disabled=game.finished;
    $('check-button').disabled=game.finished;
    const canOfferLetter=nextUnknownLetter()>=0;
    $('hint-button').disabled=game.finished || game.hintsUsed>=3 || (!canOfferLetter && lengthHintUsed());
    $('hint-button').innerHTML=game.hintsUsed>=3?'All hints used':(!canOfferLetter && lengthHintUsed()?'No new hints':'Get a hint <span aria-hidden="true">+3</span>');
    $('input-panel').classList.toggle('hidden',game.finished);
    $('victory-panel').classList.toggle('hidden',!game.finished);
    renderHints();
    renderHistory(after,before);
    if(game.finished) renderVictory();
  }
  function renderHistory(after,before) {
    const list=$('history-list');
    list.replaceChildren();
    if(!game.guesses.length) {
      const wrap=document.createElement('div');wrap.className='history-empty';
      wrap.innerHTML='<div class="empty-orbit"><span>?</span></div><b>Your trail starts here</b><p>Each valid guess appears here, along with its alphabetical clue.</p>';
      list.appendChild(wrap);return;
    }
    const frag=document.createDocumentFragment();
    [...game.guesses].reverse().forEach((guess,j)=>{
      const i=game.guesses.length-j;
      const isBound=(guess.word===after && guess.relation==='before') || (guess.word===before && guess.relation==='after');
      const el=document.createElement('div');el.className='history-item'+(isBound?' current':'');
      const n=document.createElement('span');n.className='order';n.textContent='#'+String(i).padStart(2,'0');
      const middle=document.createElement('span');middle.className='history-main';
      const title=document.createElement('strong');title.textContent=displayWord(guess.word);middle.appendChild(title);
      if(isBound){const tag=document.createElement('small');tag.textContent='Closest boundary';middle.appendChild(tag);}
      const badge=document.createElement('span');
      badge.className='history-result '+(guess.relation==='before'?'lower':guess.relation==='after'?'upper':'hit');
      badge.textContent=guess.relation==='before'?'↑ Before':guess.relation==='after'?'↓ After':'✦ Bullseye';
      badge.title=guess.relation==='before'?'Your guess is alphabetically before the secret word':guess.relation==='after'?'Your guess is alphabetically after the secret word':'You found the word';
      el.append(n,middle,badge);frag.appendChild(el);
    });
    list.appendChild(frag);
    list.scrollTop=0;
  }
  function hintText(clue) {
    if(clue.type==='length') return 'Word length: '+clue.value+' letters';
    return 'Letter '+(clue.index+1)+' ('+ordinal(clue.index+1)+'): '+clue.char.toUpperCase();
  }
  function renderHints(){
    const container=$('hint-list');
    container.replaceChildren();
    container.classList.toggle('hidden',game.hintsUsed===0);
    game.hints.forEach((clue,i)=>{
      const span=document.createElement('span');span.className='hint-pill';
      span.textContent='Hint '+(i+1)+': '+hintText(clue);
      container.appendChild(span);
    });
  }
  function setFeedback(message,kind='') {
    const el=$('feedback');el.textContent=message;el.className='feedback'+(kind?' '+kind:'');
  }
  function clearFeedback(){setFeedback('Think alphabetically. Every clue counts.');}
  function normalizeWord(raw) {
    return raw.trim().toLowerCase().normalize('NFKC').replace(/[‘’]/g,"'");
  }
  function submitGuess() {
    if(!game || game.finished) return;
    const word=normalizeWord($('guess-input').value);
    if(!word) {setFeedback('Enter a word to get started.','warn');return;}
    if(word.length<3 || !/^[a-z]+(?:'[a-z]+)*$/.test(word)) {
      setFeedback('Use an English word with at least 3 characters (letters or an apostrophe).','warn');return;
    }
    if(game.guesses.some(x=>x.word===word)) {
      setFeedback('Already guessed! Try a different word. This one does not count.','warn');return;
    }
    if(!includes(VALID,word) && !includes(TARGETS,word)) {
      setFeedback('That word is not in the accepted English-word list. No guess counted.','warn');return;
    }
    const relation=word<game.secret?'before':word>game.secret?'after':'hit';
    game.guesses.push({word,relation,time:Date.now()});
    $('guess-input').value='';
    if(relation==='hit') {
      finishGame();
      setFeedback('Bullseye! You got it.','good');
    } else {
      setFeedback('Valid word! '+displayWord(word)+' comes '+relation.toUpperCase()+' the secret word.','good');
    }
    saveGame();
    render();
    if(relation!=='hit') requestAnimationFrame(()=>$('guess-input').focus({preventScroll:true}));
  }
  function finishGame() {
    if(game.finished) return;
    game.finished=true;game.finishedAt=Date.now();
    const s=stats[activeMode];
    s.wins++;
    s.totalGuesses+=game.guesses.length;
    s.totalScore+=score();
    s.totalHints+=game.hintsUsed;
    s.bestScore=s.bestScore===null?score():Math.min(s.bestScore,score());
    s.bestGuesses=s.bestGuesses===null?game.guesses.length:Math.min(s.bestGuesses,game.guesses.length);
    if(activeMode==='daily') {
      const prev = s.lastWinDate && Date.parse(s.lastWinDate+'T00:00:00Z');
      const now=Date.parse(game.date+'T00:00:00Z');
      s.streak=prev && (now-prev)===86400000 ? s.streak+1 : 1;
      s.lastWinDate=game.date;
    } else s.streak++;
    s.bestStreak=Math.max(s.bestStreak,s.streak);
    writeStats();
  }
  function renderVictory(){
    $('victory-word').textContent=displayWord(game.secret);
    $('victory-guesses').textContent=game.guesses.length;
    $('victory-hints').textContent=game.hintsUsed;
    $('victory-score').textContent=score();
    $('again-button').textContent=activeMode==='daily'?'Play free mode ↗':'Next word ↗';
  }
  function buyHint(clue) {
    if(game.finished || game.hintsUsed>=3) return;
    game.hints.push(clue);
    game.hintsUsed=game.hints.length;
    saveGame(); render(); closeDialog();
    toast(hintText(clue)+' · +3 points');
  }
  function useHint(){
    if(!game || game.finished || game.hintsUsed>=3) return;
    const prefix=knownPrefix();
    const idx=nextUnknownLetter();
    const choices=[{label:'Not yet',style:'secondary',onClick:closeDialog}];
    if(!lengthHintUsed()) {
      choices.push({label:'Word length (+3)',style:'secondary',onClick:()=>buyHint({type:'length',value:game.secret.length})});
    }
    if(idx>=0) {
      choices.push({label:'Next letter (+3)',style:'primary',onClick:()=>{
        // Re-check in case clues changed after the dialog opened.
        const current=nextUnknownLetter();
        if(current>=0) buyHint({type:'letter',index:current,char:game.secret[current]});
        else closeDialog();
      }});
    }
    if(choices.length===1) return;
    const message=prefix?
      `<p>Your closest guesses (and any previous letter hints) already establish <strong>${prefix.toUpperCase()}</strong>. Your next letter hint reveals the <strong>${ordinal(idx+1)} letter</strong>, not a letter you already know.</p>` :
      '<p>Your next letter hint reveals the first unknown letter of the secret word.</p>';
    openDialog('Choose a helpful hint',`${message}<p>Each hint adds <strong>3 points</strong> to your final score. You have <strong>${3-game.hintsUsed}</strong> hint${3-game.hintsUsed===1?'':'s'} left.</p>`,choices,'A LITTLE HELP');
  }
  function newRound() {
    if(activeMode!=='random') { toast('One daily puzzle is available each day.');return; }
    if(!game.finished && (game.guesses.length || game.hintsUsed)) {
      openDialog('Start a new word?','<p>Your current free-play word and its guess history will be discarded. Your past wins and statistics will stay saved.</p>',[
        {label:'Keep playing',style:'secondary',onClick:closeDialog},
        {label:'New word',style:'primary',onClick:()=>{stats.random.streak=0;writeStats();closeDialog();startMode('random',true);}}
      ],'NEW ROUND');
    } else startMode('random',true);
  }
  function toast(message) {
    const el=$('app-toast');el.textContent=message;el.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2700);
  }
  function closeDialog(){if($('app-dialog').open)$('app-dialog').close();}
  function openDialog(title,html,actions,kicker='WORD BULLSEYE'){
    const dialog=$('app-dialog');
    if(dialog.open) dialog.close();
    $('dialog-title').textContent=title;
    $('dialog-kicker').textContent=kicker;
    $('dialog-content').innerHTML=html;
    $('dialog-buttons').replaceChildren();
    for(const item of actions){
      const button=document.createElement('button');button.type='button';
      button.className='btn '+(item.style==='primary'?'btn-primary':'btn-secondary');
      button.textContent=item.label;button.addEventListener('click',item.onClick);
      $('dialog-buttons').appendChild(button);
    }
    dialog.showModal();
  }
  function showHelp(){
    const html=`<div class="rule"><strong>01 · Find the secret word.</strong><br>Only one of the 5,000 mystery words is the answer. The first and last words of that list are excluded.</div>
      <div class="rule"><strong>02 · Enter an English word.</strong><br>A valid word gets a clue. Your guess can come from a much larger approved dictionary of 92,295 words.</div>
      <div class="example"><strong>Example: secret word = ORANGE</strong><br>APPLE → <span style="color:var(--teal)">Before the secret word</span><br>PEAR → <span style="color:var(--pink)">After the secret word</span><br>ORANGE → <strong style="color:var(--accent)">Bullseye!</strong></div>
      <div class="rule"><strong>03 · Watch your boundaries.</strong><br>The two clue cards show your nearest guesses on either side. A shrinking bar shows how many mystery words remain possible.</div>
      <div class="rule"><strong>04 · Take as many guesses as you need.</strong><br>Only accepted, unique words count. Invalid and repeated entries are free.</div>
      <div class="rule"><strong>05 · Hints are optional.</strong><br>Choose a word-length hint or reveal the next unknown letter. Letter hints skip letters already certain from your closest guesses or previous hints (for example, if you know PRO, you get the fourth letter). Each hint adds +3 to your final score. You can buy up to three hints. Lower scores are better.</div>
      <p style="margin-top:16px"><strong>Free play</strong> offers unlimited random words. <strong>Daily</strong> gives you one fixed word per calendar day. Your progress and statistics save in this browser, even offline.</p>`;
    openDialog('How to play',html,[{label:'Got it — let’s play!',style:'primary',onClick:closeDialog}],'THE RULEBOOK');
  }
  function renderStatsCells(mode) {
    const s=stats[mode];
    const val=n=>typeof n==='number'?n.toLocaleString():'—';
    const avg=s.wins?(s.totalGuesses/s.wins).toFixed(1):'—';
    const winRate=s.played?Math.round(100*s.wins/s.played)+'%':'—';
    return `<div class="stat-head">${mode==='random'?'∞ FREE PLAY':'◈ DAILY CHALLENGE'}</div>
      <div class="stats-grid"><div class="stat-cell"><span>Games started</span><strong>${val(s.played)}</strong></div><div class="stat-cell"><span>Wins</span><strong>${val(s.wins)}</strong></div><div class="stat-cell"><span>Win rate</span><strong>${winRate}</strong></div><div class="stat-cell"><span>Average guesses / win</span><strong>${avg}</strong></div><div class="stat-cell"><span>Best score</span><strong>${val(s.bestScore)}</strong></div><div class="stat-cell"><span>Best streak</span><strong>${val(s.bestStreak)}</strong></div></div>`;
  }
  function showStats(){
    openDialog('Your statistics',renderStatsCells('random')+renderStatsCells('daily')+'<p>Best score counts valid guesses plus three points per hint. Statistics are stored only in this browser.</p>',[
      {label:'Reset statistics',style:'secondary',onClick:()=>{openDialog('Reset your statistics?','<p>This clears your recorded statistics. Your current game and saved guesses will not be affected.</p>',[
        {label:'Cancel',style:'secondary',onClick:closeDialog},
        {label:'Reset stats',style:'primary',onClick:()=>{stats={random:emptyModeStats(),daily:emptyModeStats()};writeStats();closeDialog();toast('Statistics reset');}}
      ],'CONFIRM RESET');}},
      {label:'Done',style:'primary',onClick:closeDialog}
    ],'YOUR RECORDS');
  }
  async function copyResult(){
    if(!game || !game.finished)return;
    const arrows=game.guesses.map(g=>g.relation==='hit'?'🎯':g.relation==='before'?'↑':'↓').join(' ');
    const header=activeMode==='daily'?'Daily '+game.date:'Free play';
    const text=`Word Bullseye · ${header}\n${arrows}\n${game.guesses.length} valid guesses · ${game.hintsUsed} hints · score ${score()}\nCan you hit the bullseye?`;
    try {
      if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-10000px;top:0';document.body.appendChild(ta);ta.select();
        const copied=document.execCommand('copy');ta.remove();if(!copied)throw Error('copy failed');
      }
      toast('Result copied — without spoiling the answer!');
    } catch(_) {openDialog('Share your result','<p>Copy your spoiler-free result below:</p><div class="example" style="white-space:pre-wrap;overflow-wrap:anywhere" id="share-text"></div>',[{label:'Close',style:'primary',onClick:closeDialog}],'SHARE');$('share-text').textContent=text;}
  }
  function setTheme(next){
    if(next!=='light' && next!=='dark') return;
    document.documentElement.setAttribute('data-theme',next);
    $('theme-light').setAttribute('aria-pressed',String(next==='light'));
    $('theme-dark').setAttribute('aria-pressed',String(next==='dark'));
    document.querySelector('meta[name="theme-color"]').setAttribute('content',next==='light'?'#f5f3ed':'#0b1627');
    try{localStorage.setItem(keys.theme,next)}catch(_){}
  }
  function bindActions(){
    $('start-random').addEventListener('click',()=>startMode('random'));
    $('start-daily').addEventListener('click',()=>startMode('daily'));
    $('resume-button').addEventListener('click',()=>startMode($('resume-button').dataset.mode || 'random'));
    $('home-button').addEventListener('click',goHome);
    $('mode-random').addEventListener('click',()=>{if(currentScreen!=='game' || activeMode!=='random')startMode('random')});
    $('mode-daily').addEventListener('click',()=>{if(currentScreen!=='game' || activeMode!=='daily')startMode('daily')});
    $('help-button').addEventListener('click',showHelp);
    $('stats-button').addEventListener('click',showStats);
    $('theme-light').addEventListener('click',()=>setTheme('light'));
    $('theme-dark').addEventListener('click',()=>setTheme('dark'));
    $('new-button').addEventListener('click',newRound);
    $('guess-form').addEventListener('submit',e=>{e.preventDefault();submitGuess();});
    $('hint-button').addEventListener('click',useHint);
    $('again-button').addEventListener('click',()=>{if(activeMode==='daily')startMode('random',true);else startMode('random',true)});
    $('share-button').addEventListener('click',copyResult);
    $('close-dialog').addEventListener('click',closeDialog);
    $('guess-input').addEventListener('input',()=>{if($('feedback').classList.contains('warn')) clearFeedback();});
  }
  function boot(){
    bindActions();
    setTheme(document.documentElement.getAttribute('data-theme')==='light'?'light':'dark');
    updateResume();
    if(TARGETS.length!==5000 || VALID.length!==92295 || TARGETS.some((s,i)=>i>0 && TARGETS[i-1]>=s) || VALID.some((s,i)=>i>0 && VALID[i-1]>=s)) {
      $('welcome-description').textContent='The offline vocabulary could not be loaded correctly. Please extract the entire ZIP (including the assets folder) before opening Word_Bullseye.html.';
      $('start-random').disabled=true;
      $('start-daily').disabled=true;
    }
  }
  boot();
})();
