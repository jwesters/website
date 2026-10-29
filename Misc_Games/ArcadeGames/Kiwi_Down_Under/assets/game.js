(()=>{'use strict';
const W=432,H=720,STAGE=2580,TAU=Math.PI*2,GRAV=1280,MAXFALL=640;
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),modal=$('modal'),shade=$('shade'),toastEl=$('toast'),mobile=$('mobileControls'),pauseTop=$('pauseTop');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const worlds=[
 {name:'The Great Burrow',short:'Great Burrow',icon:'🌿',boss:'THE MIGHTY MOLE',accent:'#a8e1a2',color:'#644b43',enemies:['Burrow Worm','Mud Mole','Cave Bat','Tunnel Driller']},
 {name:'Glowcap Grotto',short:'Glowcap Grotto',icon:'🍄',boss:'QUEEN GLOWBUG',accent:'#dd9ee4',color:'#685174',enemies:['Spore Sprout','Glow Beetle','Cave Moth','Poison Puff']},
 {name:'Crystal Depths',short:'Crystal Depths',icon:'💎',boss:'THE CRYSTAL BEETLE',accent:'#83e9eb',color:'#4b7893',enemies:['Crystal Bug','Rockling','Cave Guardian','Laser Beetle']},
 {name:'The Molten Core',short:'Molten Core',icon:'🌋',boss:'THE MAGMA WYRM',accent:'#ffc27a',color:'#925243',enemies:['Ember Imp','Fire Bat','Lava Slime','Flame Driller']},
 {name:'Frostbite Caverns',short:'Frostbite',icon:'❄️',boss:'THE FROST YETI',accent:'#a2e8fc',color:'#4d8dad',enemies:['Ice Wolf','Snow Yeti','Frostwing','Ice Spirit']},
 {name:'Fossil Kingdom',short:'Fossil Kingdom',icon:'🦴',boss:'THE BONE REX',accent:'#e6d29c',color:'#8a6d58',enemies:['Bone Raptor','Fossil Bat','Skull Serpent','Bone Beetle']},
 {name:'Clockwork Underground',short:'Clockwork',icon:'⚙️',boss:'THE IRON WEAVER',accent:'#f7c17c',color:'#747a84',enemies:['Gear Spider','Clock Drone','Laser Turret','Tin Knight']},
 {name:'The Shadow Abyss',short:'Shadow Abyss',icon:'🌌',boss:'THE SHADOW KIWI',accent:'#dba1ff',color:'#625080',enemies:['Void Ghost','Night Imp','Shadow Kiwi','Dark Moth']}
];
const ENEMIES=[[0,1,2,11],[3,5,2,4],[7,6,4,10],[8,9,5,11],[12,13,14,15],[16,17,18,19],[20,21,22,23],[24,25,26,27]];
const AI=[['charger','pursuer','diver','sniper'],['lobber','zigzag','diver','burst'],['turret','charger','pursuer','sniper'],['burst','diver','pursuer','charger'],['charger','pursuer','diver','lobber'],['pursuer','diver','charger','burst'],['pursuer','zigzag','turret','sniper'],['teleport','burst','pursuer','diver']];
const suits=[{id:'basic',name:'Classic Kiwi',icon:'🥝',price:0,desc:'Too round to fly.'},{id:'pirate',name:'Pirate Kiwi',icon:'🏴‍☠️',price:80,desc:'Captain of the burrow.'},{id:'ninja',name:'Ninja Kiwi',icon:'🥷',price:130,desc:'A surprisingly noisy ninja.'},{id:'royal',name:'Royal Kiwi',icon:'👑',price:180,desc:'A proper round monarch.'},{id:'hero',name:'Super Kiwi',icon:'🦸',price:230,desc:'Cape, no flight.'},{id:'gold',name:'Golden Kiwi',icon:'🌟',price:360,desc:'A sparkling plumage.'},{id:'explorer',name:'Explorer Kiwi',icon:'🧭',price:100,desc:'A brave little explorer.'},{id:'berry',name:'Berry Kiwi',icon:'🍓',price:90,desc:'A snuggly berry bonnet.'}];
const perma=[{id:'heart',name:'Extra Hearts',icon:'❤️',max:5,prices:[90,180,320,510,750],desc:'Add a starting heart. Starts at just three.'},{id:'damage',name:'Egg Power',icon:'🥚',max:4,prices:[90,200,370,580],desc:'Deal more damage to tougher enemies.'},{id:'rate',name:'Fast Feathers',icon:'⚡',max:4,prices:[95,205,370,590],desc:'Faster egg fire and stronger hover recoil.'},{id:'magnet',name:'Coin Magnet',icon:'🧲',max:3,prices:[100,245,410],desc:'Collect nearby coins more easily.'},{id:'shield',name:'Shell Guard',icon:'🛡️',max:3,prices:[150,310,520],desc:'Start each run with a protective shell.'},{id:'boots',name:'Stomp Boots',icon:'👢',max:3,prices:[115,240,440],desc:'Higher stomp bounces and more damage.'}];
const starts=[{id:'none',name:'Plain Eggs',icon:'🥚',price:0,desc:'Single classic mini-egg.'},{id:'spread',name:'Twin Egg Start',icon:'✌️',price:230,desc:'Launch pairs of eggs.'},{id:'pierce',name:'Piercing Eggs',icon:'✨',price:280,desc:'Pierce through enemies.'},{id:'blast',name:'Splash Eggs',icon:'💥',price:320,desc:'Area damage on impact.'}];
const buffs=[{id:'spread',name:'EGG-SPLOSION',icon:'🥚',desc:'Add two side eggs to every volley.'},{id:'rate',name:'QUICK CLUCK',icon:'⚡',desc:'Faster shots and improved hover.'},{id:'power',name:'MEGA YOLK',icon:'💥',desc:'Each mini-egg hits harder.'},{id:'pierce',name:'PIERCING EGGS',icon:'✨',desc:'Pierce through multiple enemies.'},{id:'bounce',name:'BOUNCY EGGS',icon:'🎯',desc:'Ricochet eggs off platforms.'},{id:'stomp',name:'BOUNCE KING',icon:'👢',desc:'Much stronger stomps and bounce.'},{id:'health',name:'HEARTY SNACK',icon:'❤️',desc:'Heal two hearts and gain one maximum heart.'},{id:'magnet',name:'SHINY SEEKER',icon:'🧲',desc:'Attract all those elusive coins.'},{id:'shield',name:'SHELL SHIELD',icon:'🛡️',desc:'Absorb two incoming hits.'},{id:'blast',name:'SCRAMBLED!',icon:'🌟',desc:'Eggs burst into splash damage.'}];
const src={kiwi:'kiwi_sprites.png',enemies:'creatures.png',enemies2:'creatures_expansion.png',boss:'bosses.png',boss2:'bosses_expansion.png',tiles:'tiles.png',items:'items.png'};
for(let i=0;i<8;i++)src['bg'+i]='background_'+(i+1)+'.png';
const img={};for(const [k,f] of Object.entries(src)){const el=new Image();el.src='assets/'+f;img[k]=el;}
let game=null,clock=0,screen='menu',difficulty='medium',menuTab='costumes',shopBack='menu',lastFrame=performance.now(),accumulator=0,toastTime=0,audioCtx=null,songStep=0,blurMuted=false;
const keys={left:false,right:false,jump:false,shoot:false};let jumpBuffered=0;
function defaults(){return{coins:0,costumes:['basic'],wear:'basic',upgrades:{heart:0,damage:0,rate:0,magnet:0,shield:0,boots:0},starts:['none'],start:'none',scores:{adventure:[],endless:[]},settings:{music:.38,sfx:.75},completed:false,totals:{coins:0,kills:0,depth:0,runs:0}};}
let save;try{save=JSON.parse(localStorage.getItem('kiwi_down_under_save_v1'))||defaults();}catch{save=defaults();}
const defs=defaults();for(const k of Object.keys(defs))if(save[k]===undefined)save[k]=defs[k];for(const k in defs.upgrades)if(save.upgrades[k]===undefined)save.upgrades[k]=0;for(const k in defs.settings)if(save.settings[k]===undefined)save.settings[k]=defs.settings[k];
function randGen(seed){let a=(seed>>>0)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function range(rand,a,b){return a+(b-a)*rand();}
function persist(){try{localStorage.setItem('kiwi_down_under_save_v1',JSON.stringify(save));}catch{}updateRail();}
function updateRail(){const safe=(id,val)=>{let el=$(id);if(el)el.textContent=val;};safe('railDepth',Math.floor(save.totals.depth/10)+' m');safe('railCoins',save.coins.toLocaleString());safe('railBest',Math.max(0,...save.scores.adventure.map(e=>e.score),...save.scores.endless.map(e=>e.score)).toLocaleString());safe('railFits',save.costumes.length+' / 8');}updateRail();
function setScreen(name,html){screen=name;if(html!==undefined)modal.innerHTML=html;shade.classList.toggle('hidden',name==='playing'||name==='intro');shade.classList.toggle('powerChoice',name==='upgrade');pauseTop.classList.toggle('active',name==='playing'||name==='intro');mobile.style.display=(name==='playing'||name==='intro')?'':'none';stopKeys();}
function stopKeys(){for(const k in keys)keys[k]=false;jumpBuffered=0;if(typeof activeTouches!=='undefined')for(const touches of activeTouches.values())touches.clear();for(const b of document.querySelectorAll('.touch')){b.classList.remove('pressed');b.setAttribute('aria-pressed','false');}}
function notify(msg,time=1.75){toastEl.textContent=msg;toastEl.classList.add('show');toastTime=time;}
function logo(){return '<div class="eyebrow">A VERY ROUND ADVENTURE</div><div class="logo">KIWI<br><span class="sub">DOWN UNDER</span></div><div class="miniKiwi"></div>';}
function showMenu(){setScreen('menu',`${logo()}<div class="introText">32 stages • 8 worlds • 40 boss encounters.<br>Too round to fly. Too brave to stop.</div><div class="eyebrow">Choose your challenge</div><div class="pills">${['easy','medium','hard'].map(d=>`<button class="pill ${difficulty===d?'selected':''}" data-diff="${d}">${d.toUpperCase()}</button>`).join('')}</div><button class="btn" data-action="adventure">🌿 Adventure · 8 Worlds</button><button class="btn teal" data-action="endless">♾️ Endless Descent</button><div class="btnrow"><button class="btn ghost" data-action="shop">🛍️ Kiwi Shop</button><button class="btn ghost" data-action="how">❔ How to Play</button></div><div class="btnrow"><button class="btn ghost" data-action="scores">🏆 High Scores</button><button class="btn ghost" data-action="settings">⚙ Settings</button></div><div class="hintFooter">ORIGINAL PIXEL ART • OFFLINE • PROGRESS SAVED</div>`);}
function showShop(back='menu'){shopBack=back;const tabs=[['costumes','🎭 Costumes'],['upgrades','💪 Upgrades'],['starting','🥚 Starting Eggs']];let cards='';
 if(menuTab==='costumes')cards=suits.map((c,i)=>{const owned=save.costumes.includes(c.id),worn=save.wear===c.id;return `<div class="shopitem ${worn?'selected':''}"><div class="shopicon"><span class="shopAvatar" style="background-position:0 -${i*52}px"></span></div><div class="shopname">${c.name}</div><div class="shopdesc">${c.desc}</div><button class="buy ${worn?'worn':''}" data-buy="outfit:${c.id}" ${!owned&&save.coins<c.price?'disabled':''}>${worn?'✓ Wearing':owned?'Wear outfit':'🪙 '+c.price}</button></div>`;}).join('');
 if(menuTab==='upgrades')cards=perma.map(u=>{const lvl=save.upgrades[u.id],maxed=lvl>=u.max,price=maxed?0:u.prices[lvl];return `<div class="shopitem"><div class="shopicon">${u.icon}</div><div class="shopname">${u.name} ${lvl}/${u.max}</div><div class="shopdesc">${u.desc}</div><button class="buy" data-buy="upgrade:${u.id}" ${maxed||price>save.coins?'disabled':''}>${maxed?'✓ MAXED':'🪙 '+price}</button></div>`;}).join('');
 if(menuTab==='starting')cards=starts.map(u=>{const own=save.starts.includes(u.id),eq=save.start===u.id;return `<div class="shopitem ${eq?'selected':''}"><div class="shopicon">${u.icon}</div><div class="shopname">${u.name}</div><div class="shopdesc">${u.desc}</div><button class="buy ${eq?'worn':''}" data-buy="start:${u.id}" ${!own&&u.price>save.coins?'disabled':''}>${eq?'✓ Equipped':own?'Equip':'🪙 '+u.price}</button></div>`;}).join('');
 setScreen('shop',`<div class="heading">🛍️ KIWI SHOP <button class="miniBack" data-action="${back==='results'?'results':'menu'}">✕</button></div><div class="cash">🪙 ${save.coins.toLocaleString()} coins</div><div class="pills">${tabs.map(t=>`<button class="pill ${menuTab===t[0]?'selected':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="shopgrid">${cards}</div><div class="note">Coins and completed purchases carry between runs. Starting hearts begin lower now, so upgrades matter!</div><button class="btn ghost" data-action="${back==='results'?'results':'menu'}">← BACK</button>`);
}
function buyItem(type,id){if(type==='outfit'){const c=suits.find(x=>x.id===id);if(!c)return;if(save.costumes.includes(id))save.wear=id;else if(save.coins>=c.price){save.coins-=c.price;save.costumes.push(id);save.wear=id;sound('purchase');}}
 if(type==='upgrade'){const c=perma.find(x=>x.id===id);if(!c)return;const lvl=save.upgrades[id];if(lvl<c.max&&save.coins>=c.prices[lvl]){save.coins-=c.prices[lvl];save.upgrades[id]++;sound('purchase');}}
 if(type==='start'){const c=starts.find(x=>x.id===id);if(!c)return;if(save.starts.includes(id))save.start=id;else if(save.coins>=c.price){save.coins-=c.price;save.starts.push(id);save.start=id;sound('purchase');}}
 persist();showShop(shopBack);
}
function showHow(){setScreen('how',`<div class="heading">🥝 HOW TO PLAY</div><div class="infoPanel"><h3>32 levels. 8 worlds. 40 bosses.</h3>Descend through four procedurally generated levels per world. Every level has a miniboss. At the end of each world, defeat the great guardian too. World 8 ends in a final showdown!</div><div class="infoPanel"><h3>Controls</h3><b>A / D or ← / →:</b> Smooth horizontal movement.<br><b>W or ↑:</b> Jump, including a springy arena jump.<br><b>S / Space / ↓ / J:</b> Hold to fire mini-eggs downward.<br><b>Esc or P:</b> Pause.<br><b>Mobile:</b> Left/Right on the left; Jump and Shoot on the right. Press Jump + Shoot together with two fingers.<br><br><b>Hover!</b> Shooting while airborne briefly slows your fall. The <b>blue hover bar</b> recharges when you land or stomp.<br><b>Stomp!</b> Land on enemies from above to bounce and deal damage.</div><div class="infoPanel"><h3>Fight or flee</h3>World-specific enemies actively chase, aim, dash, teleport, and fire at you. Dodge visible warning effects. Bosses become bullet hells in later worlds. Boss floors bounce you upward so you can fight from above.</div><div class="infoPanel"><h3>Three stage bonuses</h3>⏱️ <b>Speed:</b> Finish quickly.<br>💖 <b>Flawless:</b> Take no damage during the level.<br>🕊️ <b>Pacifist:</b> Don't defeat ordinary enemies. Required minibosses and guardians are exempt.<br>Bonuses award score and bankable coins.</div><div class="infoPanel"><h3>Get stronger</h3>Coins buy permanent health, egg damage, egg speed, costumes, and starting weapons. Glowing blue diamond pickups PAUSE the game and offer three random temporary abilities: pick one. Red-tipped triangular spikes on platforms always hurt! All platforms stay firmly in place. Flat markings along cave walls are decorations, not pickups. Losing all hearts restarts from World 1, but your shop purchases stay.</div><button class="btn" data-action="menu">LET'S PLAY!</button>`);}
function showSettings(){setScreen('settings',`<div class="heading">⚙ SETTINGS</div><div class="infoPanel"><h3>Music volume</h3><input id="musicVol" style="width:100%;accent-color:#ffe29a" aria-label="Music volume" type="range" min="0" max="100" value="${Math.round(save.settings.music*100)}"></div><div class="infoPanel"><h3>Sound effects</h3><input id="sfxVol" style="width:100%;accent-color:#ffe29a" aria-label="Effects volume" type="range" min="0" max="100" value="${Math.round(save.settings.sfx*100)}"></div><div class="infoPanel"><h3>Display & saves</h3>Fully offline. Game saves locally. Use portrait on phones; landscape also works. Progress from the previous Kiwi Down Under version carries over automatically.</div><button class="btn" data-action="menu">← DONE</button>`);}
function showScores(){const scores=m=>save.scores[m].length?`<table class="scores"><thead><tr><th>#</th><th>Score</th><th>Stage</th><th>Mode</th></tr></thead><tbody>${save.scores[m].slice(0,5).map((s,i)=>`<tr><td>${i+1}</td><td>${Math.floor(s.score).toLocaleString()}</td><td>${s.stage||Math.ceil(s.depth/STAGE)||1}</td><td>${s.diff}</td></tr>`).join('')}</tbody></table>`:'<div class="note">No scores yet. Your legendary descent awaits.</div>';setScreen('scores',`<div class="heading">🏆 HIGH SCORES</div><div class="infoPanel"><h3>🌿 Adventure</h3>${scores('adventure')}</div><div class="infoPanel"><h3>♾️ Endless</h3>${scores('endless')}</div><div class="infoPanel"><h3>Career</h3>Runs: <b>${save.totals.runs}</b> • Enemies: <b>${save.totals.kills}</b><br>Coins collected: <b>${save.totals.coins}</b> • Deepest: <b>${Math.floor(save.totals.depth/10)} m</b></div><button class="btn" data-action="menu">← BACK</button>`);}
function showPause(){if(!game||game.done)return;setScreen('pause',`<div class="heading">⏸ PAUSED</div><div class="miniKiwi"></div><div class="infoPanel">World: <b>${worlds[game.world%8].name}</b><br>Level: <b>${game.stage%4+1} / 4</b><br>Coins found: <b>${game.coins}</b><br>Score: <b>${Math.floor(game.score).toLocaleString()}</b><br>Bosses defeated: <b>${game.bosses}</b></div><button class="btn" data-action="resume">▶ KEEP FALLING</button><button class="btn ghost" data-action="restart">↻ RESTART RUN</button><button class="btn ghost" data-action="quit">⌂ BANK COINS & QUIT</button>`);}
function showResults(){if(!game)return;const g=game;setScreen('results',`<div class="heading">${g.won?'🏆 THE KIWI PREVAILS!':'💫 WHAT A TUMBLE!'}</div><div class="miniKiwi"></div><p class="introText">${g.won?'Eight worlds conquered. The roundest hero in the world!':'The adventure starts over, but your hard-earned upgrades remain.'}</p><div class="infoPanel"><h3>RUN RESULTS</h3><div class="meter">Levels cleared <strong>${g.completed} ${g.mode==='adventure'?'/ 32':''}</strong></div><div class="meter">Major bosses <strong>${g.majors}</strong></div><div class="meter">Total bosses <strong>${g.bosses}</strong></div><div class="meter">Score <strong>${Math.floor(g.score).toLocaleString()}</strong></div><div class="meter">Enemies defeated <strong>${g.kills}</strong></div><div class="meter">Coins banked <strong>🪙 ${g.coins}</strong></div><div class="meter">Time <strong>${fmtTime(g.elapsed)}</strong></div></div><div class="btnrow"><button class="btn teal" data-action="restart">↻ AGAIN</button><button class="btn" data-action="resultsShop">🛍️ SHOP</button></div><button class="btn ghost" data-action="menu">⌂ MAIN MENU</button>`);}
function finish(win=false){if(!game||game.done)return;const g=game;g.done=true;g.won=win;save.coins+=g.coins;save.totals.coins+=g.coins;save.totals.kills+=g.kills;save.totals.depth=Math.max(save.totals.depth,g.maxDepth);save.totals.runs++;if(win)save.completed=true;save.scores[g.mode].push({score:Math.floor(g.score),depth:g.maxDepth,stage:g.completed,diff:g.diff,date:Date.now()});save.scores[g.mode].sort((a,b)=>b.score-a.score);save.scores[g.mode]=save.scores[g.mode].slice(0,5);persist();showResults();sound(win?'win':'death');}
function fmtTime(seconds){const n=Math.floor(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
// Offline synthesized soundtrack and satisfying little arcade sounds.
function enableAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch{}}
function tone(freq,dur=.12,type='triangle',vol=.06,delay=0){if(!audioCtx||blurMuted||vol<=0)return;try{const osc=audioCtx.createOscillator(),amp=audioCtx.createGain(),now=audioCtx.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,now);amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(vol,now+.012);amp.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.connect(amp);amp.connect(audioCtx.destination);osc.start(now);osc.stop(now+dur+.02);}catch{}}
function sound(id){const v=save.settings.sfx;if(v<=0)return;const a=(freq,d=.1,typ='triangle',vol=.08,when=0)=>tone(freq,d,typ,vol*v,when);switch(id){case'egg':a(620,.07,'square',.035);a(460,.1,'triangle',.03,.03);break;case'coin':a(760,.12,'sine');a(1120,.17,'triangle',.07,.07);break;case'jump':a(350,.12,'triangle',.06);a(460,.08,'sine',.05,.04);break;case'hurt':a(200,.24,'sawtooth',.095);a(124,.28,'triangle',.07,.06);break;case'stomp':a(170,.12,'triangle',.14);a(440,.15,'sine',.06,.07);break;case'boss':a(132,.32,'sawtooth',.1);a(204,.3,'square',.065,.1);break;case'power':case'purchase':a(480,.12);a(600,.13,'sine',.08,.10);a(780,.25,'triangle',.08,.21);break;case'win':for(let i=0;i<6;i++)a([480,600,720,890,1060,1380][i],.27,'triangle',.08,i*.11);break;case'death':for(let i=0;i<4;i++)a([340,270,200,110][i],.2,'triangle',.08,i*.11);break;case'gate':a(330,.16);a(470,.20,'triangle',.06,.1);break;case'land':a(185,.06,'sine',.04);break;}}
const tunes=[[0,3,5,7,10,7,5,3,0,3,7,10,7,5,3,-2],[0,4,7,11,7,4,2,0,5,7,11,12,7,4,2,-2],[0,2,5,7,9,7,5,2,0,4,7,9,12,7,4,2],[0,3,5,8,10,8,5,3,0,3,7,10,12,8,5,3],[0,2,5,9,5,2,0,-2,0,5,9,12,9,5,2,0],[0,3,7,9,7,3,0,-3,0,5,7,10,7,5,3,0],[0,2,4,7,11,7,4,2,0,4,7,12,11,7,4,2],[0,1,5,8,10,8,5,1,0,5,8,12,10,8,5,1]];
setInterval(()=>{if(!audioCtx||blurMuted||!save.settings.music||!['menu','playing','intro'].includes(screen))return;let idx=game?game.world%8:0,f=[246,220,196,185,260,185,207,164][idx],n=tunes[idx][songStep%16],v=save.settings.music;tone(f*Math.pow(2,n/12),.18,'triangle',.048*v);if(songStep%4===0)tone(f/2,.24,'sine',.049*v);songStep++;},220);
// Stages are assembled from a seed. Every world has four distinct layouts and
// a miniboss per stage. Stage four also has a major boss with multiple phases.
function makeGame(mode){enableAudio();const seed=Math.floor(Math.random()*2147483647)>>>0,base=(difficulty==='easy'?5:difficulty==='hard'?2:3)+save.upgrades.heart;
 game={mode,diff:difficulty,seed,rand:randGen(seed),p:{x:86,y:-58,w:36,h:43,vx:0,vy:0,hp:base,maxHp:base,face:1,grounded:true,coyote:0,inv:0,fireCd:0,hover:2.2,hoverMax:2.2,anim:0,squash:0,airtime:0,shield:save.upgrades.shield,stompCd:0},stage:0,world:0,generated:new Set(),platforms:[],entities:[],shots:[],enemyShots:[],particles:[],deco:[],bossesByStage:new Map(),lastBoss:null,score:0,coins:0,kills:0,bosses:0,majors:0,completed:0,maxDepth:0,elapsed:0,stageTime:0,stageDamage:0,stageKills:0,stageStart:0,stageBanner:0,notification:'',resultBanner:null,resultTime:0,combo:0,comboTimer:0,camera:-235,shake:0,flash:0,introTime:0,intro:true,finishedStages:new Set(),done:false,powers:{spread:0,rate:0,power:0,pierce:0,bounce:0,stomp:0,magnet:0,shield:0,blast:0},rewardCounter:0,pendingPowerOptions:null,worldMessage:2.6};
 if(save.start!=='none')game.powers[save.start]=1;makeStage(0);makeStage(1);setScreen('intro','');songStep=0;notify('A perfectly ordinary stroll...',2);
}
function stageToWorld(n){return Math.floor(n/4)%8;}
function stageName(n){return `${stageToWorld(n)+1}-${n%4+1}`;}
function makeStage(n){const g=game;if(!g||g.generated.has(n))return;g.generated.add(n);
 const world=stageToWorld(n),r=randGen((g.seed^Math.imul(n+1,2654435761))>>>0),start=n*STAGE,end=start+STAGE,kind=n%4;
 // Solid, stationary ledges and clearly telegraphed spikes. No surprise
 // crumbling or sliding floors: the terrain must match its appearance.
 for(let i=0;i<15;i++){
  const y=start+205+i*118+range(r,-24,26);if(y>end-810)break;
  const pat=(i+kind)%5;let ledges=[];
  if(pat===0){const x=range(r,120,210),gap=range(r,114,166);ledges.push([24,x-24],[x+gap,408-x-gap]);}
  else if(pat===1||pat===3){const width=range(r,95,177);ledges.push([pat===1?24:408-width,width]);}
  else{const w=range(r,95,155);ledges.push([range(r,55,432-w-55),w]);}
  for(const [x,w] of ledges){if(w<26)continue;const hazard=(n>0||i>5)&&r()<Math.min(.15,.045+n*.004)*(difficulty==='hard'?1.3:1);
   const b={x,y,w,h:17,kind:world,spike:hazard,move:0,origin:x,phase:0,crumble:false,crumbleTime:0};g.platforms.push(b);
   if(r()<.78)spawnItem('coin',clamp(x+range(r,12,w-12),37,396),y-29,r()>.98?2:1);
   if(r()<.16)spawnItem('fruit',x+w/2,y-35);
  }
 }
 // Individual world creatures use different behaviours, including ranged
 // shots, dive attacks, charges and horizontal pursuit.
 for(let i=0;i<13+Math.min(10,Math.floor(n/4));i++){
  const y=start+330+i*(STAGE-1180)/(13+Math.min(10,Math.floor(n/4)))+range(r,-44,44);
  if(y>end-820)break;
  const type=Math.floor(r()*4),x=range(r,68,360),ai=AI[world][type];
  spawnEnemy(world,type,x,y,ai,n,r);
 }
 for(let i=0;i<36;i++){const y=start+135+range(r,0,STAGE-970),x=range(r,62,370);spawnItem('coin',x,y,1+(r()>.91?2:0));}
 for(let i=0;i<5;i++){spawnItem(r()>.73?'heart':'fruit',range(r,60,370),start+260+range(r,0,STAGE-1240));}
 for(let i=0;i<2;i++)spawnItem('orb',range(r,95,330),start+450+range(r,0,STAGE-1350));
 for(let i=0;i<65;i++){g.deco.push({x:r()<.5?range(r,12,78):range(r,353,420),y:start+range(r,20,STAGE-50),sz:range(r,7,26),type:Math.floor(r()*4),world,phase:r()*TAU});}
 // Arena: spring floor launches the kiwi to a high enough altitude to fire
 // downward at the guardian. It never opens until both required bosses die.
 for(const b of [
  {x:25,y:end-683,w:110},{x:299,y:end-683,w:109},
  {x:31,y:end-492,w:94},{x:303,y:end-492,w:96},
  {x:58,y:end-289,w:76},{x:297,y:end-289,w:76},
  {x:24,y:end-27,w:384,h:27,floor:true,stage:n}
 ])g.platforms.push({...b,h:b.h||16,kind:world,arena:true});
 // Coin ring for a little risk/reward during each boss fight.
 for(let i=0;i<7;i++){const ang=i*TAU/7;spawnItem('coin',216+Math.cos(ang)*125,end-390+Math.sin(ang)*88,2);}
}
function spawnItem(type,x,y,value=1){game.entities.push({type,x,y,value,phase:game.rand()*TAU,alive:true,vx:0,vy:0,age:0});}
function spawnEnemy(world,type,x,y,ai,stage,rand){const g=game;g.entities.push({type:'enemy',id:ENEMIES[world][type],world,variant:type,x,y,homeX:x,homeY:y,vx:0,vy:0,w:38,h:38,hp:2+Math.floor(stage/4)*.48+(difficulty==='hard'?1:0),maxHp:2+Math.floor(stage/4)*.48+(difficulty==='hard'?1:0),alive:true,phase:range(rand,0,TAU),ai,attack:range(rand,1.5,3.8),charge:0,telegraph:0,blink:0,hitFlash:0,t:range(rand,0,10),spawned:false});}
function spawnBoss(stage,major=false){const g=game,key=stage+':'+(major?'major':'mini');if(g.bossesByStage.has(key))return;const w=stageToWorld(stage),end=(stage+1)*STAGE;
 const baseHP=major?(70+w*27):(32+w*12+stage%4*7);
 const scale=difficulty==='easy'?.68:difficulty==='hard'?1.40:1;
 const hp=Math.round(baseHP*scale);
 const b={stage,world:w,major,variant:stage%4,key,x:216,y:end-(major?410:415),homeY:end-415,w:major?128:82,h:major?113:72,alive:true,hp,maxHp:hp,phase:0,attackTimer:major?2.1:1.5,attackCount:0,telegraph:0,attackType:'',inv:0,flash:0,age:0,dir:1,shieldTime:0,spawnTimer:0,exposed:0};
 g.bossesByStage.set(key,b);g.lastBoss=b;g.shake=5;g.worldMessage=0;notify((major?'⚠ MAJOR BOSS: ':'⚔ MINIBOSS: ')+(major?worlds[w].boss:miniName(w,stage%4)),2.1);sound('boss');
}
function miniName(w,variant){return [['Tunnel Crusher','Dirtshaker','Rock Hurler','Burrow Bruiser'],['Spore Baron','Moth Knight','Fungal Fiend','Glow Guardian'],['Gem Sentinel','Quartz Knight','Prism Shooter','Crystal Warden'],['Ember Brute','Pyro Mantis','Magma Lobber','Inferno Imp'],['Frost Fang','Snow Warden','Hail Bringer','Ice Colossus'],['Bone Stalker','Fossil Fiend','Skull Baron','Ancient Guardian'],['Copper Crusher','Sentry MK-II','Gearslinger','Iron Guardian'],['Void Whisper','Abyss Phantom','Night Stalker','Dark Emissary']][w][variant];}
function stageBoss(stage,major){return game.bossesByStage.get(stage+':'+(major?'major':'mini'));}
function activeBoss(stage){const a=stageBoss(stage,false),b=stageBoss(stage,true);return a?.alive?a:b?.alive?b:null;}
function floorOpen(stage){const mini=stageBoss(stage,false);if(!mini||mini.alive)return false;if(stage%4===3){const major=stageBoss(stage,true);return major&&!major.alive;}return true;}
function stageCleared(stage){const g=game;if(g.finishedStages.has(stage))return;g.finishedStages.add(stage);g.completed++;
 const time=g.stageTime;const target=Math.max(30,76-stageToWorld(stage)*2);
 const fast=time<=target;const flawless=g.stageDamage===0;const pacifist=g.stageKills===0;
 const speed=fast?Math.round(Math.max(8,23-time*.13)):0,health=flawless?16:0,peace=pacifist?24:0;
 const coinBonus=speed+health+peace,pointBonus=coinBonus*45;
 g.coins+=coinBonus;g.score+=pointBonus+1500;
 g.resultBanner={stage:stageName(stage),time:fmtTime(time),fast,flawless,pacifist,coinBonus,pointBonus};g.resultTime=3.8;
 notify(`STAGE ${stageName(stage)} CLEAR • +${coinBonus} bonus coins!`,2.2);sound('gate');
}
function enterStage(stage){const g=game;g.stage=stage;g.world=stageToWorld(stage);g.stageTime=0;g.stageDamage=0;g.stageKills=0;g.combo=0;g.p.hover=g.p.hoverMax;g.worldMessage=2.6;g.stageStart=stage*STAGE;g.p.hp=Math.min(g.p.maxHp,g.p.hp+(stage%4===0&&stage>0?1:0));
 makeStage(stage+1);notify(`${worlds[g.world].icon} ${worlds[g.world].name} · LEVEL ${stage%4+1}/4`,2);if(stage%4===0&&stage>0)choosePower();
 // Cull stale objects from stages fully above the camera to keep mobile fast.
 const min=(stage-2)*STAGE;g.platforms=g.platforms.filter(p=>p.y>min);g.entities=g.entities.filter(e=>e.y>min&&e.alive);g.deco=g.deco.filter(d=>d.y>min);g.enemyShots=g.enemyShots.filter(s=>s.y>min-100);for(const [k,b] of g.bossesByStage)if(b.stage<stage-2)g.bossesByStage.delete(k);
}
function choosePower(source='world'){
 const g=game;if(!g||g.done||g.pendingPowerOptions)return;
 const shuffled=[...buffs];
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(g.rand()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const pool=shuffled.slice(0,3);
 g.pendingPowerOptions=pool.map(b=>b.id);
 g.rewardCounter++;
 const fromPickup=source==='pickup';
 setScreen('upgrade',`<div class="heading">${fromPickup?'💎 MYSTERY PICKUP':'✨ KIWI POWER-UP'}</div><div class="miniKiwi"></div><p class="introText">${fromPickup?'You found a glowing power crystal!':'A new world means a new trick!'}<br><b>Choose ONE of these three random upgrades.</b></p><div role="group" aria-label="Choose one of three upgrades">${pool.map((b,i)=>`<button type="button" class="upgradeCard" data-pick="${b.id}" aria-label="Choose ${b.name}"><span class="upbadge">${b.icon}</span><b>${i+1}. ${b.name}</b><span>${b.desc}</span></button>`).join('')}</div><div class="note">The game is paused until you choose. Your power lasts for this run, and upgrades can stack.</div>`);
}
function applyPower(id){const g=game;if(!g||screen!=='upgrade'||!g.pendingPowerOptions?.includes(id))return;
 g.pendingPowerOptions=null;
 if(id==='health'){g.p.maxHp++;g.p.hp=Math.min(g.p.maxHp,g.p.hp+2);}else if(id==='shield'){g.p.shield+=2;}else g.powers[id]=(g.powers[id]||0)+1;
 g.score+=250;
 setScreen('playing');notify('✨ '+(buffs.find(x=>x.id===id)?.name||'POWER UP'),1.4);sound('power');}
function particles(x,y,color,count=10,force=120){const g=game;if(!g)return;for(let i=0;i<count;i++){const a=Math.random()*TAU,s=range(Math.random,20,force);g.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,t:0,life:range(Math.random,.35,.8),size:range(Math.random,2,5),color});}}
function addEnemyBullet(x,y,vx,vy,r=6,color='#ff9db6',damage=1,life=3.7){const g=game;if(g.enemyShots.length>190)return;g.enemyShots.push({x,y,vx,vy,r,color,damage,life,phase:Math.random()*TAU});}
function aimShot(x,y,toX,toY,speed,r=6,color='#ffa4ad',spread=0){const a=Math.atan2(toY-y,toX-x)+spread;addEnemyBullet(x,y,Math.cos(a)*speed,Math.sin(a)*speed,r,color);}
function bulletFan(x,y,angle,count,speed,spread,color,r=6){for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;addEnemyBullet(x,y,Math.cos(a)*speed,Math.sin(a)*speed,r,color);}}
function radial(x,y,count,speed,angle,color,r=6){for(let i=0;i<count;i++){let a=i*TAU/count+angle;addEnemyBullet(x,y,Math.cos(a)*speed,Math.sin(a)*speed,r,color);}}
function hitPlayer(damage=1){const g=game,p=g?.p;if(!p||g.done||p.inv>0||screen!=='playing')return;
 if(p.shield>0){p.shield--;p.inv=.7;particles(p.x,p.y,'#a2e4eb',14,140);notify('🛡️ SHELL BLOCKED IT!',.65);sound('hurt');return;}
 p.hp-=damage;p.inv=1.3;p.vy=-230;p.vx+=Math.random()<.5?-120:120;g.stageDamage+=damage;g.shake=12;g.flash=.22;p.squash=.28;particles(p.x,p.y,'#f5a09e',17,155);sound('hurt');if(p.hp<=0)finish(false);
}
function collect(e){const g=game,p=g.p;e.alive=false;
 if(e.type==='coin'){g.coins+=e.value;g.score+=e.value*24;sound('coin');particles(e.x,e.y,'#ffe490',4,58);}
 else if(e.type==='heart'){p.hp=Math.min(p.maxHp,p.hp+1);g.score+=75;notify('❤️ HEART RESTORED',.8);sound('power');}
 else if(e.type==='fruit'){p.hp=Math.min(p.maxHp,p.hp+1);p.hover=p.hoverMax;g.score+=55;particles(e.x,e.y,'#b1ed9e',8,85);}
 else if(e.type==='orb'){sound('power');choosePower('pickup');}
}
function killEnemy(e,byStomp=false,fromBoss=false){if(!e.alive)return;const g=game;e.alive=false;g.kills++;if(!fromBoss)g.stageKills++;g.score+=110+Math.min(12,g.combo)*40;g.combo=Math.min(12,g.combo+1);g.comboTimer=3.2;particles(e.x,e.y,worlds[e.world].accent,15,135);sound(byStomp?'stomp':'coin');
 if(g.rand()<.8)for(let i=0;i<1+Number(g.rand()>.6);i++)spawnItem('coin',e.x+range(g.rand,-21,21),e.y-range(g.rand,1,26),1);
}
function hurtEnemy(e,dmg){if(!e.alive)return;e.hp-=dmg;e.hitFlash=.12;particles(e.x,e.y,'#ffe7af',3,55);if(e.hp<=0)killEnemy(e);}
function bossDamage(b,dmg){if(!b.alive||b.inv>0)return;b.hp-=dmg;b.inv=.055;b.flash=.12;game.shake=Math.max(game.shake,3);particles(b.x+range(Math.random,-32,32),b.y+range(Math.random,-22,22),'#fff0bf',4,95);if(b.hp<=0)defeatBoss(b);}
function defeatBoss(b){const g=game;b.alive=false;g.bosses++;g.score+=b.major?10500+g.world*1800:2800+g.world*400;particles(b.x,b.y,worlds[b.world].accent,55,265);sound('win');g.shake=15;
 for(let i=0;i<(b.major?30:15);i++)spawnItem('coin',b.x+range(g.rand,-120,120),b.y+range(g.rand,-80,80),b.major?2:1);
 // Boss-created enemies are optional threats: exempt from pacifist scoring if
 // a boss required their defeat to proceed (they never are).
 if(b.major){g.majors++;notify('🏆 '+worlds[b.world].boss+' DEFEATED!',2.7);}
 else if(b.stage%4===3){notify('⚠️ WORLD GUARDIAN APPROACHES...',2);g.enemyShots.length=0;g.p.hover=g.p.hoverMax;g.p.inv=1.1;g.p.y=Math.min(g.p.y,(b.stage+1)*STAGE-750);g.p.vy=-155;spawnBoss(b.stage,true);}
 else notify('⚔ MINIBOSS DEFEATED! GATE OPEN!',1.9);
 if(b.major||b.stage%4!==3)stageCleared(b.stage);
}
function fireEgg(){const g=game,p=g.p,rate=Math.max(.095,.255-.027*save.upgrades.rate-.027*g.powers.rate);
 if(p.fireCd>0)return;p.fireCd=rate;
 const n=1+Math.min(4,(g.powers.spread||0)*2),dmg=1+.48*save.upgrades.damage+.52*g.powers.power;
 for(let i=0;i<n;i++){const offset=i-(n-1)/2;g.shots.push({x:p.x+offset*10,y:p.y+18,vx:offset*75,vy:690+Math.max(0,p.vy*.27),r:7,life:2.4,damage:dmg,pierce:g.powers.pierce>0,bounces:g.powers.bounce>0?1:0,blast:g.powers.blast>0,hit:new Set()});}
 if(!p.grounded&&p.hover>0){if(p.vy>-90)p.vy=Math.max(-90,p.vy-(36+save.upgrades.rate*6+g.powers.rate*8));p.squash=Math.max(p.squash,.14);}
 particles(p.x,p.y+24,'#fff0c8',2,52);sound('egg');
}
// Responsive physics at a fixed timestep. Acceleration, deceleration, jump
// buffering, coyote time and gentle camera tracking avoid the old jitter.
function update(dt){const g=game;if(!g||g.done)return;const p=g.p;
 if(screen==='intro'){g.introTime+=dt;
  if(g.introTime<2.0){p.x=87+g.introTime*37;p.y=-58+Math.sin(g.introTime*11)*2;p.vy=0;}
  else{if(g.intro){g.intro=false;g.shake=16;particles(p.x,-7,'#b58c60',33,180);sound('boss');notify('OH NOOOO! 🥝',1.8);}setScreen('playing');p.y=-10;p.vy=80;p.inv=2.2;}
  return;
 }
 if(screen!=='playing')return;
 g.elapsed+=dt;g.stageTime+=dt;g.worldMessage=Math.max(0,g.worldMessage-dt);g.resultTime=Math.max(0,g.resultTime-dt);g.shake=Math.max(0,g.shake-31*dt);g.flash=Math.max(0,g.flash-1.6*dt);
 g.comboTimer=Math.max(0,g.comboTimer-dt);if(!g.comboTimer)g.combo=0;
 p.anim+=dt;p.inv=Math.max(0,p.inv-dt);p.fireCd=Math.max(0,p.fireCd-dt);p.stompCd=Math.max(0,p.stompCd-dt);p.squash=Math.max(0,p.squash-dt*3.5);
 jumpBuffered=Math.max(0,jumpBuffered-dt);
 const input=Number(keys.right)-Number(keys.left),speed=245+(difficulty==='easy'?7:0),accel=p.grounded?2600:1650;
 const target=input*speed;p.vx+=(clamp(target-p.vx,-accel*dt,accel*dt));if(!input)p.vx*=Math.exp(-dt*(p.grounded?11:3.8));
 if(input)p.face=input;
 p.x=clamp(p.x+p.vx*dt,42,390);
 // Jump after landing even if the button was pressed a fraction early.
 if(jumpBuffered>0&&(p.grounded||p.coyote>0)){
  p.vy=-535-(save.upgrades.boots*22);p.grounded=false;p.coyote=0;jumpBuffered=0;p.squash=.19;p.hover=p.hoverMax;sound('jump');particles(p.x,p.y+23,'#ead9ad',5,90);
 }
 if(!keys.jump&&p.vy<-245)p.vy+=GRAV*.28*dt;
 const prevY=p.y,prevBottom=p.y+p.h*.42;
 const wasGround=p.grounded;p.grounded=false;p.vy=Math.min(MAXFALL,p.vy+GRAV*dt);
 if(keys.shoot){fireEgg();if(p.hover>0&&p.vy>30){p.vy=Math.max(25,p.vy-(950+65*g.powers.rate)*dt);p.hover=Math.max(0,p.hover-dt*(.85+.07*g.powers.rate));}}
 p.y+=p.vy*dt;
 // Platform interactions; boss floor always has a spring bounce while locked.
 for(const platform of g.platforms){if(platform.y>p.y+75||platform.y<p.y-95)continue;
  const px=platform.x; // Stationary: never slip away as the kiwi lands.
  let left=px,right=px+platform.w;
  if(platform.floor&&floorOpen(platform.stage)&&p.x>155&&p.x<277)continue;
  if(p.vy>=0&&prevBottom<=platform.y+5&&p.y+p.h*.42>=platform.y&&p.x+p.w*.36>left&&p.x-p.w*.36<right){
   p.y=platform.y-p.h*.42;
   if(platform.floor&&!floorOpen(platform.stage)){
    p.vy=-1290-(save.upgrades.boots*25)-g.powers.stomp*25;p.grounded=false;p.hover=p.hoverMax;p.squash=.3;g.shake=Math.max(g.shake,2);sound('jump');
    particles(p.x,platform.y,'#87d7dc',10,145);
   }else{
    if(!wasGround&&prevY<p.y-5){p.squash=.2;sound('land');}
    p.vy=0;p.grounded=true;p.coyote=.13;p.hover=p.hoverMax;
    if(platform.spike)hitPlayer(1); // Spike tops damage on landing or while walking across.
    // A landed platform stays where it is until the level is cleared.
   }
   break;
  }
 }
 if(!p.grounded)p.coyote=Math.max(0,p.coyote-dt);
 // Keep the kiwi inside the currently locked arena.
 const stageEnd=(g.stage+1)*STAGE;
 if(p.y>=stageEnd-880&&!stageBoss(g.stage,false))spawnBoss(g.stage,false);
 if(p.y>stageEnd+28){
  if(floorOpen(g.stage)){
   const was=g.stage;stageCleared(was);
   if(g.mode==='adventure'&&was===31){finish(true);return;}
   enterStage(was+1);
   if(screen!=='playing')return;
  }else{p.y=stageEnd-60;p.vy=-850;}
 }
 g.maxDepth=Math.max(g.maxDepth,p.y);
 g.score+=Math.max(0,p.vy)*dt*.012;
 if(g.generated.size<g.stage+2)makeStage(g.stage+1);
 const aimCam=p.y-235;
 g.camera=mix(g.camera,aimCam,1-Math.exp(-dt*6.1));g.camera=Math.max(-245,g.camera);
 // World hazards are readable and tied to the theme; don't spam a safe area.
 if(g.stage>0&&Math.floor(g.elapsed*1.9)!==Math.floor((g.elapsed-dt)*1.9)&&g.rand()<.14+g.world*.015){
  const w=g.world;if(w===4&&g.rand()<.6){addEnemyBullet(clamp(p.x+range(g.rand,-100,100),37,395),p.y-440,0,200,9,'#b9f7ff',1,3.5);}
  else if(w===6&&g.rand()<.6){addEnemyBullet(g.rand()<.5?40:392,p.y+range(g.rand,-90,120),p.x>216?235:-235,0,6,'#ffcf8c',1,3);}
  else if(w===7&&g.rand()<.7)aimShot(range(g.rand,40,392),p.y-300,p.x,p.y,175,6,'#e7a8ff');
 }
 updateEntities(dt,prevBottom);if(g.done||screen!=='playing')return;
 updateBosses(dt,prevBottom);if(g.done)return;
 updateShots(dt);if(g.done)return;
 updateEnemyShots(dt);if(g.done)return;
 for(const q of g.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=390*dt;q.t+=dt;}
 g.particles=g.particles.filter(q=>q.t<q.life).slice(-250);
 g.shots=g.shots.filter(s=>s.life>0).slice(-120);
 g.enemyShots=g.enemyShots.filter(s=>s.life>0).slice(-190);
}
function updateEntities(dt,oldBottom){const g=game,p=g.p;
 for(const e of g.entities){if(!e.alive||Math.abs(e.y-p.y)>900)continue;e.age+=dt;e.phase+=dt*(e.type==='enemy'?1.8:2.2);
  if(e.type==='enemy'){
   e.hitFlash=Math.max(0,e.hitFlash-dt);const dx=p.x-e.x,dy=p.y-e.y,distance=Math.hypot(dx,dy);
   e.attack-=dt;e.telegraph=Math.max(0,e.telegraph-dt);e.blink=Math.max(0,e.blink-dt);e.charge=Math.max(0,e.charge-dt);
   if(e.ai==='pursuer'){e.vx+=clamp(dx*2.4-e.vx,-480*dt,480*dt);e.vy+=clamp(dy*.85-e.vy,-350*dt,350*dt);e.vy=clamp(e.vy,-90,90);}
   else if(e.ai==='zigzag'){e.vx=Math.sin(e.phase*2.4)*85+(distance<290?Math.sign(dx)*35:0);e.vy=Math.cos(e.phase*1.2)*23;}
   else if(e.ai==='diver'){
    e.vx=Math.sin(e.phase*2.7)*55;
    if(e.charge>0){e.vx=e.chargeVX;e.vy=e.chargeVY;}
    else if(distance<300&&e.attack<=0){e.telegraph=.43;e.attack=3.2;e.charge=.55;let a=Math.atan2(dy,dx);e.chargeVX=Math.cos(a)*225;e.chargeVY=Math.sin(a)*225;}
    else e.vy=Math.sin(e.phase*1.8)*19;
   }
   else if(e.ai==='charger'){e.vx=e.charge>0?e.chargeVX:Math.sin(e.phase*1.2)*29;e.vy=Math.sin(e.phase)*12;
    if(distance<310&&e.attack<=0){e.charge=.72;e.chargeVX=Math.sign(dx)*220;e.attack=3.2;e.telegraph=.30;}
   }
   else if(e.ai==='teleport'){e.vx=Math.sin(e.phase)*28;e.vy=0;
    if(distance<400&&e.attack<=0){e.blink=.2;e.x=clamp(p.x+range(g.rand,-120,120),45,385);e.y=p.y+range(g.rand,-110,150);e.attack=4;particles(e.x,e.y,'#c89ceb',8,100);}
   }
   else{e.vx=Math.sin(e.phase)*18;e.vy=Math.sin(e.phase*1.5)*14;}
   if(e.attack<=0&&distance<360&&e.ai!=='diver'&&e.ai!=='charger'&&e.ai!=='teleport'){
    e.attack=(e.ai==='burst'?1.65:e.ai==='turret'?1.8:2.4)*clamp(1-g.world*.045,.62,1)+(g.rand()*.4);
    let spd=158+g.world*13+(difficulty==='hard'?30:0);
    const col=worlds[e.world].accent;
    if(e.ai==='burst')bulletFan(e.x,e.y,Math.atan2(dy,dx),3,spd,.22,col,5);
    else if(e.ai==='lobber'){aimShot(e.x,e.y,p.x,p.y,spd*.88,8,col,-.16);aimShot(e.x,e.y,p.x,p.y,spd*.88,8,col,.16);}
    else aimShot(e.x,e.y,p.x,p.y,spd,6,col);
    particles(e.x,e.y,col,3,35);
   }
   e.x=clamp(e.x+e.vx*dt,44,388);e.y=clamp(e.y+e.vy*dt,e.homeY-140,e.homeY+135);
   if(Math.abs(p.x-e.x)<p.w*.4+e.w*.38&&Math.abs(p.y-e.y)<p.h*.4+e.h*.37){
    if(p.vy>90&&oldBottom<e.y-e.h*.20&&p.stompCd<=0){
     hurtEnemy(e,2.2+save.upgrades.boots*.7+g.powers.stomp*1.5);p.vy=-420-save.upgrades.boots*35-g.powers.stomp*50;p.hover=p.hoverMax;p.stompCd=.22;p.squash=.24;particles(e.x,e.y,'#ffeac9',13,145);sound('stomp');
    }else hitPlayer(1);
   }
  }else{
   if(e.vy||e.vx){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy=Math.min(300,e.vy+260*dt);e.vx*=.988;}
   if(e.type==='coin'){const radius=62+save.upgrades.magnet*44+g.powers.magnet*65,dist=Math.hypot(p.x-e.x,p.y-e.y);if(dist<radius){e.x+=(p.x-e.x)*Math.min(1,dt*8*(1-dist/radius+.2));e.y+=(p.y-e.y)*Math.min(1,dt*8*(1-dist/radius+.2));}}
   if(Math.abs(p.x-e.x)<24&&Math.abs(p.y-e.y)<31){collect(e);if(screen!=='playing')return;}
  }
 }
}
function bossAttack(b){const g=game,p=g.p,w=b.world,health=b.hp/b.maxHp,phase=health>.66?0:health>.33?1:2,late=w>=5,hell=w>=6;
 const col=['#ffc18b','#dfaaed','#9feaf1','#ff967a','#abecfb','#efdba8','#f6c78e','#e9a0ff'][w];
 const aim=Math.atan2(p.y-b.y,p.x-b.x),speed=175+w*10+(difficulty==='hard'?35:0),modifier=b.major?1.0:.82;
 const burst=hell?(phase===2?17:13):late?11:7;
 const style=b.attackCount%((b.major?5:3));b.attackCount++;
 if(style===0){ // aimed fan that becomes a screen-spanning bullet curtain
  bulletFan(b.x,b.y,aim,b.major?4+phase*2:3+phase,speed*modifier,.16+phase*.02,col,6);
  if(phase===2&&b.major)bulletFan(b.x,b.y,aim+.12,4,speed*.85,.22,col,5);
 }else if(style===1){radial(b.x,b.y,b.major?burst:6+phase*2,speed*.64,b.phase*.28,col,6);}
 else if(style===2){for(let i=0;i<3+phase+(late?2:0);i++){
   let a=Math.PI*1.5+((i-(2+phase)*.5)*.20)+Math.sin(b.age*1.5)*.24;
   addEnemyBullet(b.x+Math.sin(b.age*3+i)*20,b.y,Math.cos(a)*speed*.95,Math.sin(a)*speed*.95,6,col);
  }}
 else if(style===3){const count=hell?12:8;for(let i=0;i<count;i++){const a=i*TAU/count+b.age*.55;addEnemyBullet(b.x,b.y,Math.cos(a)*speed*.8,Math.sin(a)*speed*.8,6,col);}if(hell)bulletFan(b.x,b.y,aim,5,speed,0.15,col,5);}
 else if(style===4){const count=hell?17:11;for(let i=0;i<count;i++){const a=-Math.PI+i*Math.PI/(count-1);addEnemyBullet(b.x,b.y,Math.cos(a)*speed*.75,Math.sin(a)*speed*.75,5,col);} }
 b.attackTimer=(b.major?(hell?1.22:late?1.55:1.95):(hell?1.55:2.12))-phase*.12+(g.rand()*.25);
 if(b.major&&phase>=1&&b.attackCount%4===0){const n=phase===2&&late?2:1;for(let i=0;i<n;i++){
   if(g.entities.filter(e=>e.alive&&e.type==='enemy'&&Math.abs(e.y-b.y)<450).length>7)break;
   const rr=randGen((g.seed+Math.floor(b.age*100)+i*53)>>>0),typ=(b.attackCount+i)%4;
   spawnEnemy(w,typ,clamp(b.x+range(rr,-140,140),62,370),b.y-180,AI[w][typ],b.stage,rr);
  }
 }
}
function updateBosses(dt,oldBottom){const g=game,p=g.p;
 for(const b of g.bossesByStage.values()){
  if(!b.alive||Math.abs(p.y-b.y)>1050)continue;
  b.age+=dt;b.phase+=dt;b.inv=Math.max(0,b.inv-dt);b.flash=Math.max(0,b.flash-dt);b.telegraph=Math.max(0,b.telegraph-dt);
  const phase=b.hp/b.maxHp>.66?0:b.hp/b.maxHp>.33?1:2;
  b.x=216+Math.sin(b.age*(b.major?.72:.87)+b.stage*.8)*(b.major?85:91);
  b.y=b.homeY+Math.sin(b.age*(b.major?1.6:2))*28;
  if(b.age>.8){b.attackTimer-=dt;
   if(b.attackTimer<.40)b.telegraph=.40;
   if(b.attackTimer<=0){bossAttack(b);b.telegraph=.24;particles(b.x,b.y,worlds[b.world].accent,8,105);}
  }
  const dx=Math.abs(p.x-b.x),dy=Math.abs(p.y-b.y);
  if(dx<p.w*.37+b.w*.35&&dy<p.h*.37+b.h*.37){
   if(p.vy>105&&oldBottom<b.y-b.h*.19&&p.stompCd<=0){bossDamage(b,3+save.upgrades.boots*.6+g.powers.stomp*1.5);p.vy=-520-g.powers.stomp*30;p.hover=p.hoverMax;p.stompCd=.26;p.squash=.26;sound('stomp');particles(p.x,p.y,'#ffe2ab',14,145);}
   else hitPlayer(1);
  }
 }
}
function explodeEgg(s,x,y){const g=game;if(!s.blast)return;particles(x,y,'#ffdc83',16,140);g.shake=Math.max(g.shake,2);
 for(const e of g.entities)if(e.alive&&e.type==='enemy'&&Math.hypot(e.x-x,e.y-y)<53)hurtEnemy(e,s.damage*.6);
 for(const b of g.bossesByStage.values())if(b.alive&&Math.hypot(b.x-x,b.y-y)<90)bossDamage(b,s.damage*.45);
}
function updateShots(dt){const g=game;
 for(const s of g.shots){if(s.life<=0)continue;const oldY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  if(s.x<20||s.x>412){s.life=0;continue;}
  for(const platform of g.platforms){if(s.life<=0)break;if(Math.abs(platform.y-s.y)>32||s.x<platform.x||s.x>platform.x+platform.w)continue;
   if(s.y+s.r>=platform.y&&oldY-s.r<=platform.y+platform.h){if(s.bounces>0){s.vy=-Math.abs(s.vy)*.72;s.bounces--;s.life=Math.min(s.life,.8);}else{s.life=0;explodeEgg(s,s.x,s.y);}break;}
  }
  for(const e of g.entities){if(s.life<=0)break;if(!e.alive||e.type!=='enemy'||s.hit.has(e))continue;
   if(Math.abs(e.x-s.x)<e.w*.42+s.r&&Math.abs(e.y-s.y)<e.h*.42+s.r){s.hit.add(e);hurtEnemy(e,s.damage);explodeEgg(s,s.x,s.y);if(!s.pierce)s.life=0;}
  }
  for(const b of g.bossesByStage.values()){if(s.life<=0)break;if(!b.alive||s.hit.has(b))continue;
   if(Math.abs(b.x-s.x)<b.w*.37+s.r&&Math.abs(b.y-s.y)<b.h*.39+s.r){s.hit.add(b);bossDamage(b,s.damage);explodeEgg(s,s.x,s.y);if(!s.pierce)s.life=0;}
  }
 }
}
function updateEnemyShots(dt){const g=game,p=g.p;
 for(const s of g.enemyShots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  if(s.x<8||s.x>W-8||Math.abs(s.y-p.y)>800){s.life=0;continue;}
  if(Math.abs(s.x-p.x)<p.w*.35+s.r&&Math.abs(s.y-p.y)<p.h*.37+s.r){hitPlayer(s.damage);s.life=0;}
 }
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function spr(image,sx,sy,sw,sh,x,y,w,h,flip=false,opacity=1){if(!image||!image.complete||!image.naturalWidth)return;
 ctx.save();ctx.globalAlpha=opacity;if(flip){ctx.translate(Math.round(x+w),Math.round(y));ctx.scale(-1,1);ctx.drawImage(image,sx,sy,sw,sh,0,0,Math.round(w),Math.round(h));}else ctx.drawImage(image,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.restore();}
function circle(x,y,r,fill,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function line(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function background(world,camera){const bg=img['bg'+(world%8)],offset=((camera*.23)%864+864)%864;
 if(bg?.complete&&bg.naturalWidth){ctx.drawImage(bg,0,-offset,432,864);ctx.drawImage(bg,0,864-offset,432,864);}else rect(0,0,432,720,'#172439');
 const col=worlds[world%8].accent;ctx.save();ctx.globalAlpha=.10;const grad=ctx.createLinearGradient(0,0,0,720);grad.addColorStop(0,'transparent');grad.addColorStop(.75,col);grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.fillRect(0,0,432,720);ctx.restore();
 // Subtle pixel dust and luminescence drifting at different speeds.
 for(let i=0;i<30;i++){const x=(i*151+((i%3)-1)*clock*(8+i%4*7)+2500)%432;
 const y=((i*103-clock*(7+i%5*4)-camera*.11)%790+790)%790-35;
 ctx.globalAlpha=(.18+.25*Math.sin(clock*1.2+i));rect(x,y,(i%3)+1,(i%4)+1,col);}
 ctx.globalAlpha=1;
}
function drawDeco(d,camera){const y=d.y-camera;if(y<-60||y>785)return;
 const c=worlds[d.world].accent,s=d.sz,x=d.x;
 ctx.save();ctx.globalAlpha=.42;
 if(d.type===0){line(x,y,x+s*.35,y-s*1.8,c,3);line(x,y-8,x-s*.5,y-s,c,2);circle(x+s*.35,y-s*1.8,4,c,.8);}
 else if(d.type===1){const rock='#82939d';rect(x-s*.36,y-s*.45,s*.68,3,rock);rect(x-s*.1,y-s*.23,s*.45,2,rock);rect(x-s*.46,y-s*.02,s*.5,2,rock);}
 else if(d.type===2){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,s*.7,Math.PI*.45,Math.PI*1.8);ctx.stroke();circle(x,y,2,'#8096a2',.5);}
 else{circle(x,y,s*.35,c,.12);circle(x,y,2,c);}
 ctx.restore();
}
function drawPlatform(b,camera){const y=b.y-camera;if(y<-36||y>745)return;
 const world=b.kind%8,info=worlds[world];let x=b.x;
 const open=b.floor&&floorOpen(b.stage),base=b.floor?25:b.h;
 const drawPart=(xx,ww)=>{if(ww<=0)return;
  ctx.save();ctx.beginPath();ctx.rect(xx,y,ww,base);ctx.clip();
  const strip=world%4;
  if(img.tiles?.naturalWidth){for(let k=xx-((xx%64)+64)%64;k<xx+ww;k+=64)spr(img.tiles,0,strip*64,512,64,k,y,512,64);}
  else{rect(xx,y,ww,base,info.color);rect(xx,y,ww,5,info.accent);}
  ctx.restore();rect(xx,y+base-4,ww,4,'#16243db0');rect(xx,y,ww,3,info.accent+'99');
  if(world>=4){for(let i=xx+7;i<xx+ww-5;i+=25){if(world===4)rect(i,y+5,9,2,'#d5f8fa');else if(world===5)rect(i,y+5,5,3,'#ffe4a8');else if(world===6)circle(i,y+7,3,'#f7cf83');else rect(i,y+5,8,2,'#c88bea');}}
  if(b.spike){
   // Distinct red/orange hazard rail under a row of triangular SHARP spikes.
   rect(xx,y-3,ww,5,'#9f344d');rect(xx,y-1,ww,2,'#ffd8a2');
   for(let a=xx+5;a<xx+ww-9;a+=14){
    ctx.fillStyle='#f75e63';ctx.strokeStyle='#4d283b';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(a,y);ctx.lineTo(a+7,y-17);ctx.lineTo(a+14,y);ctx.closePath();ctx.fill();ctx.stroke();
    line(a+7,y-13,a+7,y-5,'#ffceaa',1);
   }
  }
 };
 if(open){drawPart(x,Math.max(0,151-x));drawPart(278,x+b.w-278);circle(216,y+12,16,'#a1f5ce',.18);}
 else{drawPart(x,b.w);if(b.floor){for(let i=0;i<7;i++){const xx=x+38+i*50;line(xx,y+4+Math.sin(clock*10+i)*2,xx+12,y+4+Math.sin(clock*10+i)*2,'#d6fff1',2);}rect(169,y,94,8,'#f9d487');ctx.textAlign='center';ctx.font='bold 9px Trebuchet MS';ctx.fillStyle='#263748';ctx.fillText('BOUNCE!',216,y+7);ctx.textAlign='left';}}
}
function drawEntity(e,camera){const y=e.y-camera;if(y<-115||y>800||!e.alive)return;const x=e.x,oy=Math.sin(clock*3+e.phase)*3;
 if(e.type==='enemy'){
  const size=e.w*1.95,im=e.id<12?img.enemies:img.enemies2,idx=e.id<12?e.id:e.id-12;
  if(e.telegraph>0){circle(x,y,25,'#ffa7aa',.17);ctx.strokeStyle='#ffad9a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,26+e.telegraph*10,0,TAU);ctx.stroke();}
  if(e.blink>0)ctx.globalAlpha=.4;
  spr(im,idx*96,0,96,96,x-size/2,y+oy-size/2,size,size,false,e.hitFlash>0?.48:1);
  ctx.globalAlpha=1;
  if(e.maxHp>2&&e.hp<e.maxHp){rect(x-15,y-30,30,4,'#33334c');rect(x-15,y-30,30*e.hp/e.maxHp,4,'#efbc92');}
  return;
 }
 if(e.type==='orb'){circle(x,y+oy,29,'#a2e5ea',.22+.08*Math.sin(clock*4));circle(x,y+oy,20,'#c5faff',.12);ctx.textAlign='center';ctx.font='bold 11px Trebuchet MS';ctx.fillStyle='#fff9db';ctx.fillText('CHOOSE',x,y+oy-30);ctx.textAlign='left';}
 const idx=e.type==='coin'?0:e.type==='heart'?1:e.type==='fruit'?3:4;
 const sz=e.type==='coin'?23:e.type==='orb'?36:27;
 spr(img.items,idx*64,0,64,64,x-sz/2,y+oy-sz/2,sz,sz);
 if(e.type==='coin'&&e.value>=2){ctx.font='bold 9px Trebuchet MS';ctx.fillStyle='#fff4cf';ctx.fillText('+'+e.value,x+8,y-8);}
}
function drawBoss(b,camera){const y=b.y-camera;if(!b.alive||y<-175||y>895)return;const x=b.x,w=b.world,major=b.major;
 const sz=major?168:112,glow=worlds[w].accent;
 circle(x,y,sz*.55,glow,.14+.035*Math.sin(clock*3));
 ctx.save();ctx.strokeStyle=glow;ctx.globalAlpha=.25;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,sz*.59,sz*.44,0,0,TAU);ctx.stroke();ctx.restore();
 const art=w<4?img.boss:img.boss2,sx=(w%4)*192;
 if(major){spr(art,sx,0,192,192,x-sz/2,y-sz/2,sz,sz,false,b.flash>0?.65:1);}
 else{
  const artIndex=ENEMIES[w][b.variant],im=artIndex<12?img.enemies:img.enemies2,idx=artIndex<12?artIndex:artIndex-12;
  spr(im,idx*96,0,96,96,x-sz/2,y-sz/2,sz,sz,false,b.flash>0?.55:1);
  circle(x,y-sz*.36,8,'#ffe3a2',.8);ctx.font='bold 15px Trebuchet MS';ctx.textAlign='center';ctx.fillStyle='#412d4e';ctx.fillText('◆',x,y-sz*.35+5);ctx.textAlign='left';
 }
 if(b.telegraph>0){ctx.strokeStyle='#fff2c1';ctx.lineWidth=3;ctx.globalAlpha=.45+b.telegraph;ctx.beginPath();ctx.arc(x,y,sz*.6+(1-b.telegraph)*15,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
}
function drawPlayer(p,camera){const x=p.x,y=p.y-camera;if(p.inv>0&&Math.floor(p.inv*12)%2===0)return;
 const costume=Math.max(0,suits.findIndex(s=>s.id===save.wear));
 let frame=p.grounded?(Math.abs(p.vx)>25?Math.floor(p.anim*(5+Math.abs(p.vx)/65))%2:0):(p.vy<0?3:2);
 if(keys.shoot&&p.fireCd>.08)frame=4;
 if(p.inv>.6)frame=6;
 let stretch=p.grounded?1:clamp(1+Math.abs(p.vy)/2400,1,1.20),squish=1+Math.sin(p.squash*13)*p.squash*.35;
 const size=78,wd=size*clamp(2-stretch, .83,1.05)*squish,ht=size*stretch/squish;
 if(!p.grounded&&p.hover>.02&&keys.shoot){circle(x,y+25,27,'#fff4b4',.12);for(let i=0;i<4;i++){const sx=x+Math.sin(clock*13+i*1.6)*16,sy=y+26+i*9;rect(sx,sy,3,7,'#fff1bf88');}}
 circle(x,y+32,26,'#0b1525',.12);
 ctx.save();ctx.translate(x,y);ctx.rotate(clamp(-p.vx*.00035,-.10,.10)+(!p.grounded?Math.sin(clock*14)*.022:0));
 spr(img.kiwi,frame*96,costume*96,96,96,-wd/2,-ht/2,wd,ht,p.face<0);ctx.restore();
 if(!p.grounded&&p.vy>280){
  ctx.globalAlpha=.42;for(let j=0;j<3;j++){const yy=y-25-j*13+Math.sin(clock*8+j*2)*5;line(x-15+j*13,yy,x-15+j*13,yy-6-(p.vy/180),'#ffe8be',1.4);}ctx.globalAlpha=1;
 }
 if(p.shield>0){ctx.strokeStyle='#a0f4e5bb';ctx.lineWidth=2.5;ctx.setLineDash([5,4]);ctx.lineDashOffset=-clock*12;ctx.beginPath();ctx.ellipse(x,y,34,36,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}
}
function hud(g){const p=g.p,w=worlds[g.world],n=g.stage;
 rect(0,0,W,91,'#15273de9');rect(0,88,W,2,'#a9d9da55');
 ctx.font='bold 12px Trebuchet MS';ctx.fillStyle=w.accent;ctx.fillText(`${w.icon} ${w.short.toUpperCase()}`,12,19);
 ctx.fillStyle='#ffdf99';ctx.font='bold 13px Trebuchet MS';ctx.fillText(`🪙 ${g.coins}`,347,19);
 ctx.fillStyle='#ffd5ce';ctx.font='bold 23px Trebuchet MS';let hearts='';for(let i=0;i<Math.min(p.maxHp,10);i++)hearts+=i<p.hp?'♥':'♡';ctx.fillText(hearts,11,48);
 ctx.fillStyle='#d8e8e7';ctx.font='bold 11px Trebuchet MS';ctx.fillText(`LEVEL ${stageName(n)}  •  ${fmtTime(g.stageTime)}  •  ${Math.floor(g.score).toLocaleString()} PTS`,12,70);
 rect(302,40,114,9,'#293950');rect(304,42,110*clamp(p.hover/p.hoverMax,0,1),5,'#8de4e8');ctx.textAlign='right';ctx.font='bold 10px Trebuchet MS';ctx.fillStyle='#b8f6ef';ctx.fillText('EGG HOVER',413,65);ctx.textAlign='left';
 if(p.shield>0){ctx.fillStyle='#a4fcf1';ctx.font='bold 11px Trebuchet MS';ctx.fillText('🛡 '+p.shield,240,47);}
 const b=activeBoss(g.stage);
 if(b&&Math.abs(g.p.y-b.y)<950){const y=104;
  rect(48,y,336,27,'#122038dd');rect(51,y+17,330,7,'#453d55');rect(51,y+17,330*clamp(b.hp/b.maxHp,0,1),7,b.major?'#e68891':'#f5c57d');
  ctx.textAlign='center';ctx.font='bold 11px Trebuchet MS';ctx.fillStyle='#fff1d4';ctx.fillText(b.major?worlds[b.world].boss:miniName(b.world,b.variant).toUpperCase(),216,y+12);ctx.textAlign='left';}
 if(g.combo>=2&&g.comboTimer>0){ctx.textAlign='center';ctx.font='bold 19px Trebuchet MS';ctx.fillStyle='#ffe490';ctx.fillText(`COMBO ×${g.combo}`,216,b?151:116);ctx.textAlign='left';}
 if(g.worldMessage>0){ctx.save();ctx.globalAlpha=Math.min(1,g.worldMessage);rect(30,182,372,75,'#1a354cdb');ctx.textAlign='center';ctx.fillStyle=w.accent;ctx.font='bold 22px Trebuchet MS';ctx.fillText(w.name,216,214);ctx.fillStyle='#fff0d2';ctx.font='bold 12px Trebuchet MS';ctx.fillText(`WORLD ${g.world+1} • LEVEL ${n%4+1} OF 4`,216,239);ctx.restore();}
 if(g.resultTime>0&&g.resultBanner){const b=g.resultBanner;ctx.save();ctx.globalAlpha=clamp(g.resultTime,0,1);rect(44,278,344,154,'#18324dea');ctx.strokeStyle='#e5c77c';ctx.lineWidth=3;ctx.strokeRect(45,279,342,152);ctx.textAlign='center';ctx.fillStyle='#ffe39e';ctx.font='bold 21px Trebuchet MS';ctx.fillText(`LEVEL ${b.stage} COMPLETE!`,216,312);ctx.fillStyle='#cfe6e2';ctx.font='bold 13px Trebuchet MS';ctx.fillText(`⏱️ ${b.fast?'SPEED ✓':'SPEED —'}    💖 ${b.flawless?'FLAWLESS ✓':'FLAWLESS —'}`,216,341);ctx.fillText(`🕊️ ${b.pacifist?'PACIFIST ✓':'PACIFIST —'}  •  TIME ${b.time}`,216,365);ctx.fillStyle='#fff4bc';ctx.font='bold 18px Trebuchet MS';ctx.fillText(`+${b.coinBonus} COINS  •  +${b.pointBonus} PTS`,216,402);ctx.restore();}
}
function attract(){const w=Math.floor(clock/11)%8;background(w,clock*19);for(let i=0;i<11;i++){
 const y=((i*112+clock*44)%970)-95,x=70+Math.sin(i*2.1+clock*.4)*120+118;
 spr(img.items,0,0,64,64,x,y,22,22);
 }
 const suit=Math.max(0,suits.findIndex(x=>x.id===save.wear)),x=216+Math.sin(clock*.4)*31,y=345+Math.sin(clock*2.3)*12;
 circle(x,y,90,'#ffd78c',.13);spr(img.kiwi,(Math.floor(clock*3)%2+2)*96,suit*96,96,96,x-88,y-88,176,176);
}
function draw(){ctx.imageSmoothingEnabled=false;ctx.save();rect(0,0,432,720,'#192b3b');if(!game||game.done){attract();ctx.restore();return;}
 const g=game,p=g.p,camera=g.camera,off=g.shake?Math.min(4,g.shake*.55):0;
 if(off)ctx.translate(Math.sin(clock*73)*off,Math.cos(clock*83)*off);
 background(g.world,camera);
 // At the start and end of a world, a short themed wall transition adds depth.
 const bottom=(g.stage+1)*STAGE-camera;
 if(bottom>-90&&bottom<720&&g.stage%4===3){rect(0,bottom-12,432,20,'#c8d9a22b');for(let i=0;i<18;i++)rect(i*26,bottom-13+(i%3)*3,13,3,worlds[g.world].accent);}
 for(const d of g.deco)drawDeco(d,camera);
 if(g.intro){rect(0,-camera-8,432,30,'#886545');rect(0,-camera-20,432,12,'#83b86d');for(let i=0;i<54;i++)rect(i*9,-camera-23+(i%4),3,5,'#a4d18a');if(g.introTime>1){ctx.strokeStyle='#1c2638';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,-camera-9);ctx.lineTo(p.x-46*(g.introTime-1),-camera+31);ctx.moveTo(p.x,-camera-9);ctx.lineTo(p.x+43*(g.introTime-1),-camera+34);ctx.stroke();}}
 for(const b of g.platforms)drawPlatform(b,camera);
 for(const e of g.entities)drawEntity(e,camera);
 for(const b of g.bossesByStage.values())drawBoss(b,camera);
 for(const s of g.shots){const y=s.y-camera;if(y<-50||y>770)continue;
 spr(img.items,128,0,64,64,s.x-10,y-14,20,25);rect(s.x-1,y-19,2,9,'#fff3c4');}
 for(const s of g.enemyShots){const y=s.y-camera;if(y<-30||y>750)continue;
 circle(s.x,y,s.r+5,s.color,.10);circle(s.x,y,s.r,s.color);circle(s.x-1,y-1,2,'#fff5dc');}
 for(const q of g.particles){const y=q.y-camera;if(y<-20||y>745)continue;ctx.globalAlpha=clamp(1-q.t/q.life,0,1);rect(q.x,y,q.size,q.size,q.color);}ctx.globalAlpha=1;
 drawPlayer(p,camera);hud(g);
 if(g.flash>0)rect(0,0,432,720,`rgba(255,232,223,${g.flash*.36})`);
 ctx.restore();}
function loop(now){const dt=clamp((now-lastFrame)/1000,0,.045);lastFrame=now;clock+=dt;accumulator=Math.min(.12,accumulator+dt);let steps=0;
 while(accumulator>=1/60&&steps<4){update(1/60);accumulator-=1/60;steps++;}if(steps===4)accumulator=0;
 draw();if(toastTime>0){toastTime-=dt;if(toastTime<=0)toastEl.classList.remove('show');}
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
// Menus and input. W jumps, S shoots. Keyboard listeners do not interfere
// with the game's own on-screen controls or browser pause behaviour.
modal.addEventListener('click',e=>{
 const d=e.target.closest('[data-diff]');if(d){difficulty=d.dataset.diff;showMenu();sound('coin');return;}
 const tab=e.target.closest('[data-tab]');if(tab){menuTab=tab.dataset.tab;showShop(shopBack);return;}
 const purchase=e.target.closest('[data-buy]');if(purchase){const [typ,id]=purchase.dataset.buy.split(':');buyItem(typ,id);return;}
 const power=e.target.closest('[data-pick]');if(power){applyPower(power.dataset.pick);return;}
 const b=e.target.closest('[data-action]');if(!b)return;enableAudio();
 switch(b.dataset.action){case'menu':if(game&&!game.done)finish(false);game=null;showMenu();break;
 case'adventure':makeGame('adventure');break;case'endless':makeGame('endless');break;
 case'how':showHow();break;case'shop':showShop('menu');break;case'resultsShop':showShop('results');break;
 case'results':showResults();break;case'scores':showScores();break;case'settings':showSettings();break;
 case'resume':setScreen('playing');break;case'restart':{const m=game?.mode||'adventure';if(game&&!game.done)finish(false);makeGame(m);break;}
 case'quit':finish(false);game=null;showMenu();break;
 }
});
modal.addEventListener('input',e=>{if(e.target.id==='musicVol')save.settings.music=Number(e.target.value)/100;if(e.target.id==='sfxVol')save.settings.sfx=Number(e.target.value)/100;persist();});
function handleKey(e,down){const c=e.code;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyJ','KeyP','Escape'].includes(c))e.preventDefault();
 if(c==='ArrowLeft'||c==='KeyA')keys.left=down;
 if(c==='ArrowRight'||c==='KeyD')keys.right=down;
 if(c==='KeyS'||c==='Space'||c==='KeyJ'||c==='ArrowDown')keys.shoot=down;
 if(c==='KeyW'||c==='ArrowUp'){keys.jump=down;if(down&&!e.repeat)jumpBuffered=.16;}
 if(down&&!e.repeat&&(c==='Escape'||c==='KeyP')){if(screen==='playing')showPause();else if(screen==='pause')setScreen('playing');}
}
document.addEventListener('keydown',e=>handleKey(e,true));document.addEventListener('keyup',e=>handleKey(e,false));
pauseTop.addEventListener('click',()=>{if(screen==='playing'||screen==='intro')showPause();});
const activeTouches=new Map();
// Each on-screen action tracks its own pointer IDs: jumping must not cancel a held shot.

for(const button of document.querySelectorAll('[data-hold]')){
 const act=button.dataset.hold;
 const active=new Set();activeTouches.set(button,active);
 const start=e=>{if(screen!=='playing'&&screen!=='intro')return;e.preventDefault();enableAudio();
  if(active.has(e.pointerId))return;
  active.add(e.pointerId);try{button.setPointerCapture(e.pointerId);}catch{}
  keys[act]=true;if(act==='jump')jumpBuffered=.16;button.classList.add('pressed');button.setAttribute('aria-pressed','true');};
 const end=e=>{e.preventDefault();if(!active.delete(e.pointerId))return;
  keys[act]=active.size>0;button.classList.toggle('pressed',keys[act]);button.setAttribute('aria-pressed',String(keys[act]));};
 button.addEventListener('pointerdown',start);button.addEventListener('pointerup',end);
 button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
}

window.addEventListener('blur',()=>{blurMuted=true;stopKeys();if(screen==='playing')showPause();});window.addEventListener('focus',()=>blurMuted=false);
document.addEventListener('visibilitychange',()=>{if(document.hidden){blurMuted=true;stopKeys();if(screen==='playing')showPause();}else blurMuted=false;});
document.addEventListener('contextmenu',e=>{if(e.target.closest('#stage'))e.preventDefault();});
// Exposes read-only run state to support automated gameplay smoke tests.
window.KiwiDownUnderDebug=Object.freeze({getStatus:()=>game?{screen,stage:game.stage,world:game.world,health:game.p.hp,coins:game.coins,bosses:game.bosses,completed:game.completed,player:{x:game.p.x,y:game.p.y,vy:game.p.vy},boss:activeBoss(game.stage)?{hp:activeBoss(game.stage).hp,major:activeBoss(game.stage).major}:null,powerChoices:game.pendingPowerOptions?game.pendingPowerOptions.slice():null,controls:{...keys}}: {screen},getWorlds:()=>worlds.map(w=>w.name)});
showMenu();
})();
