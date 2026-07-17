(() => {
  'use strict';

  const isMobileDevice = (() => {
    const ua = navigator.userAgent || '';
    const uaMobile = navigator.userAgentData?.mobile === true;
    const phoneTabletUa = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const iPadLike = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const compactTouchDevice = navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 1000;
    return uaMobile || phoneTabletUa || iPadLike || compactTouchDevice;
  })();
  document.body.classList.toggle('mobile-device', isMobileDevice);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const newBtn = document.getElementById('newBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const scoresBtn = document.getElementById('scoresBtn');
  const soundBtn = document.getElementById('soundBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const helpBtn = document.getElementById('helpBtn');
  const mobileNewBtn = document.getElementById('mobileNewBtn');
  const mobilePauseBtn = document.getElementById('mobilePauseBtn');
  const mobileSoundBtn = document.getElementById('mobileSoundBtn');
  const mobileHelpBtn = document.getElementById('mobileHelpBtn');
  const mobileControls = document.getElementById('mobileControls');
  const moveStick = document.getElementById('moveStick');
  const moveKnob = document.getElementById('moveKnob');
  const aimStick = document.getElementById('aimStick');
  const aimKnob = document.getElementById('aimKnob');
  const mobileJumpBtn = document.getElementById('mobileJumpBtn');
  const mobileBombBtn = document.getElementById('mobileBombBtn');
  const mobileActiveBtn = document.getElementById('mobileActiveBtn');
  const rotateNotice = document.getElementById('rotateNotice');
  const newRunModal = document.getElementById('newRunModal');
  const newRunClose = document.getElementById('newRunClose');
  const newRunWarning = document.getElementById('newRunWarning');
  const randomSeedBtn = document.getElementById('randomSeedBtn');
  const openCustomSeedBtn = document.getElementById('openCustomSeedBtn');
  const cancelNewRunBtn = document.getElementById('cancelNewRunBtn');
  const customSeedModal = document.getElementById('customSeedModal');
  const customSeedClose = document.getElementById('customSeedClose');
  const backToNewRunBtn = document.getElementById('backToNewRunBtn');
  const cancelCustomSeedBtn = document.getElementById('cancelCustomSeedBtn');
  const seedInput = document.getElementById('seedInput');
  const seedError = document.getElementById('seedError');
  const useSeedBtn = document.getElementById('useSeedBtn');

  const CW = canvas.width;
  const CH = canvas.height;
  const VIEW = { x: 24, y: 82, w: 690, h: 530 };
  const SIDE = { x: 728, y: 82, w: 208, h: 530 };
  const SHOP_VIEW = { x: 24, y: 82, w: 912, h: 530 };
  const UI_FONT = '"Trebuchet MS", Tahoma, Arial, sans-serif';
  const UNIT_W = 440;
  const UNIT_H = 248;
  const WALL = 22;
  const DOOR_HALF = 35;
  const MAX_MAIN_ROOMS = 7;
  const AIM_DIRS = [
    { name:'E',  x:1, y:0, a:0 },
    { name:'SE', x:Math.SQRT1_2, y:Math.SQRT1_2, a:Math.PI/4 },
    { name:'S',  x:0, y:1, a:Math.PI/2 },
    { name:'SW', x:-Math.SQRT1_2, y:Math.SQRT1_2, a:Math.PI*3/4 },
    { name:'W',  x:-1, y:0, a:Math.PI },
    { name:'NW', x:-Math.SQRT1_2, y:-Math.SQRT1_2, a:-Math.PI*3/4 },
    { name:'N',  x:0, y:-1, a:-Math.PI/2 },
    { name:'NE', x:Math.SQRT1_2, y:-Math.SQRT1_2, a:-Math.PI/4 }
  ];
  const CARDINALS = [
    { key:'N', dx:0, dy:-1, opposite:'S' },
    { key:'E', dx:1, dy:0, opposite:'W' },
    { key:'S', dx:0, dy:1, opposite:'N' },
    { key:'W', dx:-1, dy:0, opposite:'E' }
  ];
  const ROOM_SIZES = [[1,1],[1,1],[1,1],[2,1],[1,2],[2,2],[2,3],[3,2]];
  const ENEMY_TYPES = ['slime','bat','skeleton','archer','spider','shield','burrow','charger','fire','split','wizard','turret','ghost','mimic','eye','leech','lancer','orbiter','summoner','bomber','iceMage','moth','centipede'];
  const BOSS_TYPES = ['beast','mage','giantSpider','hydra','knight','cyclops','stormIdol','sandWyrm','frostQueen','voidMask'];

  const PASSIVES = {
    powerSword:{name:'Tempered Blade',desc:'Sword attacks deal +1 damage.',price:28},
    quickSword:{name:'Swift Grip',desc:'Attack faster with the sword.',price:24},
    orbital:{name:'Orbiting Blade',desc:'A blade circles and damages enemies.',price:34},
    ward:{name:'Guardian Charm',desc:'Absorbs one hit; recharges each stage.',price:30},
    maxHeart:{name:'Heart Container',desc:'Gain one maximum heart and heal.',price:40},
    speed:{name:'Wind Boots',desc:'Move faster.',price:26},
    bombRadius:{name:'Blast Powder',desc:'Bombs have a larger blast and more enemy damage.',price:22},
    luck:{name:'Lucky Clover',desc:'Enemies drop loot more often.',price:25},
    mirrorShield:{name:'Mirror Shield',desc:'Face incoming projectiles to reflect them back.',price:34},
    beamBless:{name:'Beam Blessing',desc:'Sword beams travel farther and hit harder.',price:27},
    magnet:{name:'Treasure Magnet',desc:'Loose pickups drift toward you from farther away.',price:24},
    secondWind:{name:'Second Wind',desc:'Recover +1 heart whenever a new stage begins.',price:29}
  };
  const ACTIVES = {
    boomerang:{name:'Gale Boomerang',desc:'Returning blade with a short cooldown.',price:30,system:'cooldown'},
    arrows:{name:'Silver Bow',desc:'A very strong arrow for 1 rupee.',price:29,system:'rupees'},
    triple:{name:'Tri-Shot Wand',desc:'Fires three magic bolts.',price:32,system:'cooldown'},
    burst:{name:'Eight-Way Rune',desc:'Eight-direction magic burst; limited charges.',price:35,system:'charges'},
    homing:{name:'Seeker Flame',desc:'Homing magic; limited charges.',price:38,system:'charges'},
    orbitNova:{name:'Moon Halo',desc:'Summons rotating magic for several seconds.',price:42,system:'cooldown'},
    pierceLance:{name:'Piercing Lance',desc:'Launches a piercing spear of light.',price:36,system:'cooldown'},
    frostOrb:{name:'Frost Orb',desc:'Freezes enemies it touches; limited charges.',price:34,system:'charges'},
    chainSpark:{name:'Chain Spark',desc:'Lightning strikes nearby enemies in sequence.',price:39,system:'cooldown'},
    bombStaff:{name:'Bomb Staff',desc:'Launches an explosive fireball.',price:33,system:'cooldown'}
  };

  const SOUND_VARIANTS = {
    sword:['sounds/sword_1.wav','sounds/sword_2.wav','sounds/sword_3.wav'],
    beam:['sounds/beam.wav'],
    hit:['sounds/hit_1.wav','sounds/hit_2.wav','sounds/hit_3.wav'],
    hurt:['sounds/hurt.wav'],
    jump:['sounds/jump.wav'],
    fall:['sounds/fall.wav'],
    bomb:['sounds/bomb.wav'],
    door:['sounds/door.wav'],
    buy:['sounds/buy.wav'],
    error:['sounds/error.wav'],
    boss:['sounds/boss.wav'],
    stairs:['sounds/stairs.wav'],
    shield:['sounds/shield.wav'],
    rupee:['sounds/rupee_1.wav','sounds/rupee_2.wav'],
    heart:['sounds/heart.wav'],
    key:['sounds/key.wav'],
    charge:['sounds/charge.wav'],
    open:['sounds/open.wav'],
    clear:['sounds/clear.wav'],
    active:['sounds/active.wav']
  };
  const SOUND_VOLUMES = {
    sword:.58,beam:.58,hit:.62,hurt:.62,jump:.46,fall:.58,bomb:.72,door:.52,buy:.48,error:.46,
    boss:.65,stairs:.48,shield:.58,rupee:.46,heart:.45,key:.48,charge:.48,open:.52,clear:.52,active:.50
  };

  const keys = Object.create(null);
  const pressed = Object.create(null);
  let audioCtx = null;
  let masterGain = null;
  let compressor = null;
  let noiseBuffer = null;
  let soundOn = true;
  let soundVolume = .8;
  let soundAssetsUnlocked = false;
  const soundPools = new Map();
  const soundPoolCursor = new Map();
  let paused = false;
  let overlay = null;
  let selectedPowerup = null;
  let state = 'title';
  let lastTime = performance.now();
  let gameTime = 0;
  let stage = 1;
  let rooms = [];
  let roomById = new Map();
  let currentRoomId = 0;
  let player = null;
  let projectiles = [];
  let bombs = [];
  let particles = [];
  let blastEffects = [];
  let transition = null;
  let message = '';
  let messageTimer = 0;
  let shake = 0;
  let flash = 0;
  let stageBanner = 0;
  let shop = null;
  let shopReturnRoomId = 0;
  let runRecorded = false;
  let aimDir = AIM_DIRS[0];
  let mouse = {x:CW/2,y:CH/2};
  let runSeed = '';
  let rngState = 0x6d2b79f5;
  let fxState = 0x9e3779b9;
  let overlayPausedGame = false;
  let overlayWasPaused = false;
  let modalPausedGame = false;
  let modalWasPaused = false;
  let autoRun = {active:false,dx:0,dy:0,code:''};
  const lastDirectionPress = new Map();
  const RUN_DOUBLE_TAP_MS = 310;
  const RUN_SPEED_MULTIPLIER = 1.7;
  const mobileMove = {active:false,pointerId:null,x:0,y:0,registered:false};
  const mobileAim = {active:false,pointerId:null,x:1,y:0};
  let mobileLastDirection = {name:'',time:0};
  let mobileOrientationBlocked = false;
  let orientationPausedGame = false;
  let orientationWasPaused = false;

  soundVolume = loadSavedVolume();
  updateVolumeUi();

  function hashSeed(text){
    let h=2166136261>>>0;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
    return (h>>>0)||0x6d2b79f5;
  }
  function reseed(tag){rngState=hashSeed(`${runSeed}|${tag}`)}
  function random01(){
    rngState=(rngState+0x6D2B79F5)>>>0;
    let t=rngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  }
  function fxRandom01(){
    fxState=(fxState+0x9E3779B9)>>>0;
    let t=fxState;t^=t<<13;t^=t>>>17;t^=t<<5;fxState=t>>>0;
    return fxState/4294967296;
  }
  const fxRand=(a,b)=>fxRandom01()*(b-a)+a;
  const fxRandi=(a,b)=>Math.floor(fxRand(a,b+1));
  function formatSeedBody(body){return `${body.slice(0,4)}-${body.slice(4,8)}`}
  function normalizeSeed(value){
    let clean=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(!clean) return '';
    if(clean.length<8){
      const suffix=hashSeed(clean).toString(36).toUpperCase().padStart(8,'0');
      clean=(clean+suffix).slice(0,8);
    }
    return formatSeedBody(clean.slice(0,8));
  }
  function generateSeedId(){
    const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes=new Uint8Array(8);
    if(globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for(let i=0;i<bytes.length;i++) bytes[i]=(Date.now()*(i+3)+performance.now()*997)>>>i;
    let body='';
    for(const byte of bytes) body+=alphabet[byte%alphabet.length];
    return formatSeedBody(body);
  }

  const rand = (a,b) => random01()*(b-a)+a;
  const randi = (a,b) => Math.floor(rand(a,b+1));
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const chance = p => random01() < p;
  const choose = arr => arr[Math.floor(random01()*arr.length)];
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const rectHit = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const circleRect = (c,r) => {
    const x = clamp(c.x,r.x,r.x+r.w), y = clamp(c.y,r.y,r.y+r.h);
    return (c.x-x)**2+(c.y-y)**2 < c.r**2;
  };
  const circleHit = (a,b) => (a.x-b.x)**2+(a.y-b.y)**2 < (a.r+b.r)**2;
  const normalize = (x,y) => { const d=Math.hypot(x,y)||1; return {x:x/d,y:y/d}; };
  const roomSize = room => ({w:room.w*UNIT_W,h:room.h*UNIT_H});
  const currentRoom = () => roomById.get(currentRoomId);
  const activeMaxCharges = id => id==='frostOrb'?5:(id==='burst'||id==='homing'?6:0);
  const usesCharges = id => activeMaxCharges(id)>0;

  function loadSavedVolume(){
    try{
      const raw=localStorage.getItem('greenbladeSoundVolume');
      if(raw==null) return .8;
      const v=Number(raw);
      return Number.isFinite(v)?clamp(v,0,1):.8;
    }catch{ return .8; }
  }
  function saveVolume(){
    try{ localStorage.setItem('greenbladeSoundVolume', String(soundVolume)); }catch{}
  }
  function updateVolumeUi(){
    const percent=Math.round(soundVolume*100);
    if(volumeSlider) volumeSlider.value=String(percent);
    if(volumeValue) volumeValue.textContent=`${percent}%`;
  }
  function applySoundVolume(){
    if(masterGain) masterGain.gain.value=.48*soundVolume;
    for(const [url,pool] of soundPools.entries()){
      for(const audio of pool){
        const baseName = Object.entries(SOUND_VARIANTS).find(([,files])=>files.includes(url))?.[0];
        const baseVol = baseName ? (SOUND_VOLUMES[baseName] ?? .5) : .5;
        audio.volume = baseVol * soundVolume;
      }
    }
    updateVolumeUi();
    saveVolume();
  }

  function createSoundPool(url){
    if(soundPools.has(url)) return soundPools.get(url);
    const pool=[];
    for(let i=0;i<4;i++){
      const audio=new Audio(url);
      audio.preload='auto';
      audio.volume=.5*soundVolume;
      pool.push(audio);
    }
    soundPools.set(url,pool);
    soundPoolCursor.set(url,0);
    return pool;
  }
  function preloadSoundAssets(){
    for(const files of Object.values(SOUND_VARIANTS)) for(const url of files) createSoundPool(url);
    createSoundPool('sounds/silence.wav');
  }
  async function unlockSoundAssets(){
    if(!soundOn) return false;
    initAudio();
    if(audioCtx?.state==='suspended'){
      try{await audioCtx.resume()}catch{}
    }
    const pool=createSoundPool('sounds/silence.wav');
    const probe=pool[0];
    try{
      probe.currentTime=0;probe.volume=.001;
      await probe.play();
      probe.pause();probe.currentTime=0;
      soundAssetsUnlocked=true;
      return true;
    }catch{
      return false;
    }
  }
  function playSoundAsset(name){
    if(!soundOn) return true;
    const files=SOUND_VARIANTS[name];
    if(!files?.length) return false;
    const url=files[Math.floor(Math.random()*files.length)];
    const pool=createSoundPool(url);
    let audio=pool.find(a=>a.paused||a.ended);
    if(!audio){
      const index=(soundPoolCursor.get(url)||0)%pool.length;
      audio=pool[index];soundPoolCursor.set(url,index+1);
    }
    try{
      audio.pause();
      audio.currentTime=0;
      audio.volume=(SOUND_VOLUMES[name]??.5)*soundVolume;
      audio.playbackRate=(name==='sword'||name==='hit'||name==='rupee')?.97+Math.random()*.06:1;
      const promise=audio.play();
      if(promise?.catch) promise.catch(()=>{soundAssetsUnlocked=false;});
      return true;
    }catch{
      return false;
    }
  }

  function initAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      masterGain=audioCtx.createGain();
      compressor=audioCtx.createDynamicsCompressor();
      compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.18;
      masterGain.gain.value=.48*soundVolume;
      masterGain.connect(compressor).connect(audioCtx.destination);
      const length=Math.max(1,Math.floor(audioCtx.sampleRate*.7));
      noiseBuffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate);
      const data=noiseBuffer.getChannelData(0);
      let last=0;
      for(let i=0;i<length;i++){
        const white=Math.random()*2-1;
        last=last*.84+white*.16;
        data[i]=last*.8+white*.2;
      }
    }
    if(audioCtx.state==='suspended') audioCtx.resume();
  }
  function audioTone(freq,d=.08,type='triangle',vol=.025,to=null,delay=0,attack=.006){
    if(!soundOn) return;
    initAudio();
    const start=audioCtx.currentTime+delay,end=start+d;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),start);
    if(to) o.frequency.exponentialRampToValueAtTime(Math.max(20,to),end);
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),start+Math.min(attack,d*.35));
    g.gain.exponentialRampToValueAtTime(.0001,end);
    o.connect(g).connect(masterGain);o.start(start);o.stop(end+.02);
  }
  function noiseBurst(d=.08,vol=.025,freq=1200,filterType='bandpass',delay=0){
    if(!soundOn) return;
    initAudio();
    const start=audioCtx.currentTime+delay,end=start+d;
    const src=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
    src.buffer=noiseBuffer;filter.type=filterType;filter.frequency.setValueAtTime(freq,start);filter.Q.value=filterType==='bandpass'?1.2:.7;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(vol,start+.006);g.gain.exponentialRampToValueAtTime(.0001,end);
    src.connect(filter).connect(g).connect(masterGain);src.start(start);src.stop(end+.02);
  }
  function tone(freq,d=0.07,type='triangle',vol=0.022,to=null){ audioTone(freq,d,type,vol,to); }
  function sfx(name){
    if(!soundOn) return;
    if(playSoundAsset(name)) return;
    initAudio();
    if(name==='sword'){noiseBurst(.075,.022,1550,'bandpass');audioTone(390,.07,'triangle',.018,185)}
    else if(name==='beam'){audioTone(520,.12,'sine',.022,880);audioTone(1040,.09,'triangle',.009,720,.015)}
    else if(name==='hit'){audioTone(145,.07,'sine',.032,82);noiseBurst(.045,.018,520,'lowpass')}
    else if(name==='hurt'){audioTone(190,.2,'sawtooth',.028,62);noiseBurst(.12,.02,480,'lowpass')}
    else if(name==='jump'){audioTone(245,.13,'sine',.021,510);audioTone(490,.08,'triangle',.008,620,.025)}
    else if(name==='fall'){audioTone(210,.28,'triangle',.026,58);noiseBurst(.18,.018,360,'lowpass',.035)}
    else if(name==='bomb'){audioTone(92,.36,'sine',.055,32);audioTone(180,.18,'triangle',.018,58);noiseBurst(.34,.06,280,'lowpass')}
    else if(name==='door'){audioTone(115,.13,'sine',.03,84);noiseBurst(.1,.018,760,'lowpass',.015)}
    else if(name==='buy'){audioTone(523,.09,'sine',.018,659);audioTone(784,.13,'triangle',.016,1047,.08)}
    else if(name==='error'){audioTone(185,.11,'triangle',.025,145);audioTone(135,.1,'sine',.016,110,.075)}
    else if(name==='boss'){audioTone(76,.34,'sine',.05,42);audioTone(114,.3,'triangle',.018,61,.05);noiseBurst(.22,.025,310,'lowpass')}
    else if(name==='stairs'){audioTone(392,.12,'sine',.016,294);audioTone(262,.16,'triangle',.014,196,.085)}
    else if(name==='shield'){audioTone(880,.07,'sine',.018,620);noiseBurst(.045,.012,2200,'bandpass')}
    else if(name==='rupee'){audioTone(659,.07,'sine',.015,784);audioTone(988,.1,'triangle',.013,1175,.055)}
    else if(name==='heart'){audioTone(392,.1,'sine',.015,523);audioTone(659,.13,'sine',.014,784,.075)}
    else if(name==='key'){audioTone(523,.07,'triangle',.015,659);audioTone(784,.09,'sine',.014,988,.06);audioTone(1175,.12,'triangle',.011,1319,.125)}
    else if(name==='charge'){audioTone(440,.1,'sine',.016,660);audioTone(880,.16,'triangle',.014,1320,.07);noiseBurst(.09,.008,2500,'highpass',.035)}
    else if(name==='open'){audioTone(262,.08,'sine',.016,330);audioTone(523,.14,'triangle',.014,659,.075);noiseBurst(.08,.009,980,'bandpass')}
    else if(name==='clear'){audioTone(392,.12,'sine',.015,523);audioTone(659,.14,'sine',.015,784,.1);audioTone(988,.2,'triangle',.013,1175,.21)}
    else if(name==='active'){audioTone(330,.08,'sine',.015,495);audioTone(660,.12,'triangle',.012,880,.055)}
  }

  function setMessage(text,time=2){ message=text; messageTimer=time; }
  function syncPauseButtons(){
    const label=paused?'RESUME':'PAUSE';
    pauseBtn.textContent=label;
    if(mobilePauseBtn) mobilePauseBtn.textContent=label;
  }
  function syncSoundButtons(){
    soundBtn.textContent=`SOUND: ${soundOn?'ON':'OFF'}`;
    if(mobileSoundBtn) mobileSoundBtn.textContent=soundOn?'SOUND':'MUTED';
  }
  function resetKnob(knob){ if(knob) knob.style.transform='translate(-50%,-50%)'; }
  function resetMobileControls(){
    mobileMove.active=false;mobileMove.pointerId=null;mobileMove.x=0;mobileMove.y=0;mobileMove.registered=false;
    mobileAim.active=false;mobileAim.pointerId=null;mobileAim.x=aimDir.x;mobileAim.y=aimDir.y;
    resetKnob(moveKnob);resetKnob(aimKnob);
    moveStick?.classList.remove('is-active');aimStick?.classList.remove('is-active');
    mobileJumpBtn?.classList.remove('is-pressed');mobileBombBtn?.classList.remove('is-pressed');mobileActiveBtn?.classList.remove('is-pressed');
  }
  function clearInputs(){
    for(const k of Object.keys(keys)) keys[k]=false;
    for(const k of Object.keys(pressed)) pressed[k]=false;
    resetMobileControls();
  }
  function directionFromCode(code){
    if(code==='ArrowUp'||code==='KeyW') return {dx:0,dy:-1};
    if(code==='ArrowDown'||code==='KeyS') return {dx:0,dy:1};
    if(code==='ArrowLeft'||code==='KeyA') return {dx:-1,dy:0};
    if(code==='ArrowRight'||code==='KeyD') return {dx:1,dy:0};
    return null;
  }
  function stopAutoRun(){
    autoRun.active=false;autoRun.dx=0;autoRun.dy=0;autoRun.code='';
  }
  function beginAutoRun(dx,dy,code='touch'){
    const n=normalize(dx,dy);
    autoRun={active:true,dx:n.x,dy:n.y,code};
    setMessage('Running — attack, use an item, or hit an obstacle to stop.',1.4);
  }
  function handleDirectionPress(code,repeat){
    const dir=directionFromCode(code);
    if(!dir||repeat) return;
    const now=performance.now();
    const last=lastDirectionPress.get(code)||0;
    const isDouble=now-last<=RUN_DOUBLE_TAP_MS;
    lastDirectionPress.set(code,now);
    if(isDouble&&(state==='play'||state==='shop')){
      beginAutoRun(dir.dx,dir.dy,code);
    }else if(autoRun.active&&(dir.dx!==autoRun.dx||dir.dy!==autoRun.dy)){
      stopAutoRun();
    }
  }
  function nearestAimDirection(x,y){
    if(Math.hypot(x,y)<.01) return aimDir;
    return snapAim(x,y);
  }
  function registerMobileDirection(x,y){
    const dir=nearestAimDirection(x,y);
    const now=performance.now();
    const isDouble=mobileLastDirection.name===dir.name&&now-mobileLastDirection.time<=RUN_DOUBLE_TAP_MS+60;
    mobileLastDirection={name:dir.name,time:now};
    if(isDouble&&(state==='play'||state==='shop')) beginAutoRun(dir.x,dir.y,`touch-${dir.name}`);
    else if(autoRun.active&&(Math.abs(autoRun.dx-dir.x)>.15||Math.abs(autoRun.dy-dir.y)>.15)) stopAutoRun();
  }
  function togglePause(force){
    if(state!=='play'&&state!=='shop') return;
    paused = force===undefined ? !paused : force;
    stopAutoRun();
    clearInputs();
    syncPauseButtons();
  }
  function openOverlay(type){
    if(overlay===type){closeOverlay();return}
    if(overlay) closeOverlay();
    overlay=type;stopAutoRun();clearInputs();
    overlayWasPaused=paused;overlayPausedGame=false;
    if((type==='help'||type==='powerup')&&(state==='play'||state==='shop')&&!paused){
      paused=true;overlayPausedGame=true;syncPauseButtons();
    }
  }
  function closeOverlay(){
    overlay=null;selectedPowerup=null;clearInputs();
    if(overlayPausedGame&&!overlayWasPaused&&(state==='play'||state==='shop')){
      paused=false;syncPauseButtons();
    }
    overlayPausedGame=false;overlayWasPaused=false;
  }
  function anyModalOpen(){ return !newRunModal.hidden || !customSeedModal.hidden; }
  function hideAllModals(){ newRunModal.hidden=true; customSeedModal.hidden=true; seedError.textContent=''; }
  function openNewRunModal(){
    stopAutoRun();
    const activeRun=(state==='play'||state==='shop'||state==='gameover')&&!!player;
    newRunWarning.hidden=!activeRun||state==='gameover';
    modalWasPaused=paused;modalPausedGame=false;
    if((state==='play'||state==='shop')&&!paused){paused=true;modalPausedGame=true;syncPauseButtons();clearInputs()}
    seedInput.value='';seedError.textContent='';
    hideAllModals();
    newRunModal.hidden=false;
  }
  function openCustomSeedModal(){
    if(newRunModal.hidden) return;
    newRunModal.hidden=true;
    customSeedModal.hidden=false;
    seedError.textContent='';
    requestAnimationFrame(()=>seedInput.focus());
  }
  function closeAllModals(){
    if(!anyModalOpen()) return;
    hideAllModals();
    if(modalPausedGame&&!modalWasPaused&&(state==='play'||state==='shop')){
      paused=false;syncPauseButtons();
    }
    modalPausedGame=false;modalWasPaused=false;clearInputs();
  }
  function beginRunFromModal(seedValue){
    const normalized=seedValue?normalizeSeed(seedValue):generateSeedId();
    if(seedValue&&!normalized){seedError.textContent='Enter at least one letter or number.';seedInput.focus();return}
    hideAllModals();modalPausedGame=false;modalWasPaused=false;
    startRun(normalized);
  }

  function isLandscapeView(){ return window.innerWidth>window.innerHeight; }
  function updateMobileOrientation(){
    if(!isMobileDevice) return;
    const blocked=!isLandscapeView();
    mobileOrientationBlocked=blocked;
    document.body.classList.toggle('orientation-blocked',blocked);
    rotateNotice.hidden=!blocked;
    if(blocked){
      stopAutoRun();clearInputs();
      if((state==='play'||state==='shop')&&!paused){
        orientationWasPaused=paused;orientationPausedGame=true;paused=true;syncPauseButtons();
      }
    }else if(orientationPausedGame){
      if(!orientationWasPaused&&(state==='play'||state==='shop')) paused=false;
      orientationPausedGame=false;orientationWasPaused=false;syncPauseButtons();
    }
  }
  function stickVector(stick,knob,ev){
    const rect=stick.getBoundingClientRect();
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    let dx=ev.clientX-cx,dy=ev.clientY-cy;
    const max=Math.max(18,rect.width*.34),distance=Math.hypot(dx,dy);
    if(distance>max){dx=dx/distance*max;dy=dy/distance*max}
    if(knob) knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    const strength=Math.min(1,distance/max);
    if(strength<.16) return {x:0,y:0,strength:0};
    const n=normalize(dx,dy);
    return {x:n.x*strength,y:n.y*strength,strength};
  }
  function updateMoveStick(ev){
    const v=stickVector(moveStick,moveKnob,ev);
    mobileMove.x=v.x;mobileMove.y=v.y;
    if(v.strength>.34&&!mobileMove.registered){mobileMove.registered=true;registerMobileDirection(v.x,v.y)}
    if(autoRun.active&&v.strength>.25){
      const n=normalize(v.x,v.y);
      if(Math.abs(n.x-autoRun.dx)>.2||Math.abs(n.y-autoRun.dy)>.2) stopAutoRun();
    }
  }
  function updateAimStick(ev){
    const v=stickVector(aimStick,aimKnob,ev);
    if(v.strength>.18){
      const d=nearestAimDirection(v.x,v.y);
      mobileAim.x=d.x;mobileAim.y=d.y;aimDir=d;
    }
  }
  function endMoveStick(ev){
    if(ev&&mobileMove.pointerId!==null&&ev.pointerId!==mobileMove.pointerId) return;
    mobileMove.active=false;mobileMove.pointerId=null;mobileMove.x=0;mobileMove.y=0;mobileMove.registered=false;
    resetKnob(moveKnob);moveStick.classList.remove('is-active');
  }
  function endAimStick(ev){
    if(ev&&mobileAim.pointerId!==null&&ev.pointerId!==mobileAim.pointerId) return;
    mobileAim.active=false;mobileAim.pointerId=null;
    resetKnob(aimKnob);aimStick.classList.remove('is-active');
  }
  function mobileJump(){
    unlockSoundAssets();stopAutoRun();
    if(state==='play') startJump();
    else if(state==='shop'&&!paused&&player&&player.jumpCooldown<=0){player.jumpTimer=.52;player.jumpCooldown=.82;sfx('jump')}
  }
  function updateMobileCombat(){
    if(!isMobileDevice||mobileOrientationBlocked||paused||overlay||anyModalOpen()) return;
    if(mobileAim.active&&state==='play'&&!transition){
      const d=nearestAimDirection(mobileAim.x,mobileAim.y);aimDir=d;attackSword(d);
    }
  }
  function bindPressButton(button,action){
    if(!button) return;
    button.addEventListener('pointerdown',ev=>{
      ev.preventDefault();button.classList.add('is-pressed');try{button.setPointerCapture?.(ev.pointerId)}catch{} action();
    });
    const release=()=>button.classList.remove('is-pressed');
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  function setupMobileControls(){
    if(!isMobileDevice) return;
    const beginMove=ev=>{
      ev.preventDefault();unlockSoundAssets();
      mobileMove.active=true;mobileMove.pointerId=ev.pointerId;mobileMove.registered=false;
      try{moveStick.setPointerCapture?.(ev.pointerId)}catch{} moveStick.classList.add('is-active');updateMoveStick(ev);
    };
    moveStick.addEventListener('pointerdown',beginMove);
    moveStick.addEventListener('pointermove',ev=>{if(mobileMove.active&&ev.pointerId===mobileMove.pointerId){ev.preventDefault();updateMoveStick(ev)}});
    moveStick.addEventListener('pointerup',endMoveStick);moveStick.addEventListener('pointercancel',endMoveStick);moveStick.addEventListener('lostpointercapture',endMoveStick);

    aimStick.addEventListener('pointerdown',ev=>{
      ev.preventDefault();unlockSoundAssets();stopAutoRun();
      mobileAim.active=true;mobileAim.pointerId=ev.pointerId;try{aimStick.setPointerCapture?.(ev.pointerId)}catch{} aimStick.classList.add('is-active');updateAimStick(ev);
      if(state==='play'&&!paused&&!transition) attackSword(aimDir);
    });
    aimStick.addEventListener('pointermove',ev=>{if(mobileAim.active&&ev.pointerId===mobileAim.pointerId){ev.preventDefault();updateAimStick(ev)}});
    aimStick.addEventListener('pointerup',endAimStick);aimStick.addEventListener('pointercancel',endAimStick);aimStick.addEventListener('lostpointercapture',endAimStick);

    bindPressButton(mobileJumpBtn,mobileJump);
    bindPressButton(mobileBombBtn,()=>{unlockSoundAssets();placeBomb()});
    bindPressButton(mobileActiveBtn,()=>{unlockSoundAssets();useActive()});

    mobileNewBtn.addEventListener('click',()=>{unlockSoundAssets();openNewRunModal()});
    mobilePauseBtn.addEventListener('click',()=>{unlockSoundAssets();if(!anyModalOpen()&&!overlay)togglePause()});
    mobileHelpBtn.addEventListener('click',()=>{unlockSoundAssets();if(!anyModalOpen())openOverlay('help')});
    mobileSoundBtn.addEventListener('click',async()=>{
      soundOn=!soundOn;syncSoundButtons();
      if(soundOn){await unlockSoundAssets();applySoundVolume();sfx('rupee')}
    });
    window.addEventListener('resize',updateMobileOrientation,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(updateMobileOrientation,80),{passive:true});
    document.addEventListener('contextmenu',ev=>{if(ev.target.closest?.('.mobile-controls'))ev.preventDefault()});
    updateMobileOrientation();
  }

  function getScores(){
    try{return JSON.parse(localStorage.getItem('greenbladeScoresV3')||'[]').map(s=>({...s,seed:s.seed||'LEGACY'}))}catch{return []}
  }
  function saveRunScore(){
    if(runRecorded||!player) return;
    runRecorded=true;
    const scores=getScores();
    scores.push({stage,date:new Date().toLocaleString(),ts:Date.now(),seed:runSeed||'UNKNOWN'});
    scores.sort((a,b)=>b.stage-a.stage || (b.ts||0)-(a.ts||0));
    localStorage.setItem('greenbladeScoresV3',JSON.stringify(scores.slice(0,3)));
  }

  function makePlayer(){
    return {
      x:UNIT_W/2,y:UNIT_H/2,r:14,speed:142,hp:3,maxHp:3,rupees:0,bombCount:3,keyCount:0,
      inv:0,attackTimer:0,attackCooldown:0.32,attackDir:AIM_DIRS[0],attackHit:new Set(),
      jumpTimer:0,jumpCooldown:0,jumpDir:{x:0,y:1},lastSafe:{x:UNIT_W/2,y:UNIT_H/2},facing:'S',
      passive:{powerSword:0,quickSword:0,orbital:0,ward:0,maxHeart:0,speed:0,bombRadius:0,luck:0,mirrorShield:0,beamBless:0,magnet:0,secondWind:0},
      wardReady:0,active:null,activeCooldown:0,activeCharges:0,orbitNovaTimer:0,orbitAngle:0
    };
  }

  function makeRoom(id,gx,gy,w,h,kind='normal'){
    return {id,gx,gy,w,h,kind,links:[],visited:false,cleared:false,enemies:[],pickups:[],chests:[],holes:[],blocks:[],stairs:null,initialized:false};
  }
  function occupiedCells(room){
    const out=[];
    for(let y=room.gy;y<room.gy+room.h;y++) for(let x=room.gx;x<room.gx+room.w;x++) out.push(`${x},${y}`);
    return out;
  }
  function canPlace(gx,gy,w,h,occupied){
    if(gx<-8||gy<-8||gx+w>9||gy+h>9) return false;
    for(let y=gy;y<gy+h;y++) for(let x=gx;x<gx+w;x++) if(occupied.has(`${x},${y}`)) return false;
    return true;
  }
  function makeLinkedPair(a,b,dir,secret=false,method=null){
    const d=CARDINALS.find(v=>v.key===dir);
    let globalCoord;
    if(dir==='E'||dir==='W'){
      const lo=Math.max(a.gy,b.gy), hi=Math.min(a.gy+a.h,b.gy+b.h);
      globalCoord=(lo+hi)/2;
    }else{
      const lo=Math.max(a.gx,b.gx), hi=Math.min(a.gx+a.w,b.gx+b.w);
      globalCoord=(lo+hi)/2;
    }
    const la={to:b.id,dir,secret,method,opened:!secret,revealed:false,globalCoord};
    const lb={to:a.id,dir:d.opposite,secret,method,opened:!secret,revealed:false,globalCoord};
    a.links.push(la); b.links.push(lb);
  }
  function candidatePlacement(parent,w,h,dir){
    if(dir==='E') return {gx:parent.gx+parent.w,gy:randi(parent.gy-h+1,parent.gy+parent.h-1)};
    if(dir==='W') return {gx:parent.gx-w,gy:randi(parent.gy-h+1,parent.gy+parent.h-1)};
    if(dir==='S') return {gx:randi(parent.gx-w+1,parent.gx+parent.w-1),gy:parent.gy+parent.h};
    return {gx:randi(parent.gx-w+1,parent.gx+parent.w-1),gy:parent.gy-h};
  }
  function generateDungeon(){
    reseed(`stage:${stage}`);
    rooms=[]; roomById=new Map();
    const occupied=new Set();
    const start=makeRoom(0,0,0,1,1,'start');
    rooms.push(start); roomById.set(0,start); occupiedCells(start).forEach(v=>occupied.add(v));

    let attempts=0;
    while(rooms.filter(r=>!r.kind.startsWith('secret')).length<MAX_MAIN_ROOMS && attempts++<1200){
      const parents=rooms.filter(r=>!r.kind.startsWith('secret'));
      const parent=choose(parents);
      const [w,h]=choose(ROOM_SIZES);
      const dirs=CARDINALS.slice().sort(()=>random01()-.5);
      let placed=false;
      for(const d of dirs){
        for(let tries=0;tries<7;tries++){
          const p=candidatePlacement(parent,w,h,d.key);
          if(!canPlace(p.gx,p.gy,w,h,occupied)) continue;
          const room=makeRoom(rooms.length,p.gx,p.gy,w,h,'normal');
          rooms.push(room); roomById.set(room.id,room); occupiedCells(room).forEach(v=>occupied.add(v));
          makeLinkedPair(parent,room,d.key);
          placed=true; break;
        }
        if(placed) break;
      }
    }

    while(rooms.length<MAX_MAIN_ROOMS){
      const parent=rooms[rooms.length-1];
      const d=choose(CARDINALS);
      const p=candidatePlacement(parent,1,1,d.key);
      if(canPlace(p.gx,p.gy,1,1,occupied)){
        const room=makeRoom(rooms.length,p.gx,p.gy,1,1,'normal');
        rooms.push(room);roomById.set(room.id,room);occupiedCells(room).forEach(v=>occupied.add(v));makeLinkedPair(parent,room,d.key);
      }else attempts++;
      if(attempts>2000) break;
    }

    const mainRooms=rooms.slice();
    const distance=new Map([[0,0]]), queue=[0];
    while(queue.length){
      const id=queue.shift(), room=roomById.get(id);
      for(const link of room.links){
        if(distance.has(link.to)) continue;
        distance.set(link.to,distance.get(id)+1); queue.push(link.to);
      }
    }
    const bossRoom=mainRooms.filter(r=>r.id!==0).sort((a,b)=>(distance.get(b.id)||0)-(distance.get(a.id)||0))[0];
    if(bossRoom) bossRoom.kind='boss';

    const secretCount=randi(1,2);
    for(let s=0;s<secretCount;s++){
      let made=false;
      for(let tries=0;tries<180&&!made;tries++){
        const parent=choose(mainRooms.filter(r=>r.kind!=='boss'));
        const dirs=CARDINALS.slice().sort(()=>random01()-.5);
        for(const d of dirs){
          const p=candidatePlacement(parent,1,1,d.key);
          if(!canPlace(p.gx,p.gy,1,1,occupied)) continue;
          const method=chance(.5)?'key':'bomb';
          const room=makeRoom(rooms.length,p.gx,p.gy,1,1,'secret');
          rooms.push(room);roomById.set(room.id,room);occupiedCells(room).forEach(v=>occupied.add(v));
          makeLinkedPair(parent,room,d.key,true,method); made=true; break;
        }
      }
    }

    for(const room of rooms) initializeRoom(room);
    start.visited=true; start.cleared=true;
    currentRoomId=0;
  }

  function doorLocal(room,link){
    const size=roomSize(room);
    if(link.dir==='N'||link.dir==='S'){
      return {x:(link.globalCoord-room.gx)*UNIT_W,y:link.dir==='N'?0:size.h};
    }
    return {x:link.dir==='W'?0:size.w,y:(link.globalCoord-room.gy)*UNIT_H};
  }
  function randomFloorSpot(room,r=14,extra=[],doorClear=112){
    const size=roomSize(room);
    const edgePad=Math.max(WALL+40,r+WALL+12);
    for(let tries=0;tries<420;tries++){
      const p={x:rand(edgePad,size.w-edgePad),y:rand(edgePad,size.h-edgePad),r};
      if(Math.hypot(p.x-size.w/2,p.y-size.h/2)<48+r*.25) continue;
      if(room.links.some(l=>{const d=doorLocal(room,l);return Math.hypot(p.x-d.x,p.y-d.y)<doorClear+r*.35})) continue;
      if(room.holes.some(h=>circleRect(p,h))) continue;
      if(room.blocks.some(b=>!b.destroyed&&circleRect(p,b))) continue;
      if(room.chests.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<48+r)) continue;
      if(extra.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<r+(e.r||12)+18)) continue;
      return p;
    }
    return {x:size.w/2,y:size.h/2,r};
  }
  function initializeRoom(room){
    if(room.initialized) return;
    room.initialized=true;
    const size=roomSize(room), area=room.w*room.h;

    if(room.kind!=='start' && chance(.62)){
      const holeCount=randi(1,Math.min(4,area+1));
      for(let i=0;i<holeCount;i++){
        const w=randi(30,60),h=randi(24,48);
        const p=randomFloorSpot(room,Math.max(w,h)/2+10,[],145);
        room.holes.push({x:p.x-w/2,y:p.y-h/2,w,h});
      }
    }
    if(room.kind!=='boss' && room.kind!=='start'){
      const blockCount=randi(0,Math.min(7,area*2+1));
      for(let i=0;i<blockCount;i++){
        const p=randomFloorSpot(room,18),secret=chance(.16);
        const reward=secret?makeChestReward(true):(chance(.3)?{type:'loot',lootRoll:random01(),lootVariant:random01()}:null);
        room.blocks.push({x:p.x-16,y:p.y-16,w:32,h:32,destroyed:false,secret,reward});
      }
    }

    if(room.kind==='boss'){
      room.enemies=[makeBoss(choose(BOSS_TYPES),size.w/2,size.h/2)];
    }else if(room.kind==='secret'){
      room.cleared=true;
      const count=randi(1,2);
      for(let i=0;i<count;i++){
        const p=randomFloorSpot(room,12);
        room.pickups.push(makeUpgradePickup(p.x,p.y,chance(.58)?'passive':'active'));
      }
      if(chance(.55)){
        const p=randomFloorSpot(room,12);
        room.chests.push({x:p.x,y:p.y,locked:false,opened:false,rare:true,reward:makeChestReward(true)});
      }
    }else if(room.kind==='start'){
      room.cleared=true;
    }else{
      const count=clamp(randi(2,4)+Math.floor(stage*.45)+area-1,2,11);
      for(let i=0;i<count;i++){
        const p=randomFloorSpot(room,13,room.enemies);
        room.enemies.push(makeEnemy(choose(ENEMY_TYPES.slice(0,clamp(5+stage,5,ENEMY_TYPES.length))),p.x,p.y));
      }
      if(chance(.46)){
        const p=randomFloorSpot(room,14);
        const rare=chance(.18);room.chests.push({x:p.x,y:p.y,locked:chance(.22),opened:false,rare,reward:makeChestReward(rare)});
      }
      if(chance(.10)){
        const p=randomFloorSpot(room,10);
        room.pickups.push({type:'key',x:p.x,y:p.y,r:8,bob:rand(0,6)});
      }
    }
  }

  function makeEnemy(type,x,y){
    const scale=1+(stage-1)*.12;
    const base={type,x,y,r:12,vx:0,vy:0,hp:2,maxHp:2,speed:50,cool:rand(.2,1.2),state:'idle',timer:rand(.4,1.6),angle:rand(0,Math.PI*2),facing:{x:0,y:1},dead:false,hitFlash:0,grounded:true,shieldBlocks:0,stunTimer:0,lootRoll:random01(),lootVariant:random01()};
    const stats={
      slime:[2,44,15],bat:[1,66,12],skeleton:[3,52,15],archer:[2,38,15],spider:[2,58,14],shield:[4,42,16],burrow:[3,64,15],charger:[4,48,17],fire:[3,35,16],split:[3,40,17],wizard:[3,30,15],turret:[4,0,17],ghost:[3,48,15],
      mimic:[4,46,16],eye:[2,52,13],leech:[2,78,11],lancer:[4,43,16],orbiter:[3,56,14],summoner:[4,30,16],bomber:[3,48,15],iceMage:[3,34,15],moth:[2,70,13],centipede:[5,50,17]
    }[type]||[2,45,12];
    base.hp=base.maxHp=Math.max(1,Math.round(stats[0]*scale)); base.speed=stats[1]+stage*1.6; base.r=stats[2];
    if(type==='spider'){base.state='wait';base.timer=rand(1,2.2)}
    if(type==='burrow'){base.state='hidden';base.timer=rand(.8,1.8);base.grounded=false}
    if(type==='charger') base.state='aim';
    if(type==='turret') base.cool=rand(.3,1);
    if(type==='mimic'){base.state='sleep';base.timer=.1}
    if(type==='lancer'){base.state='stalk';base.timer=rand(.5,1.2)}
    if(type==='orbiter'){base.angle=rand(0,Math.PI*2);base.orbitRadius=rand(90,145)}
    if(type==='summoner'){base.summons=0;base.cool=rand(1.2,2.2)}
    if(type==='bomber'){base.fuse=0}
    if(type==='iceMage') base.cool=rand(.4,1.2);
    if(type==='moth') base.angle=rand(0,Math.PI*2);
    if(type==='centipede'){base.state='crawl';base.angle=rand(0,Math.PI*2)}
    return base;
  }
  function makeBoss(type,x,y){
    const hp=20+stage*7;
    return {type:'boss',bossType:type,x,y,r:32,vx:0,vy:0,hp,maxHp:hp,speed:50+stage*2,cool:1.2,state:type==='sandWyrm'?'burrow':'idle',timer:1.2,angle:0,facing:{x:0,y:1},dead:false,hitFlash:0,phase:0,grounded:type!=='sandWyrm',stuckTimer:0,lastMoveX:x,lastMoveY:y,bossReward:{type:'passive',id:choose(Object.keys(PASSIVES))}};
  }
  function makeUpgradePickup(x,y,kind){
    if(kind==='passive'){
      const id=choose(Object.keys(PASSIVES));
      return {type:'passive',id,x,y,r:11,bob:rand(0,6)};
    }
    const id=choose(Object.keys(ACTIVES));
    return {type:'active',id,x,y,r:11,bob:rand(0,6)};
  }
  function makeChestReward(rare=false){
    if(rare||chance(.22)){
      const type=chance(.55)?'passive':'active';
      const id=choose(Object.keys(type==='passive'?PASSIVES:ACTIVES));
      return {type,id};
    }
    return {type:choose(['rupee5','rupee5','heart','bomb','key','charge','charge'])};
  }
  function dropLoot(room,x,y,fromBoss=false,source=null){
    const luck=player.passive.luck||0;
    const roll=source?.lootRoll??random01(),variant=source?.lootVariant??random01();
    if(fromBoss){
      const reward=source?.bossReward||{type:'passive',id:choose(Object.keys(PASSIVES))};
      room.pickups.push({type:reward.type,id:reward.id,x:x-18,y,r:11,bob:0});
      room.pickups.push({type:'rupee5',x:x+18,y,r:9,bob:0});
      return;
    }
    // Enemies occasionally leave useful loot behind. Luck raises every drop band.
    if(roll<.2+luck*.05) room.pickups.push({type:'heartHalf',x,y,r:8,bob:0});
    else if(roll<.48+luck*.08) room.pickups.push({type:variant<.18?'rupee5':'rupee',x,y,r:8,bob:0});
    else if(roll<.54+luck*.09) room.pickups.push({type:'bomb',x,y,r:8,bob:0});
    else if(roll<.56+luck*.1) room.pickups.push({type:'key',x,y,r:8,bob:0});
    else if(usesCharges(player.active)&&roll<.61+luck*.105) room.pickups.push({type:'charge',amount:2,x,y,r:8,bob:0});
    else if(roll<.61+luck*.11) room.pickups.push({type:'charge',x,y,r:9,bob:0,amount:2});
  }

  function startRun(seedId=generateSeedId()){
    if((state==='play'||state==='shop')&&!runRecorded) saveRunScore();
    runSeed=normalizeSeed(seedId)||generateSeedId();fxState=hashSeed(`${runSeed}|visuals`);
    stage=1; player=makePlayer(); projectiles=[]; bombs=[]; particles=[]; blastEffects=[]; transition=null; shop=null; runRecorded=false;stopAutoRun();
    generateDungeon();
    const start=currentRoom(), size=roomSize(start);
    player.x=size.w/2;player.y=size.h/2;player.lastSafe={x:player.x,y:player.y};
    state='play';paused=false;overlay=null;overlayPausedGame=false;stageBanner=2.2;clearInputs();syncPauseButtons();setMessage(`Seed ${runSeed} · Explore the dungeon.`,3.4);
  }
  function beginNextStage(){
    stage++;stopAutoRun();
    player.hp=Math.min(player.maxHp,player.hp+1+(player.passive.secondWind||0));
    player.wardReady=player.passive.ward>0?1:0;
    player.activeCooldown=0;player.orbitNovaTimer=0;
    projectiles=[];bombs=[];particles=[];blastEffects=[];shop=null;
    generateDungeon();
    const start=currentRoom(),size=roomSize(start);
    player.x=size.w/2;player.y=size.h/2;player.lastSafe={x:player.x,y:player.y};
    state='play';stageBanner=2.2;setMessage(`Stage ${stage}: enemies are stronger.`,2.7);
  }
  function enterShop(){
    state='shop'; projectiles=[];bombs=[];particles=[];blastEffects=[];
    player.attackTimer=0;
    shopReturnRoomId=currentRoomId;
    if(!shop || shop.stage!==stage){
      reseed(`shop:${stage}`);
      const inventory=[];
      const pool=[...Object.keys(PASSIVES).map(id=>({kind:'passive',id})),...Object.keys(ACTIVES).map(id=>({kind:'active',id})),{kind:'supply',id:'bombs'},{kind:'supply',id:'heal'},{kind:'supply',id:'key'}];
      while(inventory.length<6){
        const it=choose(pool);
        if(inventory.some(v=>v.kind===it.kind&&v.id===it.id)) continue;
        const def=it.kind==='passive'?PASSIVES[it.id]:it.kind==='active'?ACTIVES[it.id]:null;
        const price=def?def.price+Math.floor(stage*2.5):it.id==='bombs'?12+stage:it.id==='heal'?10+stage:18+stage*2;
        inventory.push({...it,price,bought:false});
      }
      shop={stage,items:inventory,merchant:{x:480,y:164},backExit:{x:258,y:548,r:24},exit:{x:702,y:548,r:24}};
    }
    player.x=480;player.y=500;player.lastSafe={x:480,y:500};
    setMessage('Merchant: click an item to buy it. Use the upper stair to return or the lower stair to descend.',4.2);
  }
  function itemName(item){
    if(item.kind==='passive') return PASSIVES[item.id].name;
    if(item.kind==='active') return ACTIVES[item.id].name;
    return item.id==='bombs'?'Bomb Bundle':item.id==='heal'?'Full Heal':'Skeleton Key';
  }
  function itemDesc(item){
    if(item.kind==='passive') return PASSIVES[item.id].desc;
    if(item.kind==='active') return ACTIVES[item.id].desc;
    return item.id==='bombs'?'+4 bombs.':item.id==='heal'?'Restore all hearts.':'+1 key.';
  }
  function buyShopItem(index){
    if(state!=='shop'||paused) return;
    const item=shop.items[index];
    if(!item||item.bought) return;
    if(player.rupees<item.price){sfx('error');setMessage('Not enough rupees.',1.5);return}
    player.rupees-=item.price;item.bought=true;sfx('buy');
    if(item.kind==='passive') grantPassive(item.id);
    else if(item.kind==='active') equipActive(item.id);
    else if(item.id==='bombs') player.bombCount+=4;
    else if(item.id==='heal') player.hp=player.maxHp;
    else player.keyCount++;
    setMessage(`Purchased ${itemName(item)}.`,1.8);
  }
  function grantPassive(id){
    player.passive[id]=(player.passive[id]||0)+1;
    if(id==='maxHeart'){player.maxHp+=1;player.hp=Math.min(player.maxHp,player.hp+1)}
    if(id==='ward') player.wardReady=1;
  }
  function facingVector(){
    return player.facing==='N'?{x:0,y:-1}:player.facing==='S'?{x:0,y:1}:player.facing==='W'?{x:-1,y:0}:{x:1,y:0};
  }
  function safeDropSpot(preferredX,preferredY,r=11){
    if(state==='shop'){
      return {x:clamp(preferredX,SHOP_VIEW.x+48,SHOP_VIEW.x+SHOP_VIEW.w-48),y:clamp(preferredY,SHOP_VIEW.y+48,SHOP_VIEW.y+SHOP_VIEW.h-48)};
    }
    const room=currentRoom();
    const tries=[[0,0],[16,0],[-16,0],[0,16],[0,-16],[24,16],[-24,16],[24,-16],[-24,-16],[38,0],[-38,0],[0,38],[0,-38]];
    for(const [ox,oy] of tries){
      const x=preferredX+ox,y=preferredY+oy;
      if(x<r+WALL||y<r+WALL||x>roomSize(room).w-r-WALL||y>roomSize(room).h-r-WALL) continue;
      if(holeAt(room,x,y,r*.55) || solidBlockAt(room,x,y,r)) continue;
      return {x,y};
    }
    const p=randomFloorSpot(room,r,[],90);
    return {x:p.x,y:p.y};
  }
  function equipActive(id,incomingCharges=null){
    if(player.active && player.active!==id){
      const dir=aimDir||facingVector();
      const drop=safeDropSpot(player.x+dir.x*36,player.y+dir.y*36,12);
      if(state==='play'||state==='shop'){
        const targetList = state==='play' ? currentRoom().pickups : (shop.droppedItems||(shop.droppedItems=[]));
        targetList.push({type:'active',id:player.active,x:drop.x,y:drop.y,r:11,bob:0,dropped:true,charges:player.activeCharges});
      }
    }
    player.active=id;player.activeCooldown=0;
    const max=activeMaxCharges(id);
    player.activeCharges=max?clamp(incomingCharges==null?max:incomingCharges,0,max):0;
  }

  function cameraFor(room){
    const size=roomSize(room);
    const camX=size.w>VIEW.w?clamp(player.x-VIEW.w/2,0,size.w-VIEW.w):0;
    const camY=size.h>VIEW.h?clamp(player.y-VIEW.h/2,0,size.h-VIEW.h):0;
    return {
      x:camX,y:camY,
      ox:VIEW.x+(size.w<VIEW.w?(VIEW.w-size.w)/2:0)-camX,
      oy:VIEW.y+(size.h<VIEW.h?(VIEW.h-size.h)/2:0)-camY
    };
  }
  function screenToWorld(sx,sy){
    const room=currentRoom(), cam=cameraFor(room);
    return {x:sx-cam.ox,y:sy-cam.oy};
  }
  function linkPair(link){
    const other=roomById.get(link.to);
    return other.links.find(l=>l.to===currentRoomId&&l.secret===link.secret);
  }
  function setLinkOpened(room,link){
    link.opened=true;link.revealed=true;
    const other=roomById.get(link.to);
    const back=other.links.find(l=>l.to===room.id&&l.secret===link.secret);
    if(back){back.opened=true;back.revealed=true}
  }
  function canUseNormalDoor(room){ return room.cleared || room.kind==='start' || room.kind==='secret'; }
  function nearDoor(room,link,margin=23){
    const d=doorLocal(room,link), size=roomSize(room);
    if(link.dir==='N') return player.y<WALL+margin && Math.abs(player.x-d.x)<DOOR_HALF;
    if(link.dir==='S') return player.y>size.h-WALL-margin && Math.abs(player.x-d.x)<DOOR_HALF;
    if(link.dir==='W') return player.x<WALL+margin && Math.abs(player.y-d.y)<DOOR_HALF;
    return player.x>size.w-WALL-margin && Math.abs(player.y-d.y)<DOOR_HALF;
  }
  function tryDoors(room){
    if(transition) return;
    for(const link of room.links){
      if(!nearDoor(room,link)) continue;
      if(link.secret){
        if(!link.opened){
          if(link.method==='key'){
            if(player.keyCount>0){player.keyCount--;setLinkOpened(room,link);sfx('door');setMessage('The secret lock clicks open.',1.5)}
            else {setMessage('A rare key is needed here.',1.2);continue}
          }else{setMessage('This wall sounds hollow...',1.2);continue}
        }
      }else if(!canUseNormalDoor(room)){
        setMessage('Defeat every enemy to unlock the doors.',1.1);continue;
      }
      beginRoomTransition(room,link);return;
    }
  }
  function beginRoomTransition(room,link){
    sfx('door');
    transition={from:room.id,to:link.to,dir:link.dir,t:0,duration:.34};
    clearInputs();
  }
  function finishRoomTransition(){
    const tr=transition, next=roomById.get(tr.to);
    currentRoomId=next.id;next.visited=true;
    const back=next.links.find(l=>l.to===tr.from);
    const d=doorLocal(next,back), size=roomSize(next), inset=WALL+30;
    if(back.dir==='N'){player.x=d.x;player.y=inset}
    if(back.dir==='S'){player.x=d.x;player.y=size.h-inset}
    if(back.dir==='W'){player.x=inset;player.y=d.y}
    if(back.dir==='E'){player.x=size.w-inset;player.y=d.y}
    player.lastSafe={x:player.x,y:player.y};
    transition=null;
    if(next.kind==='boss'&&!next.cleared){sfx('boss');setMessage(`Boss: ${bossDisplayName(next.enemies[0]?.bossType)}`,2.4)}
    if(next.kind==='secret') setMessage('Secret room discovered!',2);
  }

  function solidBlockAt(room,x,y,r){
    return room.blocks.some(b=>!b.destroyed&&circleRect({x,y,r},b));
  }
  function holeAt(room,x,y,r=5){ return room.holes.some(h=>circleRect({x,y,r},h)); }
  function movePlayer(dt){
    const room=currentRoom(), size=roomSize(room);
    let manualDx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
    let manualDy=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
    if(isMobileDevice&&mobileMove.active){manualDx=mobileMove.x;manualDy=mobileMove.y}
    let dx=manualDx,dy=manualDy;
    if(autoRun.active){
      if((manualDx||manualDy)){
        const manual=normalize(manualDx,manualDy);
        if(Math.abs(manual.x-autoRun.dx)>.1||Math.abs(manual.y-autoRun.dy)>.1) stopAutoRun();
      }
      if(autoRun.active){dx=autoRun.dx;dy=autoRun.dy}
    }
    if(dx||dy){
      const n=normalize(dx,dy);dx=n.x;dy=n.y;
      if(Math.abs(dx)>Math.abs(dy)) player.facing=dx>0?'E':'W'; else player.facing=dy>0?'S':'N';
      player.jumpDir={x:dx,y:dy};
    }
    const speed=player.speed*(1+player.passive.speed*.09)*(autoRun.active?RUN_SPEED_MULTIPLIER:1);
    const jumping=player.jumpTimer>0;
    const tryAxis=(axis,amount)=>{
      if(Math.abs(amount)<.0001) return true;
      const nx=axis==='x'?player.x+amount:player.x, ny=axis==='y'?player.y+amount:player.y;
      if(nx<player.r+WALL||nx>size.w-player.r-WALL||ny<player.r+WALL||ny>size.h-player.r-WALL) return false;
      if(!jumping&&solidBlockAt(room,nx,ny,player.r)) return false;
      player[axis]+=amount;return true;
    };
    const movedX=tryAxis('x',dx*speed*dt),movedY=tryAxis('y',dy*speed*dt);
    if(autoRun.active&&(!movedX||!movedY)) stopAutoRun();

    if(jumping){
      player.jumpTimer=Math.max(0,player.jumpTimer-dt);
      if(player.jumpTimer===0){
        if(solidBlockAt(room,player.x,player.y,player.r)) resolveJumpLanding(room);
        if(holeAt(room,player.x,player.y,player.r*.35)) fallInHole();
        else if(!solidBlockAt(room,player.x,player.y,player.r)) player.lastSafe={x:player.x,y:player.y};
      }
    }else if(holeAt(room,player.x,player.y,player.r*.38)){
      fallInHole();
    }else if(!solidBlockAt(room,player.x,player.y,player.r)){
      player.lastSafe={x:player.x,y:player.y};
    }
    player.jumpCooldown=Math.max(0,player.jumpCooldown-dt);
    player.inv=Math.max(0,player.inv-dt);
    player.attackTimer=Math.max(0,player.attackTimer-dt);
    player.activeCooldown=Math.max(0,player.activeCooldown-dt);
    player.orbitNovaTimer=Math.max(0,player.orbitNovaTimer-dt);
    player.orbitAngle+=dt*3.2;
    tryDoors(room);
  }
  function startJump(){
    if(paused||state!=='play'||transition||player.jumpCooldown>0) return;
    const dir=facingVector();
    player.jumpDir=(player.jumpDir && (player.jumpDir.x||player.jumpDir.y))?player.jumpDir:dir;
    player.jumpTimer=.52;player.jumpCooldown=.82;sfx('jump');
  }
  function resolveJumpLanding(room){
    const size=roomSize(room);
    const dir=(player.jumpDir && (player.jumpDir.x||player.jumpDir.y))?normalize(player.jumpDir.x,player.jumpDir.y):facingVector();
    const tryOffsets=[20,28,36,46,56];
    for(const step of tryOffsets){
      const nx=player.x+dir.x*step, ny=player.y+dir.y*step;
      if(nx<player.r+WALL||ny<player.r+WALL||nx>size.w-player.r-WALL||ny>size.h-player.r-WALL) continue;
      if(!solidBlockAt(room,nx,ny,player.r) && !holeAt(room,nx,ny,player.r*.35)){ player.x=nx; player.y=ny; return; }
    }
    for(const step of tryOffsets){
      const nx=player.x-dir.x*step, ny=player.y-dir.y*step;
      if(nx<player.r+WALL||ny<player.r+WALL||nx>size.w-player.r-WALL||ny>size.h-player.r-WALL) continue;
      if(!solidBlockAt(room,nx,ny,player.r) && !holeAt(room,nx,ny,player.r*.35)){ player.x=nx; player.y=ny; return; }
    }
    player.x=player.lastSafe.x; player.y=player.lastSafe.y;
  }
  function fallInHole(){
    stopAutoRun();
    sfx('fall');spawnParticles(player.x,player.y,'#151715',14);
    player.x=player.lastSafe.x;player.y=player.lastSafe.y;
    hurtPlayer(.5,true);
    setMessage('You fell and lost half a heart.',1.5);
  }

  function attackSword(dir){
    if(paused||state!=='play'||transition) return;
    stopAutoRun();
    if(player.attackTimer>0) return;
    player.attackDir=dir;aimDir=dir;player.attackHit=new Set();
    const quick=Math.min(.14,player.passive.quickSword*.035);
    player.attackTimer=.18;player.attackCooldown=Math.max(.16,.32-quick);
    sfx('sword');
    swordDamageTick();
    if(player.hp>=3){
      const beamBonus=player.passive.beamBless||0;
      spawnProjectile({owner:'player',type:'beam',x:player.x+dir.x*24,y:player.y+dir.y*24,vx:dir.x*(280+beamBonus*45),vy:dir.y*(280+beamBonus*45),r:6,damage:1+player.passive.powerSword*.35+beamBonus*.65,life:2.4+beamBonus*.35,pierce:false});
      sfx('beam');
    }
  }
  function swordDamageTick(){
    const room=currentRoom();
    if(player.attackTimer<=0) return;
    const dir=player.attackDir, hand={x:player.x+dir.x*14,y:player.y+dir.y*14};
    const tip={x:hand.x+dir.x*55,y:hand.y+dir.y*55};
    for(const e of room.enemies){
      if(e.dead||player.attackHit.has(e)) continue;
      const d=pointSegmentDistance(e.x,e.y,hand.x,hand.y,tip.x,tip.y);
      if(d<e.r+8){
        player.attackHit.add(e);
        damageEnemy(room,e,1+player.passive.powerSword,player.x,player.y);
      }
    }
  }
  function pointSegmentDistance(px,py,x1,y1,x2,y2){
    const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
    const t=l2?clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1):0;
    return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
  }

  function useActive(){
    if(paused||state!=='play'||transition||!player.active) return;
    stopAutoRun();
    if(player.activeCooldown>0){setMessage('Active item is recharging.',.8);return}
    const d=aimDir;
    if(player.active==='boomerang'){
      spawnProjectile({owner:'player',type:'boomerang',x:player.x,y:player.y,vx:d.x*260,vy:d.y*260,r:8,damage:2,life:1.8,pierce:true,returning:true,age:0});
      player.activeCooldown=1.1;
    }else if(player.active==='arrows'){
      if(player.rupees<1){sfx('error');setMessage('The Silver Bow needs 1 rupee.',1.2);return}
      player.rupees--;spawnProjectile({owner:'player',type:'arrow',x:player.x,y:player.y,vx:d.x*470,vy:d.y*470,r:5,damage:5.2,life:2.2,pierce:false});player.activeCooldown=.26;
    }else if(player.active==='triple'){
      for(const off of [-.22,0,.22]){
        const a=d.a+off;spawnProjectile({owner:'player',type:'magic',x:player.x,y:player.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:6,damage:1.4,life:2,pierce:false});
      }player.activeCooldown=.75;
    }else if(player.active==='burst'){
      if(player.activeCharges<=0){sfx('error');setMessage('The rune has no charges.',1.2);return}
      player.activeCharges--;
      for(const q of AIM_DIRS) spawnProjectile({owner:'player',type:'rune',x:player.x,y:player.y,vx:q.x*250,vy:q.y*250,r:6,damage:1.7,life:1.8,pierce:false});
      player.activeCooldown=.9;
    }else if(player.active==='homing'){
      if(player.activeCharges<=0){sfx('error');setMessage('The flame has no charges.',1.2);return}
      player.activeCharges--;
      spawnProjectile({owner:'player',type:'homing',x:player.x,y:player.y,vx:d.x*180,vy:d.y*180,r:7,damage:2.4,life:3,pierce:false,homing:true});
      player.activeCooldown=.6;
    }else if(player.active==='orbitNova'){
      player.orbitNovaTimer=7;player.activeCooldown=10;
    }else if(player.active==='pierceLance'){
      spawnProjectile({owner:'player',type:'lance',x:player.x,y:player.y,vx:d.x*360,vy:d.y*360,r:7,damage:3.4,life:2.2,pierce:true});
      player.activeCooldown=.95;
    }else if(player.active==='frostOrb'){
      if(player.activeCharges<=0){sfx('error');setMessage('The Frost Orb has no charges.',1.2);return}
      player.activeCharges--;
      spawnProjectile({owner:'player',type:'frost',x:player.x,y:player.y,vx:d.x*210,vy:d.y*210,r:8,damage:1.5,life:2.6,pierce:false,freeze:2.2});
      player.activeCooldown=.75;
    }else if(player.active==='chainSpark'){
      const targets=currentRoom().enemies.filter(e=>!e.dead).sort((a,b)=>dist(a,player)-dist(b,player)).slice(0,4);
      if(!targets.length){sfx('error');setMessage('No nearby enemy for Chain Spark.',1.0);return}
      const damages=[3.4,2.6,2.1,1.7];
      for(let i=0;i<targets.length;i++){
        const e=targets[i];
        if(dist(e, i?targets[i-1]:player) < 240){
          damageEnemy(currentRoom(),e,damages[i]||1.5, i?targets[i-1].x:player.x, i?targets[i-1].y:player.y);
          spawnParticles(e.x,e.y,'#8fd7ff',12);
        }
      }
      player.activeCooldown=2.1;
    }else if(player.active==='bombStaff'){
      spawnProjectile({owner:'player',type:'bomborb',x:player.x,y:player.y,vx:d.x*245,vy:d.y*245,r:7,damage:1.4,life:1.7,pierce:false,explosive:true});
      player.activeCooldown=1.25;
    }
    sfx('active');
  }
  function placeBomb(){
    if(paused||state!=='play'||transition) return;
    stopAutoRun();
    if(player.bombCount<=0){sfx('error');setMessage('No bombs remaining.',1);return}
    if(bombs.some(b=>b.roomId===currentRoomId&&dist(b,player)<30)) return;
    player.bombCount--;bombs.push({x:player.x,y:player.y,r:8,timer:1.55,roomId:currentRoomId});sfx('active');
  }
  function spawnProjectile(p){ projectiles.push({...p,roomId:currentRoomId,dead:false,age:p.age||0}); }
  function detonateProjectile(room,p){
    const radius=52+(p.type==='bomborb'?18:0);
    blastEffects.push({x:p.x,y:p.y,radius,life:.22,maxLife:.22,roomId:currentRoomId});
    spawnParticles(p.x,p.y,'#f0c85a',18);
    for(const e of room.enemies){ if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<radius+e.r) damageEnemy(room,e,2.6,p.x,p.y); }
  }
  function canReflectProjectile(p){
    if(!player?.passive?.mirrorShield || p.owner==='player') return false;
    const facing=facingVector();
    const incoming=normalize(-p.vx,-p.vy);
    return facing.x*incoming.x + facing.y*incoming.y > 0.6;
  }

  function updateBombs(dt){
    const room=currentRoom();
    for(const b of bombs){
      if(b.roomId!==currentRoomId) continue;
      b.timer-=dt;
      if(b.timer<=0&&!b.dead){b.dead=true;explodeBomb(room,b)}
    }
    bombs=bombs.filter(b=>!b.dead);
  }
  function explodeBomb(room,b){
    const radius=108+player.passive.bombRadius*24;
    sfx('bomb');shake=11;flash=.16;blastEffects.push({x:b.x,y:b.y,radius,life:.34,maxLife:.34,roomId:currentRoomId});spawnParticles(b.x,b.y,'#f0c85a',42);
    for(const e of room.enemies){
      if(!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<radius+e.r) damageEnemy(room,e,5+player.passive.bombRadius,b.x,b.y);
    }
    if(Math.hypot(player.x-b.x,player.y-b.y)<radius*.66&&player.jumpTimer<=0) hurtPlayer(1,false);
    for(const block of room.blocks){
      if(!block.destroyed&&Math.hypot(block.x+block.w/2-b.x,block.y+block.h/2-b.y)<radius){
        block.destroyed=true;spawnParticles(block.x+16,block.y+16,'#9c7950',12);
        if(block.reward){
          if(block.reward.type==='passive'||block.reward.type==='active') room.pickups.push({type:block.reward.type,id:block.reward.id,x:block.x+16,y:block.y+16,r:11,bob:0});
          else if(block.reward.type==='loot') dropLoot(room,block.x+16,block.y+16,false,block.reward);
        }
      }
    }
    for(const link of room.links){
      if(!link.secret||link.method!=='bomb'||link.opened) continue;
      const d=doorLocal(room,link);
      if(Math.hypot(d.x-b.x,d.y-b.y)<radius+55){setLinkOpened(room,link);sfx('door');setMessage('A hidden passage has been blasted open!',2)}
    }
  }

  function updateProjectiles(dt){
    const room=currentRoom(), size=roomSize(room);
    for(const p of projectiles){
      if(p.dead||p.roomId!==currentRoomId) continue;
      p.age=(p.age||0)+dt;p.life-=dt;
      if(p.returning&&p.age>.56){
        const n=normalize(player.x-p.x,player.y-p.y);p.vx=n.x*300;p.vy=n.y*300;
        if(Math.hypot(player.x-p.x,player.y-p.y)<18){p.dead=true;continue}
      }
      if(p.homing){
        const targets=room.enemies.filter(e=>!e.dead);
        if(targets.length){
          const target=targets.sort((a,b)=>dist(a,p)-dist(b,p))[0],n=normalize(target.x-p.x,target.y-p.y);
          p.vx=p.vx*.91+n.x*24;p.vy=p.vy*.91+n.y*24;
          const sp=Math.hypot(p.vx,p.vy),cap=260;if(sp>cap){p.vx=p.vx/sp*cap;p.vy=p.vy/sp*cap}
        }
      }
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.life<=0||p.x<WALL||p.y<WALL||p.x>size.w-WALL||p.y>size.h-WALL){if(p.explosive&&!p.dead) detonateProjectile(room,p); p.dead=true;continue}
      if(solidBlockAt(room,p.x,p.y,p.r)){if(p.explosive&&!p.dead) detonateProjectile(room,p); p.dead=true;continue}
      if(p.owner==='player'){
        for(const e of room.enemies){
          if(e.dead||!circleHit(p,e)) continue;
          damageEnemy(room,e,p.damage,player.x,player.y); if(p.freeze) e.freezeTimer=Math.max(e.freezeTimer||0,p.freeze*(e.type==='boss' ? .35 : 1)); spawnParticles(p.x,p.y,'#f5ef9e',5);
          if(p.explosive) detonateProjectile(room,p);
          if(!p.pierce){p.dead=true;break}
        }
      }else if(player.jumpTimer<=0&&circleHit(p,player)){
        if(canReflectProjectile(p)){
          const speed=Math.hypot(p.vx,p.vy)||180;
          const dir=facingVector();
          p.owner='player'; p.vx=dir.x*speed*1.05; p.vy=dir.y*speed*1.05; p.damage=(p.damage||.5)*0.9; p.life=Math.max(p.life,1.1);
          sfx('shield');
          continue;
        }
        p.dead=true;hurtPlayer(p.damage||.5,false);
      }
    }
    projectiles=projectiles.filter(p=>!p.dead);
  }

  function moveEnemy(room,e,dx,dy,dt,ignoreTerrain=false){
    const size=roomSize(room),startX=e.x,startY=e.y;
    const intended=Math.hypot(dx*dt,dy*dt);
    const axis=(key,amount)=>{
      const nx=key==='x'?e.x+amount:e.x,ny=key==='y'?e.y+amount:e.y;
      if(nx<e.r+WALL||nx>size.w-e.r-WALL||ny<e.r+WALL||ny>size.h-e.r-WALL) return false;
      if(!ignoreTerrain&&solidBlockAt(room,nx,ny,e.r)) return false;
      if(!ignoreTerrain&&holeAt(room,nx,ny,e.r*.35)) return false;
      e[key]+=amount;return true;
    };
    const movedX=axis('x',dx*dt),movedY=axis('y',dy*dt);
    const moved=Math.hypot(e.x-startX,e.y-startY);
    return {moved,blocked:intended>.1&&moved<intended*.35,movedX,movedY};
  }
  function bossNeedsRecovery(room,e){
    const size=roomSize(room);
    return e.x<e.r+WALL-1||e.y<e.r+WALL-1||e.x>size.w-e.r-WALL+1||e.y>size.h-e.r-WALL+1||solidBlockAt(room,e.x,e.y,e.r*.85)||holeAt(room,e.x,e.y,e.r*.55);
  }
  function recoverBossPosition(room,e){
    let spot=null;
    for(let i=0;i<20;i++){
      const p=randomFloorSpot(room,e.r+8,[player],140);
      if(Math.hypot(p.x-player.x,p.y-player.y)>105){spot=p;break}
    }
    if(!spot){const size=roomSize(room);spot={x:size.w/2,y:size.h/2}}
    spawnParticles(e.x,e.y,'#8b7654',14);
    e.x=spot.x;e.y=spot.y;e.vx=0;e.vy=0;e.state='idle';e.timer=.75;e.stuckTimer=0;e.grounded=true;
    spawnParticles(e.x,e.y,'#c1a979',14);
  }
  function enemyShoot(e,dir,speed=180,type='enemy',damage=.5){
    spawnProjectile({owner:'enemy',type,x:e.x+dir.x*(e.r+5),y:e.y+dir.y*(e.r+5),vx:dir.x*speed,vy:dir.y*speed,r:type==='fire'?6:5,damage,life:3,pierce:false});
  }
  function updateEnemies(dt){
    const room=currentRoom();
    for(const e of room.enemies){
      if(e.dead) continue;
      e.hitFlash=Math.max(0,e.hitFlash-dt);e.cool-=dt;e.timer-=dt;e.stunTimer=Math.max(0,(e.stunTimer||0)-dt);e.freezeTimer=Math.max(0,(e.freezeTimer||0)-dt);e.orbitHit=Math.max(0,(e.orbitHit||0)-dt);
      if(e.freezeTimer<=0){ if(e.type==='boss') updateBoss(room,e,dt); else updateEnemy(room,e,dt); }
      if(e.type==='boss'&&!(e.bossType==='sandWyrm'&&e.grounded===false)&&bossNeedsRecovery(room,e)) recoverBossPosition(room,e);
      if(!e.dead&&player.jumpTimer<=0&&e.grounded!==false&&circleHit(e,player)) hurtPlayer(.5,false,e);
    }
    room.enemies=room.enemies.filter(e=>!e.dead);
    if(!room.cleared&&room.enemies.length===0){
      room.cleared=true;sfx('clear');setMessage(room.kind==='boss'?'The boss is defeated! A staircase appears.':'Room cleared. Doors unlocked.',2);
      if(room.kind==='boss'){
        const size=roomSize(room);room.stairs={x:size.w/2,y:size.h/2,r:22};dropLoot(room,size.w/2-28,size.h/2,true);
      }
    }
    updateOrbitals(room,dt);
  }
  function updateEnemy(room,e,dt){
    const to=normalize(player.x-e.x,player.y-e.y);
    if(!(e.type==='shield'&&e.stunTimer>0)) e.facing=to;
    if(e.type==='slime'){
      if(e.timer<=0){e.timer=rand(.5,1.2);e.angle=Math.atan2(to.y,to.x)+rand(-.7,.7)}
      moveEnemy(room,e,Math.cos(e.angle)*e.speed,Math.sin(e.angle)*e.speed,dt);
    }else if(e.type==='bat'){
      const a=Math.atan2(to.y,to.x)+Math.sin(gameTime*7+e.angle)*.35;moveEnemy(room,e,Math.cos(a)*e.speed,Math.sin(a)*e.speed,dt,true);
    }else if(e.type==='skeleton'){
      moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt);
    }else if(e.type==='archer'){
      const d=dist(e,player),side={x:-to.y,y:to.x};
      const mx=(d<125?-to.x:d>220?to.x:side.x*.6)*e.speed,my=(d<125?-to.y:d>220?to.y:side.y*.6)*e.speed;
      moveEnemy(room,e,mx,my,dt);
      if(e.cool<=0){enemyShoot(e,to,210,'arrowEnemy',.5);e.cool=1.45-rand(0,.2)}
    }else if(e.type==='spider'){
      if(e.state==='wait'){
        e.grounded=true;
        if(e.timer<=0){e.state='jump';e.timer=.46;e.grounded=false;e.vx=to.x*230;e.vy=to.y*230}
      }else{
        moveEnemy(room,e,e.vx,e.vy,dt,true);
        if(e.timer<=0){e.state='wait';e.timer=rand(1.4,2.5);e.grounded=true}
      }
    }else if(e.type==='shield'){
      if(e.stunTimer>0){ e.vx=0; e.vy=0; }
      else moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt);
    }else if(e.type==='burrow'){
      if(e.state==='hidden'){
        e.grounded=false;moveEnemy(room,e,to.x*e.speed*1.35,to.y*e.speed*1.35,dt,true);
        if(e.timer<=0){e.state='up';e.timer=1.45;e.grounded=true;spawnParticles(e.x,e.y,'#8a6740',8)}
      }else{
        moveEnemy(room,e,to.x*e.speed*.55,to.y*e.speed*.55,dt);
        if(e.timer<=0){e.state='hidden';e.timer=rand(1.1,1.8);e.grounded=false}
      }
    }else if(e.type==='charger'){
      if(e.state==='aim'){
        if(e.timer<=0){e.state='charge';e.timer=.72;e.vx=to.x*245;e.vy=to.y*245}
      }else if(e.state==='charge'){
        moveEnemy(room,e,e.vx,e.vy,dt);
        if(e.timer<=0){e.state='rest';e.timer=.7}
      }else if(e.timer<=0){e.state='aim';e.timer=1.05}
    }else if(e.type==='fire'){
      const d=dist(e,player);moveEnemy(room,e,(d<155?-to.x:d>235?to.x:0)*e.speed,(d<155?-to.y:d>235?to.y:0)*e.speed,dt);
      if(e.cool<=0){
        const a=Math.atan2(to.y,to.x);for(const off of [-.18,0,.18]) enemyShoot(e,{x:Math.cos(a+off),y:Math.sin(a+off)},185,'fire',.5);e.cool=1.75;
      }
    }else if(e.type==='split'){
      moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt);
    }else if(e.type==='wizard'){
      if(e.timer<=0){
        const p=randomFloorSpot(room,e.r);e.x=p.x;e.y=p.y;e.timer=2.2;spawnParticles(e.x,e.y,'#9d77d5',8);
        const a=Math.atan2(player.y-e.y,player.x-e.x);for(const off of [-.25,0,.25]) enemyShoot(e,{x:Math.cos(a+off),y:Math.sin(a+off)},170,'magicEnemy',.5);
      }
    }else if(e.type==='turret'){
      if(e.cool<=0){for(const d of AIM_DIRS.filter((_,i)=>i%2===0)) enemyShoot(e,d,155,'stone',.5);e.cool=1.8}
    }else if(e.type==='ghost'){
      moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt,true);
    }else if(e.type==='mimic'){
      const d=dist(e,player);
      if(e.state==='sleep'){
        if(d<115){e.state='wake';e.timer=.45;spawnParticles(e.x,e.y,'#d6a253',8)}
      }else if(e.state==='wake'){
        if(e.timer<=0){e.state='hunt';e.cool=.8}
      }else{
        const boost=e.cool<=0&&d>90?2.2:1;
        moveEnemy(room,e,to.x*e.speed*boost,to.y*e.speed*boost,dt);
        if(boost>1){e.cool=1.7;e.timer=.22}
      }
    }else if(e.type==='eye'){
      const d=dist(e,player),side={x:-to.y,y:to.x};
      moveEnemy(room,e,(d<105?-to.x:d>205?to.x:side.x*.7)*e.speed,(d<105?-to.y:d>205?to.y:side.y*.7)*e.speed,dt,true);
      if(e.cool<=0){enemyShoot(e,to,225,'eyeBolt',.5);e.cool=1.15}
    }else if(e.type==='leech'){
      const a=Math.atan2(to.y,to.x)+Math.sin(gameTime*9+e.angle)*.55;
      moveEnemy(room,e,Math.cos(a)*e.speed,Math.sin(a)*e.speed,dt);
    }else if(e.type==='lancer'){
      const d=dist(e,player);
      if(e.state==='stalk'){
        const side={x:-to.y,y:to.x};
        moveEnemy(room,e,(d<135?-to.x:d>225?to.x:side.x*.55)*e.speed,(d<135?-to.y:d>225?to.y:side.y*.55)*e.speed,dt);
        if(e.timer<=0){e.state='aim';e.timer=.48}
      }else if(e.state==='aim'){
        if(e.timer<=0){e.state='thrust';e.timer=.42;e.vx=to.x*315;e.vy=to.y*315}
      }else if(e.state==='thrust'){
        const m=moveEnemy(room,e,e.vx,e.vy,dt);
        if(m.blocked||e.timer<=0){e.state='recover';e.timer=.65}
      }else if(e.timer<=0){e.state='stalk';e.timer=rand(.8,1.4)}
    }else if(e.type==='orbiter'){
      e.angle+=dt*(.8+stage*.02);
      const tx=player.x+Math.cos(e.angle)*e.orbitRadius,ty=player.y+Math.sin(e.angle)*e.orbitRadius;
      const n=normalize(tx-e.x,ty-e.y);moveEnemy(room,e,n.x*e.speed,n.y*e.speed,dt,true);
      if(e.cool<=0){enemyShoot(e,normalize(player.x-e.x,player.y-e.y),185,'orbBolt',.5);e.cool=1.7}
    }else if(e.type==='summoner'){
      const d=dist(e,player);moveEnemy(room,e,(d<145?-to.x:d>245?to.x:0)*e.speed,(d<145?-to.y:d>245?to.y:0)*e.speed,dt);
      if(e.cool<=0){
        if(e.summons<2){
          const spot=safeEnemySpot(room,e.x+rand(-35,35),e.y+rand(-35,35),10);
          const minion=makeEnemy(chance(.5)?'slime':'bat',spot.x,spot.y);minion.hp=minion.maxHp=Math.max(1,Math.round(minion.hp*.65));minion.summoned=true;room.enemies.push(minion);e.summons++;spawnParticles(spot.x,spot.y,'#b88be0',10);
        }else enemyShoot(e,to,175,'magicEnemy',.5);
        e.cool=2.4;
      }
    }else if(e.type==='bomber'){
      const d=dist(e,player);
      if(e.state!=='fuse'){
        moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt);
        if(d<82){e.state='fuse';e.timer=1.05;e.fuse=1}
      }else{
        e.fuse=1-e.timer/1.05;
        if(e.timer<=0){
          for(let i=0;i<8;i++){const a=i*Math.PI/4;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},165,'ember',.5)}
          e.dead=true;spawnParticles(e.x,e.y,'#f0a253',24);sfx('bomb');
        }
      }
    }else if(e.type==='iceMage'){
      const d=dist(e,player),side={x:-to.y,y:to.x};
      moveEnemy(room,e,(d<145?-to.x:d>235?to.x:side.x*.35)*e.speed,(d<145?-to.y:d>235?to.y:side.y*.35)*e.speed,dt);
      if(e.cool<=0){const a=Math.atan2(to.y,to.x);for(const off of [-.14,.14]) enemyShoot(e,{x:Math.cos(a+off),y:Math.sin(a+off)},180,'iceEnemy',.5);e.cool=1.65}
    }else if(e.type==='moth'){
      const a=Math.atan2(to.y,to.x)+Math.sin(gameTime*6+e.angle)*.8;
      moveEnemy(room,e,Math.cos(a)*e.speed,Math.sin(a)*e.speed,dt,true);
      if(e.cool<=0){const base=Math.atan2(to.y,to.x);for(const off of [-.24,0,.24]) enemyShoot(e,{x:Math.cos(base+off),y:Math.sin(base+off)},160,'dust',.5);e.cool=2.05}
    }else if(e.type==='centipede'){
      if(e.timer<=0){e.timer=rand(.45,.9);e.angle=Math.atan2(to.y,to.x)+rand(-.65,.65)}
      const m=moveEnemy(room,e,Math.cos(e.angle)*e.speed,Math.sin(e.angle)*e.speed,dt);
      if(m.blocked){e.angle+=Math.PI*.65+rand(-.5,.5);e.timer=.25}
      if(e.cool<=0){e.cool=1.8;e.angle=Math.atan2(to.y,to.x);e.timer=.55}
    }
  }

  function safeEnemySpot(room,x,y,r=12){
    const size=roomSize(room);
    for(let i=0;i<20;i++){
      const px=clamp(x+rand(-45,45),r+WALL,size.w-r-WALL),py=clamp(y+rand(-45,45),r+WALL,size.h-r-WALL);
      if(!solidBlockAt(room,px,py,r)&&!holeAt(room,px,py,r*.4)&&Math.hypot(px-player.x,py-player.y)>55) return {x:px,y:py};
    }
    const p=randomFloorSpot(room,r,[],100);return {x:p.x,y:p.y};
  }

  function bossDisplayName(type){
    return {beast:'Horned Ravager',mage:'Mirror Sorcerer',giantSpider:'Broodmother',hydra:'Thorn Hydra',knight:'Iron Warden',cyclops:'Cyclops Crusher',stormIdol:'Storm Idol',sandWyrm:'Dune Devourer',frostQueen:'Frost Queen',voidMask:'Mask of the Void'}[type]||'Dungeon Guardian';
  }
  function updateBoss(room,e,dt){
    const to=normalize(player.x-e.x,player.y-e.y);
    if(!(e.type==='shield'&&e.stunTimer>0)) e.facing=to;
    const hpRatio=e.hp/e.maxHp;e.phase=hpRatio<.5?1:0;
    if(e.bossType==='beast'){
      if(e.state==='idle'){
        moveEnemy(room,e,to.x*e.speed*.55,to.y*e.speed*.55,dt);
        if(e.timer<=0){e.state='aim';e.timer=.8-(e.phase*.18)}
      }else if(e.state==='aim'){
        if(e.timer<=0){e.state='charge';e.timer=.85;e.vx=to.x*(290+e.phase*55);e.vy=to.y*(290+e.phase*55)}
      }else if(e.state==='charge'){
        const movement=moveEnemy(room,e,e.vx,e.vy,dt);
        e.stuckTimer=movement.blocked?e.stuckTimer+dt:Math.max(0,e.stuckTimer-dt*2);
        if(e.stuckTimer>.12){recoverBossPosition(room,e);return}
        if(e.timer<=0){e.state='idle';e.timer=.7;e.stuckTimer=0}
      }
    }else if(e.bossType==='mage'){
      moveEnemy(room,e,Math.sin(gameTime*1.8)*20,Math.cos(gameTime*1.4)*18,dt,true);
      if(e.timer<=0){
        const p=randomFloorSpot(room,e.r);spawnParticles(e.x,e.y,'#815bb0',14);e.x=p.x;e.y=p.y;spawnParticles(e.x,e.y,'#c091f0',14);
        const count=e.phase?12:8;for(let i=0;i<count;i++){const a=Math.PI*2*i/count;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},155+e.phase*30,'magicEnemy',.5)}
        e.timer=e.phase?1.45:1.9;
      }
    }else if(e.bossType==='giantSpider'){
      if(e.state==='idle'){
        if(e.timer<=0){e.state='jump';e.timer=.58;e.grounded=false;e.vx=to.x*270;e.vy=to.y*270}
      }else if(e.state==='jump'){
        moveEnemy(room,e,e.vx,e.vy,dt,true);
        if(e.timer<=0){e.state='idle';e.timer=e.phase?.75:1.15;e.grounded=true;if(bossNeedsRecovery(room,e)){recoverBossPosition(room,e);return}shake=6;for(let i=0;i<8;i++){const a=i*Math.PI/4;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},120,'web',.5)}}
      }
    }else if(e.bossType==='hydra'){
      const size=roomSize(room),cx=size.w/2,cy=size.h/2;
      moveEnemy(room,e,(cx-e.x)*.18,(cy-e.y)*.18,dt);
      if(e.timer<=0){
        const count=e.phase?10:6;const base=Math.atan2(to.y,to.x);
        for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.18;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},190,'thorn',.5)}
        e.timer=e.phase?.9:1.35;
      }
    }else if(e.bossType==='knight'){
      if(e.state==='idle'){
        moveEnemy(room,e,to.x*e.speed,to.y*e.speed,dt);
        if(e.timer<=0){e.state='guard';e.timer=.8}
      }else if(e.state==='guard'){
        if(e.timer<=0){e.state='charge';e.timer=.62;e.vx=to.x*250;e.vy=to.y*250}
      }else{
        const m=moveEnemy(room,e,e.vx,e.vy,dt);
        if(m.blocked||e.timer<=0){e.state='idle';e.timer=.85}
      }
    }else if(e.bossType==='cyclops'){
      if(e.state==='idle'){
        moveEnemy(room,e,to.x*e.speed*.72,to.y*e.speed*.72,dt);
        if(e.timer<=0){e.state='stomp';e.timer=.6}
      }else if(e.state==='stomp'){
        if(e.timer<=0){
          const count=e.phase?16:12;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},135+e.phase*25,'shock',.5)}
          shake=9;spawnParticles(e.x,e.y,'#b99055',22);e.state='rush';e.timer=.72;e.vx=to.x*(245+e.phase*45);e.vy=to.y*(245+e.phase*45);
        }
      }else{
        const m=moveEnemy(room,e,e.vx,e.vy,dt);
        if(m.blocked||e.timer<=0){e.state='idle';e.timer=e.phase?.65:.9}
      }
    }else if(e.bossType==='stormIdol'){
      const size=roomSize(room),cx=size.w/2,cy=size.h/2;
      moveEnemy(room,e,(cx-e.x)*.22,(cy-e.y)*.22,dt);
      e.angle+=dt*(1.25+e.phase*.55);
      if(e.cool<=0){
        const count=e.phase?8:6;
        for(let i=0;i<count;i++){const a=e.angle+i*Math.PI*2/count;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},175+e.phase*20,'lightning',.5)}
        e.cool=e.phase?.65:.9;
      }
      if(e.timer<=0){
        const base=Math.atan2(to.y,to.x);for(const off of [-.32,-.16,0,.16,.32]) enemyShoot(e,{x:Math.cos(base+off),y:Math.sin(base+off)},225,'lightning',.5);
        e.timer=e.phase?1.6:2.1;
      }
    }else if(e.bossType==='sandWyrm'){
      if(e.state==='idle'||e.state==='burrow'){
        e.state='burrow';e.grounded=false;
        const m=moveEnemy(room,e,to.x*e.speed*2,to.y*e.speed*2,dt,true);
        if(e.timer<=0||dist(e,player)<72){e.state='emerge';e.timer=.7;e.grounded=true;shake=6;spawnParticles(e.x,e.y,'#b68b51',20)}
      }else if(e.state==='emerge'){
        if(e.timer<=0){
          const count=e.phase?12:8;const base=Math.atan2(to.y,to.x);
          for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.16;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},185,'sand',.5)}
          e.state='rest';e.timer=.85;
        }
      }else if(e.timer<=0){e.state='burrow';e.timer=e.phase?1.0:1.35;e.grounded=false}
    }else if(e.bossType==='frostQueen'){
      const d=dist(e,player),side={x:-to.y,y:to.x};
      moveEnemy(room,e,(d<155?-to.x:d>250?to.x:side.x*.45)*e.speed,(d<155?-to.y:d>250?to.y:side.y*.45)*e.speed,dt,true);
      if(e.cool<=0){
        const base=Math.atan2(to.y,to.x),count=e.phase?7:5;
        for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.18;enemyShoot(e,{x:Math.cos(base+off),y:Math.sin(base+off)},180+e.phase*18,'iceEnemy',.5)}
        e.cool=e.phase?.75:1.05;
      }
      if(e.timer<=0){const p=randomFloorSpot(room,e.r+4,[player],150);spawnParticles(e.x,e.y,'#b9ecff',16);e.x=p.x;e.y=p.y;spawnParticles(e.x,e.y,'#e7f7ff',16);e.timer=e.phase?1.7:2.4}
    }else if(e.bossType==='voidMask'){
      const size=roomSize(room),cx=size.w/2,cy=size.h/2;
      e.angle+=dt*(.8+e.phase*.45);
      const tx=cx+Math.cos(e.angle)*Math.min(150,size.w*.22),ty=cy+Math.sin(e.angle)*Math.min(100,size.h*.22);
      const n=normalize(tx-e.x,ty-e.y);moveEnemy(room,e,n.x*e.speed*1.2,n.y*e.speed*1.2,dt,true);
      if(e.cool<=0){
        const count=e.phase?14:10;
        for(let i=0;i<count;i++){const a=e.angle+i*Math.PI*2/count;enemyShoot(e,{x:Math.cos(a),y:Math.sin(a)},150+e.phase*35,'void',.5)}
        e.cool=e.phase?.82:1.15;
      }
      if(e.timer<=0){
        const base=Math.atan2(to.y,to.x);for(const off of [-.42,-.21,0,.21,.42]) enemyShoot(e,{x:Math.cos(base+off),y:Math.sin(base+off)},220,'void',.5);
        e.timer=e.phase?1.25:1.75;
      }
    }
  }

  function damageEnemy(room,e,amount,attackerX,attackerY){
    if(e.dead||(e.grounded===false&&(e.type==='burrow'||(e.type==='boss'&&e.bossType==='sandWyrm')))) return;
    if(e.type==='shield'&&e.stunTimer<=0){
      const towardAttacker=normalize(attackerX-e.x,attackerY-e.y);
      if(e.facing.x*towardAttacker.x+e.facing.y*towardAttacker.y>.15){
        e.shieldBlocks=(e.shieldBlocks||0)+1;
        sfx('error');spawnParticles(e.x,e.y,'#d8d0b0',5);
        if(e.shieldBlocks>=2){
          e.shieldBlocks=0;e.stunTimer=1;e.hitFlash=.18;
          spawnParticles(e.x,e.y,'#f0d85f',12);sfx('shield');
          setMessage('Shield guard stunned! Strike while it is open.',1.15);
        }
        return;
      }
    }
    if(e.type==='boss'&&e.bossType==='knight'&&(e.state==='guard'||e.state==='idle')){
      const towardAttacker=normalize(attackerX-e.x,attackerY-e.y);
      if(e.facing.x*towardAttacker.x+e.facing.y*towardAttacker.y>.35){sfx('error');spawnParticles(e.x,e.y,'#d8d0b0',6);return}
    }
    e.hp-=amount;e.hitFlash=.12;sfx('hit');
    const kb=normalize(e.x-attackerX,e.y-attackerY);e.x+=kb.x*5;e.y+=kb.y*5;
    if(e.hp<=0){
      e.dead=true;spawnParticles(e.x,e.y,e.type==='boss'?'#e4c35f':'#b66b52',e.type==='boss'?30:12);
      if(e.type==='split'){
        for(let i=0;i<2;i++){const m=makeEnemy('slime',e.x+(i?12:-12),e.y);m.hp=m.maxHp=1;m.r=8;m.speed+=25;room.enemies.push(m)}
      }
      dropLoot(room,e.x,e.y,e.type==='boss',e);
    }
  }
  function hurtPlayer(amount,bypassWard){
    stopAutoRun();
    if(player.inv>0||state==='gameover') return;
    if(!bypassWard&&player.wardReady>0){player.wardReady=0;player.inv=.65;sfx('error');setMessage('Guardian Charm absorbed the hit.',1.2);return}
    player.hp=Math.max(0,player.hp-amount);player.inv=1;sfx('hurt');shake=5;flash=.08;
    if(player.hp<=0){saveRunScore();state='gameover';paused=false;clearInputs();setMessage('',0)}
  }
  function updateOrbitals(room,dt){
    const count=(player.passive.orbital||0)+(player.orbitNovaTimer>0?3:0);
    if(!count) return;
    for(let i=0;i<count;i++){
      const a=player.orbitAngle+i*Math.PI*2/count,rad=player.orbitNovaTimer>0?40:34;
      const orb={x:player.x+Math.cos(a)*rad,y:player.y+Math.sin(a)*rad,r:7};
      for(const e of room.enemies){
        if(e.dead||e.orbitHit>0||!circleHit(orb,e)) continue;
        e.orbitHit=.35;damageEnemy(room,e,player.orbitNovaTimer>0?1.3:1,orb.x,orb.y);
      }
    }
  }

  function openChest(room,chest){
    if(chest.opened) return;
    if(!room.cleared){setMessage('The chest is sealed until the room is clear.',1.2);return}
    if(chest.locked){
      if(player.keyCount<=0){setMessage('This chest needs a rare key.',1.2);return}
      player.keyCount--;
    }
    chest.opened=true;sfx('open');
    const reward=chest.reward||makeChestReward(chest.rare);
    if(reward.type==='passive'||reward.type==='active') room.pickups.push({type:reward.type,id:reward.id,x:chest.x,y:chest.y-18,r:11,bob:0});
    else room.pickups.push({type:reward.type,x:chest.x,y:chest.y-18,r:9,bob:0});
  }
  function pickupCanCollect(p){
    if((p.type==='heart'||p.type==='heartHalf')&&player.hp>=player.maxHp-.001) return false;
    if(p.type==='charge'){
      const max=activeMaxCharges(player.active);
      return max>0&&player.activeCharges<max;
    }
    return true;
  }
  function collectPickup(room,p){
    if(p.collected||!pickupCanCollect(p)) return;
    p.collected=true;
    if(p.type==='rupee'){player.rupees+=1;sfx('rupee')}
    else if(p.type==='rupee5'){player.rupees+=5;sfx('rupee')}
    else if(p.type==='heartHalf'){player.hp=Math.min(player.maxHp,player.hp+.5);sfx('heart')}
    else if(p.type==='heart'){player.hp=Math.min(player.maxHp,player.hp+1);sfx('heart')}
    else if(p.type==='bomb'){player.bombCount++;audioTone(230,.1,'triangle',.014,340)}
    else if(p.type==='key'){player.keyCount++;sfx('key')}
    else if(p.type==='charge'){
      const max=activeMaxCharges(player.active),gain=p.amount||2;
      player.activeCharges=Math.min(max,player.activeCharges+gain);sfx('charge');setMessage(`Arcane charge restored. ${player.activeCharges}/${max} charges.`,1.6);
    }
    else if(p.type==='passive'){grantPassive(p.id);sfx('open');setMessage(`${PASSIVES[p.id].name}: ${PASSIVES[p.id].desc}`,2.8)}
    else if(p.type==='active'){equipActive(p.id,p.charges);sfx('open');setMessage(`${ACTIVES[p.id].name} equipped. Use X.`,2.5)}
  }
  function updateRoomObjects(dt){
    const room=currentRoom();
    for(const p of room.pickups){
      p.bob=(p.bob||0)+dt*3;
      const magnet=(player.passive.magnet||0)*22 + 20;
      const d=Math.hypot(player.x-p.x,player.y-p.y);
      if(!p.collected && pickupCanCollect(p) && d<36+magnet){
        const n=normalize(player.x-p.x,player.y-p.y);
        p.x += n.x*dt*(35+magnet*3); p.y += n.y*dt*(35+magnet*3);
      }
      if(!p.collected&&Math.hypot(player.x-p.x,player.y-p.y)<player.r+p.r+4) collectPickup(room,p);
    }
    room.pickups=room.pickups.filter(p=>!p.collected);
    for(const c of room.chests){ if(Math.hypot(player.x-c.x,player.y-c.y)<player.r+18) openChest(room,c) }
    if(room.stairs&&Math.hypot(player.x-room.stairs.x,player.y-room.stairs.y)<player.r+room.stairs.r){sfx('stairs');enterShop()}
  }
  function spawnParticles(x,y,color,count){
    for(let i=0;i<count;i++) particles.push({x,y,vx:fxRand(-90,90),vy:fxRand(-90,90),life:fxRand(.25,.7),max:1,color,roomId:currentRoomId,size:fxRandi(2,5)});
  }
  function updateParticles(dt){
    for(const p of particles){if(p.roomId!==currentRoomId)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt}
    particles=particles.filter(p=>p.life>0);
    for(const b of blastEffects) if(b.roomId===currentRoomId) b.life-=dt;
    blastEffects=blastEffects.filter(b=>b.life>0);
  }

  function updateShop(dt){
    let manualDx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
    let manualDy=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
    if(isMobileDevice&&mobileMove.active){manualDx=mobileMove.x;manualDy=mobileMove.y}
    let dx=manualDx,dy=manualDy;
    if(autoRun.active){
      if(manualDx||manualDy){const m=normalize(manualDx,manualDy);if(Math.abs(m.x-autoRun.dx)>.1||Math.abs(m.y-autoRun.dy)>.1)stopAutoRun()}
      if(autoRun.active){dx=autoRun.dx;dy=autoRun.dy}
    }
    if(dx||dy){const n=normalize(dx,dy);dx=n.x;dy=n.y}
    const sp=player.speed*(1+player.passive.speed*.09)*(autoRun.active?RUN_SPEED_MULTIPLIER:1);
    const oldX=player.x,oldY=player.y;
    player.x=clamp(player.x+dx*sp*dt,SHOP_VIEW.x+44,SHOP_VIEW.x+SHOP_VIEW.w-44);
    player.y=clamp(player.y+dy*sp*dt,SHOP_VIEW.y+24,SHOP_VIEW.y+SHOP_VIEW.h-32);
    if(autoRun.active&&((dx&&Math.abs(player.x-oldX)<.001)||(dy&&Math.abs(player.y-oldY)<.001)))stopAutoRun();
    player.jumpTimer=Math.max(0,player.jumpTimer-dt);player.jumpCooldown=Math.max(0,player.jumpCooldown-dt);player.inv=Math.max(0,player.inv-dt);
    player.orbitAngle+=dt*3.2;
    const dropped=shop.droppedItems||[];
    for(const p of dropped){ p.bob=(p.bob||0)+dt*3; if(Math.hypot(player.x-p.x,player.y-p.y)<player.r+p.r+4){ collectPickup(null,p); } }
    shop.droppedItems=dropped.filter(p=>!p.collected);
    if(Math.hypot(player.x-shop.backExit.x,player.y-shop.backExit.y)<player.r+shop.backExit.r){stopAutoRun();sfx('stairs');state='play';currentRoomId=shopReturnRoomId;const room=currentRoom();player.x=room.stairs.x;player.y=room.stairs.y+42;player.lastSafe={x:player.x,y:player.y};projectiles=[];bombs=[];particles=[];blastEffects=[];player.attackTimer=0;setMessage('You climb back to the boss room.',1.7);return}
    if(Math.hypot(player.x-shop.exit.x,player.y-shop.exit.y)<player.r+shop.exit.r){stopAutoRun();sfx('stairs');beginNextStage()}
  }
  function update(dt){
    gameTime+=dt;
    if(messageTimer>0) messageTimer=Math.max(0,messageTimer-dt);
    shake=Math.max(0,shake-dt*28);flash=Math.max(0,flash-dt);stageBanner=Math.max(0,stageBanner-dt);
    if(mobileOrientationBlocked||paused||overlay) return;
    if(transition){
      transition.t+=dt;
      if(transition.t>=transition.duration) finishRoomTransition();
      return;
    }
    if(state==='play'){
      movePlayer(dt);updateMobileCombat();swordDamageTick();updateBombs(dt);updateProjectiles(dt);updateEnemies(dt);updateRoomObjects(dt);updateParticles(dt);
    }else if(state==='shop'){
      updateShop(dt);updateParticles(dt);
    }
  }

  function drawPixelRect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  function drawHeart(x,y,fill){
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#2b1c18';ctx.fillRect(2,0,8,2);ctx.fillRect(0,2,12,7);ctx.fillRect(2,9,8,3);
    ctx.fillStyle='#d74a3f';
    if(fill>=1){ctx.fillRect(3,2,6,7);ctx.fillRect(2,3,8,4);ctx.fillRect(4,9,4,1)}
    else if(fill>.1){ctx.fillRect(2,3,4,5);ctx.fillRect(3,2,3,7);ctx.fillRect(4,9,2,1)}
    ctx.restore();
  }
  function drawBombHudIcon(x,y){
    ctx.fillStyle='#252b28';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();
    drawPixelRect(x+4,y-13,4,7,'#d7a34e');drawPixelRect(x+7,y-16,4,4,'#f0d567');
    ctx.strokeStyle='#e8ddb0';ctx.lineWidth=1;ctx.stroke();
  }
  function drawKeyHudIcon(x,y){
    ctx.strokeStyle='#e5ca5d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-5,6,0,Math.PI*2);ctx.stroke();
    drawPixelRect(x-2,y,5,14,'#e5ca5d');drawPixelRect(x+2,y+7,8,4,'#e5ca5d');drawPixelRect(x+5,y+11,5,3,'#e5ca5d');
  }
  function drawRupeeHudIcon(x,y){
    ctx.fillStyle='#55c879';ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x+7,y);ctx.lineTo(x,y+10);ctx.lineTo(x-7,y);ctx.closePath();ctx.fill();
    drawPixelRect(x-2,y-6,3,10,'rgba(255,255,255,.48)');
  }
  function drawPowerIcon(id,x,y){
    const colors={powerSword:'#d8d6bf',quickSword:'#80c9d8',orbital:'#c6d6dc',ward:'#f1d672',maxHeart:'#d8574c',speed:'#8fc970',bombRadius:'#d39b56',luck:'#62b879',mirrorShield:'#8cb8df',beamBless:'#8bd7f4',magnet:'#d28bdf',secondWind:'#86d7a2'};
    ctx.fillStyle='#1a211a';ctx.fillRect(x-8,y-8,16,16);ctx.fillStyle=colors[id]||'#b8b08c';ctx.fillRect(x-6,y-6,12,12);
    if(id==='maxHeart'){drawHeart(x-6,y-6,1)}
    else if(id==='powerSword'||id==='quickSword'||id==='orbital'){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);drawPixelRect(-2,-7,4,12,'#f2eed5');drawPixelRect(-5,3,10,3,'#815d32');ctx.restore()}
    else if(id==='ward'){ctx.strokeStyle='#fff0a0';ctx.lineWidth=2;ctx.strokeRect(x-5,y-6,10,12)}
    else if(id==='bombRadius'){drawBombHudIcon(x,y+1)}
    else if(id==='luck'){ctx.fillStyle='#e8e49b';ctx.fillRect(x-2,y-5,4,10);ctx.fillRect(x-5,y-2,10,4)}
    else if(id==='mirrorShield'){ctx.strokeStyle='#dcecff';ctx.lineWidth=2;ctx.strokeRect(x-5,y-6,10,12);ctx.fillStyle='#97bce2';ctx.fillRect(x-3,y-4,6,8)}
    else if(id==='beamBless'){ctx.fillStyle='#b6f0ff';ctx.fillRect(x-1,y-6,2,12);ctx.fillRect(x-4,y-3,8,2)}
    else if(id==='magnet'){ctx.fillStyle='#d7a2e7';ctx.fillRect(x-5,y-6,4,12);ctx.fillRect(x+1,y-6,4,12);ctx.fillRect(x-1,y+2,2,4)}
    else if(id==='secondWind'){ctx.fillStyle='#9be0ae';ctx.fillRect(x-4,y-6,8,12);ctx.fillRect(x-6,y-2,12,4)}
  }
  function drawHUD(){
    ctx.fillStyle='#111812';ctx.fillRect(0,0,CW,74);
    ctx.fillStyle='#e8ddb0';ctx.font=`800 18px ${UI_FONT}`;ctx.fillText(`STAGE ${stage}`,22,25);
    ctx.font=`700 12px ${UI_FONT}`;ctx.fillStyle='#c7b986';ctx.fillText(state==='shop'?'MERCHANT STOP':currentRoom()?.kind==='boss'?'BOSS CHAMBER':'DUNGEON',22,48);
    const hearts=Math.ceil(player?.maxHp||3);
    for(let i=0;i<hearts;i++) drawHeart(142+(i%10)*18,17+Math.floor(i/10)*18,clamp((player?.hp||0)-i,0,1));

    drawRupeeHudIcon(357,23);ctx.fillStyle='#72d996';ctx.font=`800 17px ${UI_FONT}`;ctx.fillText(String(player?.rupees||0),371,29);
    drawBombHudIcon(451,23);ctx.fillStyle='#f0e5bd';ctx.fillText(String(player?.bombCount||0),467,29);
    drawKeyHudIcon(535,20);ctx.fillText(String(player?.keyCount||0),553,29);

    ctx.font=`700 13px ${UI_FONT}`;ctx.fillStyle='#a9d9ff';
    const active=player?.active?ACTIVES[player.active].name:'No active item';
    ctx.fillText(`X: ${active}`,625,23);
    let activeStatus='';
    if(player?.active==='burst'||player?.active==='homing'||player?.active==='frostOrb') activeStatus=`${player.activeCharges} charge${player.activeCharges===1?'':'s'}`;
    else if(player?.active==='arrows') activeStatus='Uses 1 rupee';
    else if(player?.active) activeStatus=player.activeCooldown>0?`${player.activeCooldown.toFixed(1)}s cooldown`:'Ready';
    ctx.fillStyle='#c8c19e';ctx.font=`600 11px ${UI_FONT}`;ctx.fillText(activeStatus,625,41);
    const enemiesLeft=state==='play' ? currentRoom().enemies.filter(e=>!e.dead).length : 0;
    ctx.fillStyle='#f1e5bd';ctx.font=`700 11px ${UI_FONT}`;ctx.fillText(`Enemies Left: ${enemiesLeft}`,625,58);
    if(player?.wardReady){ctx.fillStyle='#ffe28a';ctx.font=`800 12px ${UI_FONT}`;ctx.fillText('WARD READY',520,50)}
  }

  function activeStatusText(){
    if(!player?.active) return 'No active item equipped';
    if(player.active==='burst'||player.active==='homing'||player.active==='frostOrb') return `${player.activeCharges} charge${player.activeCharges===1?'':'s'} remaining`;
    if(player.active==='arrows') return 'Each shot costs 1 rupee';
    return player.activeCooldown>0?`Cooldown: ${player.activeCooldown.toFixed(1)}s`:'Ready to use with X';
  }
  function openPowerupDetails(kind,id){
    selectedPowerup={kind,id};
    openOverlay('powerup');
  }
  function powerupPanelHit(px,py){
    const x=SIDE.x+10,w=SIDE.w-20;
    if(px<x||px>x+w) return null;
    if(py>=278&&py<=370) return {kind:'active',id:player?.active||null};
    const acquired=player?Object.entries(player.passive).filter(([,v])=>v>0).slice(0,8):[];
    for(let i=0;i<acquired.length;i++){
      const top=414+i*20;
      if(py>=top&&py<top+20) return {kind:'passive',id:acquired[i][0]};
    }
    return null;
  }
  function drawPowerupPanel(){
    const x=SIDE.x+10,w=SIDE.w-20;
    ctx.fillStyle='#d9c98f';ctx.fillRect(x,278,w,92);ctx.strokeStyle='#5d5a3d';ctx.lineWidth=2;ctx.strokeRect(x,278,w,92);
    ctx.fillStyle='#182319';ctx.font=`800 14px ${UI_FONT}`;ctx.fillText('ACTIVE ITEM',x+9,297);
    ctx.fillStyle='#294d34';ctx.fillRect(x+9,306,26,26);ctx.fillStyle='#dce9c6';ctx.font=`800 16px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('X',x+22,325);ctx.textAlign='left';
    ctx.fillStyle='#182319';ctx.font=`800 12px ${UI_FONT}`;ctx.fillText(player?.active?ACTIVES[player.active].name:'None',x+43,317);
    ctx.fillStyle='#4b594b';ctx.font=`600 10px ${UI_FONT}`;
    wrapText(activeStatusText(),x+43,333,w-52,11);
    ctx.fillStyle='#5b654e';ctx.font=`700 10px ${UI_FONT}`;ctx.fillText('Click for details',x+43,358);

    ctx.fillStyle='#e5d8a5';ctx.fillRect(x,382,w,191);ctx.strokeStyle='#5d5a3d';ctx.strokeRect(x,382,w,191);
    ctx.fillStyle='#182319';ctx.font=`800 14px ${UI_FONT}`;ctx.fillText('CURRENT POWER-UPS',x+9,403);
    const acquired=player?Object.entries(player.passive).filter(([,v])=>v>0):[];
    if(!acquired.length){ctx.fillStyle='#596456';ctx.font=`600 12px ${UI_FONT}`;ctx.fillText('No passive upgrades yet.',x+9,427)}
    acquired.slice(0,8).forEach(([id,count],i)=>{
      const y=426+i*20;drawPowerIcon(id,x+17,y-3);
      ctx.fillStyle='#223126';ctx.font=`700 12px ${UI_FONT}`;ctx.fillText(`${PASSIVES[id].name}${count>1?` ×${count}`:''}`,x+31,y+1);
    });
    ctx.fillStyle='#c7b986';ctx.font=`700 11px ${UI_FONT}`;ctx.fillText(`SEED ${runSeed||'—'}`,x+9,590);
  }
  function drawSidePanel(){
    ctx.fillStyle='#111812';ctx.fillRect(SIDE.x,SIDE.y,SIDE.w,SIDE.h);
    ctx.strokeStyle='#394636';ctx.lineWidth=3;ctx.strokeRect(SIDE.x+1.5,SIDE.y+1.5,SIDE.w-3,SIDE.h-3);
    drawMiniMap();drawPowerupPanel();
  }

  function drawRoomBase(room,cam,shiftX=0,shiftY=0){
    const size=roomSize(room),ox=cam.ox+shiftX,oy=cam.oy+shiftY;
    ctx.fillStyle='#0d130e';ctx.fillRect(VIEW.x+shiftX,VIEW.y+shiftY,VIEW.w,VIEW.h);
    ctx.save();ctx.beginPath();ctx.rect(VIEW.x+shiftX,VIEW.y+shiftY,VIEW.w,VIEW.h);ctx.clip();
    ctx.fillStyle=room.kind==='boss'?'#66502f':room.kind==='secret'?'#4e6047':'#6e6847';ctx.fillRect(ox,oy,size.w,size.h);
    for(let y=0;y<size.h;y+=24){
      for(let x=0;x<size.w;x+=24){
        const odd=((x/24+y/24)&1);ctx.fillStyle=odd?'rgba(255,255,220,.035)':'rgba(0,0,0,.04)';ctx.fillRect(ox+x,oy+y,22,22);
        if(((x*7+y*11+room.id*13)%97)<10){ctx.fillStyle='rgba(30,34,24,.16)';ctx.fillRect(ox+x+5,oy+y+8,7,2)}
      }
    }
    ctx.fillStyle='#25291d';ctx.fillRect(ox,oy,size.w,WALL);ctx.fillRect(ox,oy+size.h-WALL,size.w,WALL);ctx.fillRect(ox,oy,WALL,size.h);ctx.fillRect(ox+size.w-WALL,oy,WALL,size.h);
    ctx.fillStyle='#4a4b31';
    for(let x=0;x<size.w;x+=32){ctx.fillRect(ox+x,oy+3,27,6);ctx.fillRect(ox+x,oy+size.h-9,27,6)}
    for(let y=0;y<size.h;y+=32){ctx.fillRect(ox+3,oy+y,6,27);ctx.fillRect(ox+size.w-9,oy+y,6,27)}

    for(const link of room.links) drawDoor(room,link,cam,shiftX,shiftY);
    ctx.restore();
  }
  function drawDoor(room,link,cam,shiftX=0,shiftY=0){
    const d=doorLocal(room,link),size=roomSize(room),ox=cam.ox+shiftX,oy=cam.oy+shiftY;
    const normalOpen=!link.secret&&canUseNormalDoor(room),secretOpen=link.secret&&link.opened;
    const open=normalOpen||secretOpen;
    if(link.secret&&!link.opened&&link.method==='bomb'){
      ctx.strokeStyle='#554b31';ctx.lineWidth=2;ctx.beginPath();
      if(link.dir==='N'||link.dir==='S'){
        const yy=oy+(link.dir==='N'?WALL-2:size.h-WALL+2);ctx.moveTo(ox+d.x-18,yy-3);ctx.lineTo(ox+d.x-6,yy+4);ctx.lineTo(ox+d.x+3,yy-2);ctx.lineTo(ox+d.x+18,yy+4);
      }else{
        const xx=ox+(link.dir==='W'?WALL-2:size.w-WALL+2);ctx.moveTo(xx-3,oy+d.y-18);ctx.lineTo(xx+4,oy+d.y-6);ctx.lineTo(xx-2,oy+d.y+3);ctx.lineTo(xx+4,oy+d.y+18);
      }ctx.stroke();return;
    }
    const floor=room.kind==='boss'?'#66502f':room.kind==='secret'?'#4e6047':'#6e6847';
    if(open){
      ctx.fillStyle=floor;
      if(link.dir==='N'||link.dir==='S') ctx.fillRect(ox+d.x-DOOR_HALF,oy+(link.dir==='N'?0:size.h-WALL),DOOR_HALF*2,WALL);
      else ctx.fillRect(ox+(link.dir==='W'?0:size.w-WALL),oy+d.y-DOOR_HALF,WALL,DOOR_HALF*2);
      ctx.fillStyle='#151b15';
      if(link.dir==='N'||link.dir==='S') ctx.fillRect(ox+d.x-22,oy+(link.dir==='N'?0:size.h-7),44,7);
      else ctx.fillRect(ox+(link.dir==='W'?0:size.w-7),oy+d.y-22,7,44);
    }else{
      ctx.fillStyle=link.secret?'#896d34':'#6b342c';
      if(link.dir==='N'||link.dir==='S') ctx.fillRect(ox+d.x-28,oy+(link.dir==='N'?3:size.h-WALL+3),56,WALL-6);
      else ctx.fillRect(ox+(link.dir==='W'?3:size.w-WALL+3),oy+d.y-28,WALL-6,56);
      if(link.secret){ctx.fillStyle='#d6b95a';drawPixelRect(ox+d.x-3,oy+d.y-4,6,8,'#d6b95a')}
    }
  }

  function drawHole(h,ox,oy){
    ctx.fillStyle='#11150f';ctx.fillRect(ox+h.x,oy+h.y,h.w,h.h);
    ctx.fillStyle='#24271b';ctx.fillRect(ox+h.x+4,oy+h.y+4,h.w-8,4);ctx.fillRect(ox+h.x+4,oy+h.y+4,4,h.h-8);
    ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(ox+h.x+7,oy+h.y+9,h.w-14,h.h-14);
  }
  function drawBlock(b,ox,oy){
    if(b.destroyed) return;
    drawPixelRect(ox+b.x,oy+b.y,b.w,b.h,'#6b5538');drawPixelRect(ox+b.x+3,oy+b.y+3,b.w-6,b.h-6,'#9a7a4d');
    drawPixelRect(ox+b.x+5,oy+b.y+6,10,4,'#b89a66');drawPixelRect(ox+b.x+19,oy+b.y+18,8,4,'#5c472f');
    ctx.strokeStyle='#473924';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox+b.x+9,oy+b.y+2);ctx.lineTo(ox+b.x+15,oy+b.y+12);ctx.lineTo(ox+b.x+11,oy+b.y+20);ctx.lineTo(ox+b.x+21,oy+b.y+30);ctx.stroke();
  }
  function drawChest(c,ox,oy){
    const x=ox+c.x,y=oy+c.y;
    if(c.opened){drawPixelRect(x-15,y+1,30,11,'#5e3d20');drawPixelRect(x-13,y-8,26,8,'#7c542b');return}
    drawPixelRect(x-16,y-11,32,23,'#4b2f19');drawPixelRect(x-13,y-8,26,17,c.locked?'#80642d':'#9c6530');drawPixelRect(x-13,y-3,26,4,'#c69a4e');drawPixelRect(x-3,y-5,6,10,c.locked?'#e8d46f':'#d1b15e');
    if(c.rare){drawPixelRect(x-11,y-7,4,4,'#e0c96a');drawPixelRect(x+7,y-7,4,4,'#e0c96a')}
  }
  function drawStairs(s,ox,oy){
    const x=ox+s.x,y=oy+s.y;drawPixelRect(x-24,y-17,48,34,'#161914');drawPixelRect(x-20,y-12,40,5,'#6f6650');drawPixelRect(x-16,y-5,32,5,'#5d5746');drawPixelRect(x-12,y+2,24,5,'#4b473b');drawPixelRect(x-8,y+9,16,5,'#39372f');
  }
  function drawPickup(p,ox,oy){
    const x=ox+p.x,y=oy+p.y+Math.sin(p.bob||0)*3;
    if(p.type==='rupee'||p.type==='rupee5'){
      ctx.fillStyle=p.type==='rupee5'?'#49d9ca':'#55c879';ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x+7,y);ctx.lineTo(x,y+10);ctx.lineTo(x-7,y);ctx.closePath();ctx.fill();drawPixelRect(x-2,y-6,3,10,'rgba(255,255,255,.45)');
    }else if(p.type==='heart'||p.type==='heartHalf'){
      drawHeart(x-6,y-6,p.type==='heart'?1:.5);
    }else if(p.type==='bomb'){
      ctx.fillStyle='#262b29';ctx.beginPath();ctx.arc(x,y+1,8,0,Math.PI*2);ctx.fill();drawPixelRect(x+3,y-10,3,5,'#d6a657');drawPixelRect(x+6,y-12,3,3,'#f2da74');
    }else if(p.type==='key'){
      drawPixelRect(x-2,y-10,5,15,'#e1c65e');ctx.strokeStyle='#e1c65e';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-7,5,0,Math.PI*2);ctx.stroke();drawPixelRect(x+2,y+1,6,3,'#e1c65e');
    }else if(p.type==='charge'){
      ctx.fillStyle='#9266d8';ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+9,y-2);ctx.lineTo(x+5,y+9);ctx.lineTo(x-5,y+9);ctx.lineTo(x-9,y-2);ctx.closePath();ctx.fill();
      drawPixelRect(x-2,y-7,4,12,'#e7d8ff');drawPixelRect(x-5,y-1,10,3,'#c9aaff');
    }else if(p.type==='passive'){
      ctx.fillStyle='#f0d56b';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();drawPixelRect(x-5,y-5,10,10,'#4f7b46');drawPixelRect(x-2,y-9,4,18,'#d7e5a4');
    }else if(p.type==='active'){
      ctx.fillStyle='#8bb8e8';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();drawPixelRect(x-3,y-9,6,18,'#f0f4d8');drawPixelRect(x-8,y-3,16,6,'#f0f4d8');
    }
  }
  function drawBomb(b,ox,oy){
    const pulse=b.timer<.5&&Math.floor(b.timer*16)%2===0;ctx.fillStyle=pulse?'#e8d75c':'#252b28';ctx.beginPath();ctx.arc(ox+b.x,oy+b.y,9,0,Math.PI*2);ctx.fill();drawPixelRect(ox+b.x+4,oy+b.y-13,3,6,'#d9a34b');
  }
  function drawProjectile(p,ox,oy){
    const x=ox+p.x,y=oy+p.y;
    if(p.type==='arrow'||p.type==='arrowEnemy'){
      const a=Math.atan2(p.vy,p.vx);ctx.save();ctx.translate(x,y);ctx.rotate(a);drawPixelRect(-9,-2,17,4,p.owner==='player'?'#e8e4bc':'#b98b59');drawPixelRect(6,-4,5,8,'#ddd9a3');ctx.restore();return;
    }
    const colors={beam:'#d9f3a2',boomerang:'#d8d2a0',magic:'#8ed2ff',rune:'#d79cff',homing:'#ff9b5e',fire:'#ff8a43',magicEnemy:'#b67de5',stone:'#aaa58e',web:'#e2e1d5',thorn:'#86b85a',lance:'#f2f0d5',frost:'#b9ecff',bomborb:'#ffb574',eyeBolt:'#e98a9c',orbBolt:'#8bd0ee',ember:'#f19a4e',iceEnemy:'#bcefff',dust:'#d3b7dc',shock:'#d5b069',lightning:'#9cd8ff',sand:'#c79b5d',void:'#9364ba'};
    ctx.fillStyle=colors[p.type]||'#df6b56';ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
    if(p.type==='boomerang'){ctx.strokeStyle='#46513b';ctx.lineWidth=2;ctx.stroke()}
  }
  function drawHero(wx,wy,cam,shiftX=0,shiftY=0){
    const jumpProgress=player.jumpTimer>0?1-player.jumpTimer/.52:0;
    const lift=player.jumpTimer>0?Math.sin(jumpProgress*Math.PI)*17:0;
    const x=cam.ox+shiftX+wx,y=cam.oy+shiftY+wy-lift;
    ctx.save();ctx.translate(x,y);ctx.scale(1.22,1.22);ctx.translate(-x,-y);
    ctx.globalAlpha=player.inv>0&&Math.floor(player.inv*12)%2===0?.38:1;
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(cam.ox+shiftX+wx,cam.oy+shiftY+wy+10,12-jumpProgress*2,5,0,0,Math.PI*2);ctx.fill();
    drawPixelRect(x-8,y+4,16,12,'#2f6b35');drawPixelRect(x-6,y+14,5,7,'#5c452c');drawPixelRect(x+1,y+14,5,7,'#5c452c');
    drawPixelRect(x-9,y-8,18,14,'#d7a76d');drawPixelRect(x-7,y-6,14,10,'#e0b47b');
    drawPixelRect(x-11,y-14,20,7,'#2e6a35');drawPixelRect(x+5,y-11,9,5,'#2e6a35');drawPixelRect(x-4,y-5,3,3,'#1a2119');drawPixelRect(x+4,y-5,3,3,'#1a2119');
    drawPixelRect(x-10,y+5,4,9,'#d9b077');drawPixelRect(x+6,y+5,4,9,'#d9b077');drawPixelRect(x-2,y+5,4,10,'#88602f');
    if(player.attackTimer>0) drawSword(x,y,player.attackDir);
    ctx.globalAlpha=1;ctx.restore();
  }
  function drawSword(x,y,dir){
    const handX=x+dir.x*11,handY=y+dir.y*11;
    ctx.save();ctx.translate(handX,handY);ctx.rotate(dir.a);
    drawPixelRect(0,-3,11,6,'#8c6034');drawPixelRect(9,-6,5,12,'#d7ba5f');drawPixelRect(13,-4,31,8,'#d9e0d3');drawPixelRect(18,-2,22,4,'#f4f6e8');drawPixelRect(42,-2,6,4,'#bfc8bf');
    ctx.restore();
  }

  function drawEnemy(e,ox,oy){
    const x=ox+e.x,y=oy+e.y;
    ctx.save();ctx.translate(x,y);ctx.scale(1.2,1.2);ctx.translate(-x,-y);
    if(e.hitFlash>0) ctx.globalAlpha=.45;
    if(e.type==='boss'){drawBoss(e,x,y);ctx.restore();return}
    if(e.type==='slime'||e.type==='split'){
      const c=e.type==='split'?'#6f9b55':'#4eaa5b';drawPixelRect(x-e.r,y-e.r/2,e.r*2,e.r*1.35,c);drawPixelRect(x-e.r+3,y-e.r/2-4,e.r*2-6,6,c);drawPixelRect(x-6,y-3,3,3,'#172018');drawPixelRect(x+3,y-3,3,3,'#172018');
    }else if(e.type==='bat'){
      drawPixelRect(x-6,y-6,12,12,'#5e4a76');drawPixelRect(x-18,y-8,12,6,'#786194');drawPixelRect(x+6,y-8,12,6,'#786194');drawPixelRect(x-15,y-2,9,5,'#4d3d62');drawPixelRect(x+6,y-2,9,5,'#4d3d62');drawPixelRect(x-3,y-2,2,2,'#e3d771');drawPixelRect(x+2,y-2,2,2,'#e3d771');
    }else if(e.type==='skeleton'){
      drawPixelRect(x-8,y-12,16,14,'#ded7b0');drawPixelRect(x-5,y-8,3,4,'#24251f');drawPixelRect(x+2,y-8,3,4,'#24251f');drawPixelRect(x-6,y+2,12,12,'#b8b18f');drawPixelRect(x-10,y+4,4,11,'#ded7b0');drawPixelRect(x+6,y+4,4,11,'#ded7b0');
    }else if(e.type==='archer'){
      drawPixelRect(x-8,y-10,16,20,'#7b4d32');drawPixelRect(x-7,y-13,14,8,'#a06a40');drawPixelRect(x-3,y-8,2,2,'#111');drawPixelRect(x+2,y-8,2,2,'#111');ctx.strokeStyle='#d2bd7e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+10,y,9,-Math.PI/2,Math.PI/2);ctx.stroke();
    }else if(e.type==='spider'){
      const lift=e.state==='jump'?10:0;drawPixelRect(x-8,y-7-lift,16,14,'#6e4035');drawPixelRect(x-3,y-5-lift,2,2,'#e0c267');drawPixelRect(x+2,y-5-lift,2,2,'#e0c267');ctx.strokeStyle='#3c2a25';ctx.lineWidth=3;for(let i=-1;i<=1;i+=2){for(let j=-1;j<=1;j+=2){ctx.beginPath();ctx.moveTo(x+i*7,y+j*3-lift);ctx.lineTo(x+i*15,y+j*8);ctx.stroke()}}
    }else if(e.type==='shield'){
      const stunned=e.stunTimer>0;
      drawPixelRect(x-8,y-11,16,22,stunned?'#7f8061':'#6b7654');drawPixelRect(x-6,y-14,12,7,'#b8ad7c');
      const fx=e.facing.x,fy=e.facing.y;ctx.save();
      const shieldReach=stunned?5:10, shieldTilt=stunned?.65:0;
      ctx.translate(x+fx*shieldReach,y+fy*shieldReach+ (stunned?7:0));ctx.rotate(Math.atan2(fy,fx)+shieldTilt);
      drawPixelRect(-2,-10,7,20,'#a9a17e');drawPixelRect(1,-7,2,14,'#d4cfb6');ctx.restore();
      if(stunned){
        for(let i=0;i<3;i++){
          const a=gameTime*4+i*Math.PI*2/3;
          drawPixelRect(x+Math.cos(a)*12-2,y-22+Math.sin(a)*4-2,4,4,'#f0d85f');
        }
      }
    }else if(e.type==='burrow'){
      if(e.state==='hidden'){ctx.fillStyle='#5b4530';ctx.beginPath();ctx.ellipse(x,y+7,14,6,0,0,Math.PI*2);ctx.fill();drawPixelRect(x-6,y+4,12,3,'#8a6842')}
      else{drawPixelRect(x-9,y-10,18,20,'#80603d');drawPixelRect(x-5,y-6,3,3,'#f0cc62');drawPixelRect(x+2,y-6,3,3,'#f0cc62');drawPixelRect(x-12,y-1,6,4,'#b79c67');drawPixelRect(x+6,y-1,6,4,'#b79c67')}
    }else if(e.type==='charger'){
      drawPixelRect(x-11,y-10,22,20,'#8a4a35');drawPixelRect(x-9,y-15,6,8,'#d5c090');drawPixelRect(x+3,y-15,6,8,'#d5c090');drawPixelRect(x-5,y-5,3,3,'#f0d55c');drawPixelRect(x+2,y-5,3,3,'#f0d55c');
    }else if(e.type==='fire'){
      drawPixelRect(x-10,y-10,20,20,'#b64e2f');drawPixelRect(x-6,y-14,12,7,'#e17a3c');drawPixelRect(x-5,y-5,3,3,'#ffe06a');drawPixelRect(x+2,y-5,3,3,'#ffe06a');drawPixelRect(x-3,y+4,6,4,'#3a201b');
    }else if(e.type==='wizard'){
      drawPixelRect(x-9,y-7,18,18,'#6a4a92');drawPixelRect(x-12,y-12,24,7,'#8b68b1');drawPixelRect(x-4,y-17,8,7,'#8b68b1');drawPixelRect(x-4,y-4,3,3,'#f2df65');drawPixelRect(x+2,y-4,3,3,'#f2df65');
    }else if(e.type==='turret'){
      drawPixelRect(x-13,y-13,26,26,'#77755f');drawPixelRect(x-9,y-9,18,18,'#a09c7d');drawPixelRect(x-4,y-4,8,8,'#4b4639');drawPixelRect(x-2,y-2,4,4,'#c85a42');
    }else if(e.type==='ghost'){
      ctx.globalAlpha=.72+Math.sin(gameTime*5+e.angle)*.12;drawPixelRect(x-9,y-11,18,18,'#cbd4d0');drawPixelRect(x-7,y+7,5,6,'#cbd4d0');drawPixelRect(x+2,y+7,5,6,'#cbd4d0');drawPixelRect(x-5,y-5,3,4,'#36413d');drawPixelRect(x+2,y-5,3,4,'#36413d');
    }else if(e.type==='mimic'){
      const open=e.state!=='sleep';drawPixelRect(x-14,y-10,28,21,'#6f4323');drawPixelRect(x-12,y-8,24,16,'#9a6532');drawPixelRect(x-12,y-3,24,4,'#d1a04f');
      if(open){drawPixelRect(x-10,y-15,20,7,'#b77a3c');drawPixelRect(x-7,y-5,4,4,'#f0dd66');drawPixelRect(x+3,y-5,4,4,'#f0dd66');drawPixelRect(x-6,y+7,4,5,'#e3d7b2');drawPixelRect(x+2,y+7,4,5,'#e3d7b2')}
    }else if(e.type==='eye'){
      ctx.fillStyle='#c8c4a6';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8f3f4a';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b211d';ctx.beginPath();ctx.arc(x+e.facing.x*2,y+e.facing.y*2,3,0,Math.PI*2);ctx.fill();
    }else if(e.type==='leech'){
      drawPixelRect(x-11,y-5,22,10,'#76513f');drawPixelRect(x-7,y-8,14,5,'#9a6b4f');drawPixelRect(x-7,y+5,14,4,'#4e342c');drawPixelRect(x+6,y-2,3,3,'#e3c85b');
    }else if(e.type==='lancer'){
      drawPixelRect(x-8,y-11,16,22,'#4f6377');drawPixelRect(x-6,y-15,12,7,'#8fa0a7');drawPixelRect(x-4,y-7,3,3,'#e1c75c');drawPixelRect(x+2,y-7,3,3,'#e1c75c');ctx.save();ctx.translate(x+e.facing.x*12,y+e.facing.y*12);ctx.rotate(Math.atan2(e.facing.y,e.facing.x));drawPixelRect(0,-2,24,4,'#d8d7c4');drawPixelRect(21,-4,7,8,'#ebe8cf');ctx.restore();
    }else if(e.type==='orbiter'){
      ctx.fillStyle='#527a9c';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a8d6e8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,16,gameTime,gameTime+Math.PI*1.4);ctx.stroke();drawPixelRect(x-3,y-3,6,6,'#e9da73');
    }else if(e.type==='summoner'){
      drawPixelRect(x-10,y-9,20,22,'#734b89');drawPixelRect(x-13,y-14,26,8,'#9a6ab1');drawPixelRect(x-4,y-6,3,3,'#e7d56b');drawPixelRect(x+2,y-6,3,3,'#e7d56b');ctx.strokeStyle='#b78ed2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+2,15,0,Math.PI*2);ctx.stroke();
    }else if(e.type==='bomber'){
      const pulse=e.state==='fuse'&&Math.floor(gameTime*12)%2===0;ctx.fillStyle=pulse?'#e7b052':'#3d403b';ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();drawPixelRect(x+5,y-15,4,8,'#c79749');drawPixelRect(x+8,y-18,4,4,'#f0d269');drawPixelRect(x-5,y-4,3,3,'#e7d866');drawPixelRect(x+2,y-4,3,3,'#e7d866');
    }else if(e.type==='iceMage'){
      drawPixelRect(x-9,y-8,18,20,'#5b8fa9');drawPixelRect(x-12,y-14,24,8,'#90c6d8');drawPixelRect(x-4,y-18,8,6,'#bce9f4');drawPixelRect(x-4,y-5,3,3,'#f1f5dd');drawPixelRect(x+2,y-5,3,3,'#f1f5dd');
    }else if(e.type==='moth'){
      drawPixelRect(x-4,y-7,8,15,'#6e557d');drawPixelRect(x-17,y-9,13,10,'#a786b0');drawPixelRect(x+4,y-9,13,10,'#a786b0');drawPixelRect(x-14,y+1,10,6,'#7f648c');drawPixelRect(x+4,y+1,10,6,'#7f648c');drawPixelRect(x-2,y-4,2,2,'#f1df6f');drawPixelRect(x+1,y-4,2,2,'#f1df6f');
    }else if(e.type==='centipede'){
      const a=e.angle;for(let i=3;i>=0;i--){const bx=x-Math.cos(a)*i*8,by=y-Math.sin(a)*i*8;ctx.fillStyle=i===0?'#8f5c36':'#6f7e3d';ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill()}drawPixelRect(x-4,y-3,3,3,'#f0d565');drawPixelRect(x+2,y-3,3,3,'#f0d565');
    }
    if(e.hp<e.maxHp){ctx.fillStyle='#271f1a';ctx.fillRect(x-12,y-e.r-10,24,4);ctx.fillStyle='#c55243';ctx.fillRect(x-11,y-e.r-9,22*(e.hp/e.maxHp),2)}
    ctx.restore();
  }
  function drawBoss(e,x,y){
    if(e.bossType==='beast'){
      drawPixelRect(x-25,y-18,50,38,'#8d4a34');drawPixelRect(x-20,y-28,13,14,'#d2bc83');drawPixelRect(x+7,y-28,13,14,'#d2bc83');drawPixelRect(x-10,y-9,6,5,'#f0cf55');drawPixelRect(x+4,y-9,6,5,'#f0cf55');drawPixelRect(x-7,y+6,14,7,'#3c231b');
    }else if(e.bossType==='mage'){
      drawPixelRect(x-20,y-10,40,35,'#5f3e8e');drawPixelRect(x-28,y-22,56,12,'#805ab0');drawPixelRect(x-7,y-38,14,16,'#805ab0');drawPixelRect(x-9,y-5,6,6,'#ffe36a');drawPixelRect(x+3,y-5,6,6,'#ffe36a');ctx.strokeStyle='#ba8cf0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,32,0,Math.PI*2);ctx.stroke();
    }else if(e.bossType==='giantSpider'){
      const lift=e.state==='jump'?18:0;drawPixelRect(x-22,y-18-lift,44,36,'#60352f');drawPixelRect(x-11,y-12-lift,6,5,'#e1bd50');drawPixelRect(x+5,y-12-lift,6,5,'#e1bd50');ctx.strokeStyle='#32221e';ctx.lineWidth=5;for(let i=-1;i<=1;i+=2){for(let j=-1;j<=1;j+=2){ctx.beginPath();ctx.moveTo(x+i*18,y+j*7-lift);ctx.lineTo(x+i*38,y+j*20);ctx.stroke()}}
    }else if(e.bossType==='hydra'){
      drawPixelRect(x-22,y-5,44,34,'#4f843f');for(const off of [-16,0,16]){drawPixelRect(x+off-8,y-27,16,24,'#6aa853');drawPixelRect(x+off-5,y-22,3,3,'#f0d75b');drawPixelRect(x+off+2,y-22,3,3,'#f0d75b')}drawPixelRect(x-30,y+18,60,10,'#355f31');
    }else if(e.bossType==='knight'){
      drawPixelRect(x-22,y-19,44,40,'#777b7c');drawPixelRect(x-17,y-30,34,13,'#aab0ae');drawPixelRect(x-10,y-14,6,5,'#d8473d');drawPixelRect(x+4,y-14,6,5,'#d8473d');ctx.save();ctx.translate(x+e.facing.x*25,y+e.facing.y*25);ctx.rotate(Math.atan2(e.facing.y,e.facing.x));drawPixelRect(-4,-17,10,34,'#b9b7a4');drawPixelRect(-1,-13,3,26,'#e2ddc1');ctx.restore();
    }else if(e.bossType==='cyclops'){
      drawPixelRect(x-26,y-18,52,42,'#8a6543');drawPixelRect(x-22,y-28,44,15,'#ac8254');drawPixelRect(x-8,y-19,16,12,'#e2d8ae');drawPixelRect(x-3,y-16,6,6,'#9b3f37');drawPixelRect(x-18,y+12,12,13,'#5e452f');drawPixelRect(x+6,y+12,12,13,'#5e452f');
    }else if(e.bossType==='stormIdol'){
      drawPixelRect(x-24,y-23,48,48,'#536a78');drawPixelRect(x-18,y-17,36,36,'#7e98a4');drawPixelRect(x-6,y-6,12,12,'#d7eafa');ctx.strokeStyle='#9cd8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,31,e.angle,e.angle+Math.PI*1.5);ctx.stroke();drawPixelRect(x-26,y-5,8,10,'#cad7db');drawPixelRect(x+18,y-5,8,10,'#cad7db');
    }else if(e.bossType==='sandWyrm'){
      if(e.grounded===false){ctx.fillStyle='#7b5b37';ctx.beginPath();ctx.ellipse(x,y+8,31,11,0,0,Math.PI*2);ctx.fill();drawPixelRect(x-20,y+3,40,5,'#b58a54')}
      else{drawPixelRect(x-20,y-28,40,54,'#9e7345');drawPixelRect(x-15,y-35,30,13,'#c1975c');drawPixelRect(x-9,y-20,6,5,'#f0d666');drawPixelRect(x+3,y-20,6,5,'#f0d666');drawPixelRect(x-10,y+5,20,8,'#4e3324');for(let i=-1;i<=1;i+=2)drawPixelRect(x+i*22,y-10,10,7,'#d2ad72')}
    }else if(e.bossType==='frostQueen'){
      drawPixelRect(x-22,y-12,44,38,'#6ba1b8');drawPixelRect(x-17,y-28,34,20,'#a9d9e6');drawPixelRect(x-14,y-38,8,13,'#d9f4f8');drawPixelRect(x-2,y-42,8,17,'#d9f4f8');drawPixelRect(x+10,y-36,7,11,'#d9f4f8');drawPixelRect(x-9,y-17,6,5,'#eff9e8');drawPixelRect(x+3,y-17,6,5,'#eff9e8');ctx.strokeStyle='#c9f4ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,31,0,Math.PI*2);ctx.stroke();
    }else if(e.bossType==='voidMask'){
      ctx.globalAlpha=.82+Math.sin(gameTime*4)*.12;ctx.fillStyle='#2c2138';ctx.beginPath();ctx.ellipse(x,y,27,34,0,0,Math.PI*2);ctx.fill();drawPixelRect(x-18,y-23,36,46,'#7d63a0');drawPixelRect(x-12,y-14,8,9,'#e0c86c');drawPixelRect(x+4,y-14,8,9,'#e0c86c');drawPixelRect(x-8,y+10,16,6,'#2b2035');ctx.strokeStyle='#b58ad3';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,38,e.angle,e.angle+Math.PI);ctx.stroke();
    }
  }

  function cameraForPoint(room,px,py){
    const size=roomSize(room);
    const camX=size.w>VIEW.w?clamp(px-VIEW.w/2,0,size.w-VIEW.w):0;
    const camY=size.h>VIEW.h?clamp(py-VIEW.h/2,0,size.h-VIEW.h):0;
    return {x:camX,y:camY,ox:VIEW.x+(size.w<VIEW.w?(VIEW.w-size.w)/2:0)-camX,oy:VIEW.y+(size.h<VIEW.h?(VIEW.h-size.h)/2:0)-camY};
  }
  function drawOrbitals(cam,shiftX=0,shiftY=0){
    const count=(player.passive.orbital||0)+(player.orbitNovaTimer>0?3:0);
    if(!count) return;
    for(let i=0;i<count;i++){
      const a=player.orbitAngle+i*Math.PI*2/count,rad=player.orbitNovaTimer>0?40:34;
      const x=cam.ox+shiftX+player.x+Math.cos(a)*rad,y=cam.oy+shiftY+player.y+Math.sin(a)*rad;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);drawPixelRect(-3,-10,6,20,player.orbitNovaTimer>0?'#9bdcff':'#d9e0d3');drawPixelRect(-6,5,12,4,'#d4b85c');ctx.restore();
    }
  }
  function drawRoomScene(room,shiftX=0,shiftY=0,includePlayer=true,focus=null){
    const point=focus||{x:player.x,y:player.y},cam=cameraForPoint(room,point.x,point.y),ox=cam.ox+shiftX,oy=cam.oy+shiftY;
    drawRoomBase(room,cam,shiftX,shiftY);
    ctx.save();ctx.beginPath();ctx.rect(VIEW.x+shiftX,VIEW.y+shiftY,VIEW.w,VIEW.h);ctx.clip();
    for(const h of room.holes) drawHole(h,ox,oy);
    for(const b of room.blocks) drawBlock(b,ox,oy);
    if(room.stairs) drawStairs(room.stairs,ox,oy);
    for(const c of room.chests) drawChest(c,ox,oy);
    for(const p of room.pickups) drawPickup(p,ox,oy);
    for(const b of bombs) if(b.roomId===room.id) drawBomb(b,ox,oy);
    for(const p of projectiles) if(p.roomId===room.id) drawProjectile(p,ox,oy);
    for(const blast of blastEffects){
      if(blast.roomId!==room.id) continue;
      const progress=1-blast.life/blast.maxLife,rad=blast.radius*(.22+.78*progress);
      ctx.globalAlpha=clamp(blast.life/blast.maxLife,0,1)*.55;
      ctx.fillStyle='#f0bd4f';ctx.beginPath();ctx.arc(ox+blast.x,oy+blast.y,rad,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=clamp(blast.life/blast.maxLife,0,1)*.9;ctx.strokeStyle='#fff0a2';ctx.lineWidth=5;ctx.stroke();ctx.globalAlpha=1;
    }
    for(const e of room.enemies) drawEnemy(e,ox,oy);
    if(includePlayer&&room.id===currentRoomId){drawOrbitals(cam,shiftX,shiftY);drawHero(player.x,player.y,cam,shiftX,shiftY)}
    for(const p of particles){if(p.roomId!==room.id)continue;ctx.globalAlpha=clamp(p.life/.5,0,1);drawPixelRect(ox+p.x,oy+p.y,p.size,p.size,p.color)}ctx.globalAlpha=1;
    ctx.restore();
    const boss=room.enemies.find(e=>e.type==='boss');
    if(boss&&includePlayer){
      const bw=380,pcx=VIEW.x+VIEW.w/2,bx=pcx-bw/2,by=VIEW.y+12;ctx.fillStyle='rgba(20,18,14,.85)';ctx.fillRect(bx-4,by-4,bw+8,18);ctx.fillStyle='#8f332d';ctx.fillRect(bx,by,bw*(boss.hp/boss.maxHp),10);ctx.fillStyle='#efe0ad';ctx.font=`800 11px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText(bossDisplayName(boss.bossType),pcx,by+28);ctx.textAlign='left';
    }
  }
  function roomRemainingItemCount(room){
    if(!room) return 0;
    const loose=(room.pickups||[]).filter(p=>!p.collected).length;
    const chests=(room.chests||[]).filter(c=>!c.opened).length;
    return loose+chests;
  }
  function drawMapLootMarker(x,y,size,count){
    if(count<=0) return;
    const s=Math.max(3,Math.min(6,Math.floor(size*.28)));
    ctx.fillStyle='#ecfff4';
    ctx.beginPath();
    ctx.moveTo(x,y-s);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#287b57';ctx.lineWidth=1;ctx.stroke();
  }

  function drawMiniMap(){
    const visible=rooms.filter(r=>r.visited);
    const box={x:SIDE.x+10,y:SIDE.y+32,w:SIDE.w-20,h:154};
    ctx.fillStyle='#d7c994';ctx.fillRect(box.x,box.y,box.w,box.h);
    ctx.strokeStyle='#756a45';ctx.lineWidth=2;ctx.strokeRect(box.x,box.y,box.w,box.h);
    ctx.fillStyle='#e8ddb0';ctx.font=`800 14px ${UI_FONT}`;ctx.fillText('DUNGEON MAP',SIDE.x+12,SIDE.y+22);
    if(!visible.length) return;

    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const r of visible){
      minX=Math.min(minX,r.gx);minY=Math.min(minY,r.gy);
      maxX=Math.max(maxX,r.gx+r.w);maxY=Math.max(maxY,r.gy+r.h);
    }
    minX-=.45;minY-=.45;maxX+=.45;maxY+=.45;
    const gridW=Math.max(1,maxX-minX),gridH=Math.max(1,maxY-minY);
    const cell=Math.max(7,Math.min(18,Math.floor(Math.min((box.w-16)/gridW,(box.h-16)/gridH))));
    const totalW=gridW*cell,totalH=gridH*cell;
    const baseX=Math.round(box.x+(box.w-totalW)/2);
    const baseY=Math.round(box.y+(box.h-totalH)/2);
    const mapColor=r=>r.id===currentRoomId?'#ead45e':r.kind==='boss'?'#a85b4b':r.kind==='secret'?'#6e9f69':'#898989';

    ctx.fillStyle='#6f6f6f';
    for(const r of visible){
      for(const link of r.links){
        const other=roomById.get(link.to);
        if(!other?.visited||r.id>other.id) continue;
        const bridge=Math.max(3,Math.floor(cell*.3));
        if(link.dir==='E'||link.dir==='W'){
          const boundary=link.dir==='E'?r.gx+r.w:r.gx;
          const x=Math.round(baseX+(boundary-minX)*cell),y=Math.round(baseY+(link.globalCoord-minY)*cell);
          ctx.fillRect(x-3,y-Math.floor(bridge/2),6,bridge);
        }else{
          const boundary=link.dir==='S'?r.gy+r.h:r.gy;
          const x=Math.round(baseX+(link.globalCoord-minX)*cell),y=Math.round(baseY+(boundary-minY)*cell);
          ctx.fillRect(x-Math.floor(bridge/2),y-3,bridge,6);
        }
      }
    }

    for(const r of visible){
      const x=Math.round(baseX+(r.gx-minX)*cell),y=Math.round(baseY+(r.gy-minY)*cell);
      const w=Math.max(6,r.w*cell),h=Math.max(6,r.h*cell);
      ctx.fillStyle='#111411';ctx.fillRect(x,y,w,h);
      ctx.fillStyle=mapColor(r);ctx.fillRect(x+2,y+2,w-4,h-4);
      ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(x+3,y+3,Math.max(1,w-6),2);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+3,y+h-5,Math.max(1,w-6),2);
      ctx.strokeStyle=r.id===currentRoomId?'#fff1a1':'#252a25';ctx.lineWidth=r.id===currentRoomId?2:1;ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);

      const cx=x+w/2,cy=y+h/2;ctx.fillStyle='#172019';ctx.font=`800 ${Math.max(8,Math.min(12,cell-3))}px ${UI_FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';
      if(r.kind==='boss') ctx.fillText('B',cx,cy);else if(r.kind==='start') ctx.fillText('S',cx,cy);else if(r.kind==='secret') ctx.fillText('?',cx,cy);
      if(r.id===currentRoomId){ctx.fillStyle='#24442d';ctx.fillRect(Math.round(cx)-2,Math.round(cy)-2,4,4)}
      const lootCount=roomRemainingItemCount(r);
      if(lootCount>0) drawMapLootMarker(x+w-Math.max(4,Math.floor(cell*.28))-2,y+Math.max(4,Math.floor(cell*.28))+2,cell,lootCount);

      for(const link of r.links){
        const other=roomById.get(link.to);
        if(!other||other.visited||link.secret) continue;
        ctx.fillStyle='#f2dc72';
        const stub=Math.max(4,Math.floor(cell*.34));
        if(link.dir==='E'||link.dir==='W'){
          const bx=link.dir==='E'?x+w:x;
          const by=Math.round(baseY+(link.globalCoord-minY)*cell);
          const sx=link.dir==='E'?bx:bx-stub;
          ctx.fillRect(sx,by-2,stub,4);
          ctx.fillStyle='#3d493c';ctx.fillRect(link.dir==='E'?bx-2:bx,by-3,2,6);
        }else{
          const by=link.dir==='S'?y+h:y;
          const bx=Math.round(baseX+(link.globalCoord-minX)*cell);
          const sy=link.dir==='S'?by:by-stub;
          ctx.fillRect(bx-2,sy,4,stub);
          ctx.fillStyle='#3d493c';ctx.fillRect(bx-3,link.dir==='S'?by-2:by,6,2);
        }
      }
    }
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    drawMapLootMarker(box.x+10,box.y+box.h-8,9,1);
    ctx.fillStyle='#5a5d49';ctx.font=`600 9px ${UI_FONT}`;ctx.fillText('loot remains · gold = unexplored exit',box.x+18,box.y+box.h-6);
  }

  function transitionFocus(next,fromId){
    const back=next.links.find(l=>l.to===fromId),d=doorLocal(next,back),size=roomSize(next),inset=WALL+30;
    if(back.dir==='N') return {x:d.x,y:inset};if(back.dir==='S') return {x:d.x,y:size.h-inset};if(back.dir==='W') return {x:inset,y:d.y};return {x:size.w-inset,y:d.y};
  }
  function drawPlay(){
    drawHUD();ctx.fillStyle='#0b100c';ctx.fillRect(0,74,CW,CH-74);
    if(transition){
      const p=clamp(transition.t/transition.duration,0,1),room=roomById.get(transition.from),next=roomById.get(transition.to);
      const vec={x:transition.dir==='E'?1:transition.dir==='W'?-1:0,y:transition.dir==='S'?1:transition.dir==='N'?-1:0};
      const sx=-vec.x*VIEW.w*p,sy=-vec.y*VIEW.h*p,nx=vec.x*VIEW.w*(1-p),ny=vec.y*VIEW.h*(1-p);
      drawRoomScene(room,sx,sy,true);drawRoomScene(next,nx,ny,false,transitionFocus(next,room.id));
    }else drawRoomScene(currentRoom());
    drawSidePanel();drawMessages();
  }

  function shopItemRect(i){
    const col=i%3,row=Math.floor(i/3);return {x:90+col*275,y:228+row*125,w:230,h:100};
  }
  function drawShopIcon(item,x,y){
    if(item.kind==='passive'){ctx.fillStyle='#f0d56b';ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();drawPixelRect(x-5,y-10,10,20,'#497844')}
    else if(item.kind==='active'){ctx.fillStyle='#83b6e8';ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();drawPixelRect(x-3,y-12,6,24,'#f4f0d2');drawPixelRect(x-10,y-3,20,6,'#f4f0d2')}
    else if(item.id==='bombs'){ctx.fillStyle='#292d2a';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();drawPixelRect(x+4,y-17,4,8,'#e0aa53')}
    else if(item.id==='heal'){drawHeart(x-6,y-6,1)}
    else{drawPixelRect(x-3,y-14,6,22,'#e2c864');ctx.strokeStyle='#e2c864';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-11,7,0,Math.PI*2);ctx.stroke()}
  }
  function drawMerchant(){
    const x=shop.merchant.x,y=shop.merchant.y;drawPixelRect(x-20,y+10,40,25,'#553d29');drawPixelRect(x-15,y-16,30,28,'#d0a16e');drawPixelRect(x-19,y-23,38,10,'#803f32');drawPixelRect(x-10,y-7,4,4,'#1e211b');drawPixelRect(x+6,y-7,4,4,'#1e211b');drawPixelRect(x-9,y+3,18,7,'#e5d8b9');drawPixelRect(x-25,y+33,50,8,'#9a7342');
  }
  function drawShop(){
    drawHUD();ctx.fillStyle='#201a15';ctx.fillRect(SHOP_VIEW.x,SHOP_VIEW.y,SHOP_VIEW.w,SHOP_VIEW.h);ctx.fillStyle='#796142';ctx.fillRect(SHOP_VIEW.x+18,SHOP_VIEW.y+18,SHOP_VIEW.w-36,SHOP_VIEW.h-36);
    for(let y=SHOP_VIEW.y+24;y<SHOP_VIEW.y+SHOP_VIEW.h-20;y+=28)for(let x=SHOP_VIEW.x+24;x<SHOP_VIEW.x+SHOP_VIEW.w-20;x+=28){ctx.fillStyle=((x+y)/28)%2?'rgba(255,255,255,.025)':'rgba(0,0,0,.04)';ctx.fillRect(x,y,24,24)}
    drawMerchant();ctx.fillStyle='#f2e5b6';ctx.font=`900 19px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('THE WAYFARER\'S SHOP',CW/2,118);ctx.font=`700 12px ${UI_FONT}`;ctx.fillText('Click any item you can afford. Walk onto the lower staircase when ready.',CW/2,140);ctx.textAlign='left';
    shop.items.forEach((item,i)=>{
      const r=shopItemRect(i);ctx.fillStyle=item.bought?'rgba(42,39,31,.75)':'rgba(235,221,171,.94)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=item.bought?'#575044':'#2a3427';ctx.lineWidth=3;ctx.strokeRect(r.x,r.y,r.w,r.h);drawShopIcon(item,r.x+30,r.y+35);
      ctx.fillStyle=item.bought?'#827c69':'#1b251c';ctx.font=`900 12px ${UI_FONT}`;ctx.fillText(item.bought?'SOLD':itemName(item),r.x+57,r.y+25);ctx.font=`600 10px ${UI_FONT}`;wrapText(itemDesc(item),r.x+57,r.y+42,r.w-66,13);ctx.font=`900 13px ${UI_FONT}`;ctx.fillStyle=item.bought?'#827c69':'#40724a';ctx.fillText(item.bought?'':`◆ ${item.price}`,r.x+14,r.y+87);
    });
    for(const p of (shop.droppedItems||[])) drawPickup(p,0,0);
    drawStairs(shop.backExit,0,0);drawStairs(shop.exit,0,0);drawHero(player.x,player.y,{ox:0,oy:0},0,0);ctx.fillStyle='#e7d8a6';ctx.font=`900 11px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('RETURN TO BOSS ROOM',shop.backExit.x,shop.backExit.y-28);ctx.fillText(`CONTINUE TO STAGE ${stage+1}`,shop.exit.x,shop.exit.y-28);ctx.textAlign='left';drawMessages();
  }

  function wrapText(text,x,y,maxWidth,lineHeight){
    const words=text.split(' ');let line='';
    for(const word of words){const test=line+word+' ';if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight}else line=test}ctx.fillText(line,x,y);
  }

  function drawMessages(){
    const pcx=VIEW.x+VIEW.w/2;
    if(messageTimer>0&&message){
      ctx.font=`800 12px ${UI_FONT}`;const w=Math.min(VIEW.w-30,ctx.measureText(message).width+34),x=pcx-w/2,y=574;
      ctx.fillStyle='rgba(18,24,18,.92)';ctx.fillRect(x,y,w,28);ctx.strokeStyle='#d3c188';ctx.lineWidth=2;ctx.strokeRect(x,y,w,28);ctx.fillStyle='#f1e5b8';ctx.textAlign='center';ctx.fillText(message,pcx,y+18);ctx.textAlign='left';
    }
    if(stageBanner>0){
      const a=clamp(stageBanner<.5?stageBanner/.5:stageBanner>1.7?(2.2-stageBanner)/.5:1,0,1),bw=350,bx=pcx-bw/2;
      ctx.globalAlpha=a;ctx.fillStyle='rgba(15,20,16,.9)';ctx.fillRect(bx,265,bw,82);ctx.strokeStyle='#d3c069';ctx.lineWidth=3;ctx.strokeRect(bx,265,bw,82);ctx.fillStyle='#f1e0a0';ctx.font=`900 28px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText(`STAGE ${stage}`,pcx,300);ctx.font=`800 12px ${UI_FONT}`;ctx.fillText('Find the boss chamber.',pcx,326);ctx.textAlign='left';ctx.globalAlpha=1;
    }
  }

  function drawTitle(){
    ctx.fillStyle='#111812';ctx.fillRect(0,0,CW,CH);
    for(let y=0;y<CH;y+=32)for(let x=0;x<CW;x+=32){ctx.fillStyle=((x+y)/32)%2?'#1a241b':'#171f18';ctx.fillRect(x,y,30,30)}
    ctx.fillStyle='#d7c478';ctx.font=`900 44px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('GREENBLADE',CW/2,165);ctx.fillText('DUNGEON',CW/2,213);
    ctx.fillStyle='#8eb066';ctx.font=`800 16px ${UI_FONT}`;ctx.fillText('A RANDOMIZED RETRO DUNGEON',CW/2,254);
    const fakeCam={ox:CW/2-480,oy:330};const oldPlayer=player;if(!player)player=makePlayer();drawHero(480,0,fakeCam);player=oldPlayer;
    ctx.fillStyle='#eadca9';ctx.font=`900 18px ${UI_FONT}`;ctx.fillText(isMobileDevice?'TAP NEW ABOVE TO CHOOSE A SEED':'CLICK OR PRESS ENTER TO CHOOSE A SEED',CW/2,440);
    ctx.font=`700 13px ${UI_FONT}`;ctx.fillStyle='#aebd91';ctx.fillText('Clear rooms · Find secrets · Defeat bosses · Descend deeper',CW/2,485);
    const scores=getScores();ctx.fillStyle='#d8c786';ctx.font=`800 13px ${UI_FONT}`;
    ctx.fillText(scores.length?`BEST: STAGE ${scores[0].stage} · ${scores[0].seed}`:'NO RUNS RECORDED YET',CW/2,537);ctx.textAlign='left';
  }
  function drawGameOver(){
    drawPlay();ctx.fillStyle='rgba(10,12,10,.86)';ctx.fillRect(0,0,CW,CH);ctx.fillStyle='#e6d6a0';ctx.textAlign='center';ctx.font=`900 34px ${UI_FONT}`;ctx.fillText('THE RUN IS OVER',CW/2,145);
    ctx.font=`800 18px ${UI_FONT}`;ctx.fillText(`Furthest stage reached: ${stage}`,CW/2,184);ctx.fillStyle='#d2c16f';ctx.font=`800 15px ${UI_FONT}`;ctx.fillText(`SEED ID: ${runSeed}`,CW/2,211);
    const scores=getScores();ctx.fillStyle='#eadca9';ctx.font=`900 14px ${UI_FONT}`;ctx.fillText('TOP THREE RUNS',CW/2,251);
    scores.forEach((s,i)=>{
      const y=286+i*64;ctx.fillStyle='rgba(231,220,171,.96)';ctx.fillRect(250,y-20,460,52);ctx.strokeStyle='#6f6746';ctx.lineWidth=2;ctx.strokeRect(250,y-20,460,52);
      ctx.fillStyle='#1c291f';ctx.font=`900 15px ${UI_FONT}`;ctx.fillText(`${i+1}. STAGE ${s.stage}`,CW/2,y);
      ctx.font=`700 11px ${UI_FONT}`;ctx.fillText(`${s.seed} · ${s.date}`,CW/2,y+20);
    });
    ctx.fillStyle='#d2c16f';ctx.font=`900 16px ${UI_FONT}`;ctx.fillText(isMobileDevice?'TAP NEW ABOVE FOR A NEW RUN':'CLICK OR PRESS ENTER FOR A NEW RUN',CW/2,522);ctx.textAlign='left';
  }
  function drawOverlay(){
    if(!overlay) return;
    const panel={x:105,y:48,w:750,h:544};
    ctx.fillStyle='rgba(7,10,8,.86)';ctx.fillRect(0,0,CW,CH);ctx.fillStyle='#eadfb5';ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.strokeStyle='#263328';ctx.lineWidth=5;ctx.strokeRect(panel.x,panel.y,panel.w,panel.h);
    ctx.fillStyle='#172219';ctx.textAlign='center';ctx.font=`900 27px ${UI_FONT}`;
    const overlayTitle=overlay==='help'?'HOW TO PLAY':overlay==='scores'?'HIGH SCORES':'POWER-UP DETAILS';
    ctx.fillText(overlayTitle,CW/2,91);ctx.textAlign='left';
    if(overlay==='help'){
      ctx.fillStyle='#d9c98f';ctx.fillRect(132,112,330,402);ctx.fillRect(498,112,330,402);ctx.strokeStyle='#7b704b';ctx.lineWidth=2;ctx.strokeRect(132,112,330,402);ctx.strokeRect(498,112,330,402);
      ctx.fillStyle='#182319';ctx.font=`900 16px ${UI_FONT}`;ctx.fillText('CONTROLS',153,143);ctx.fillText('DUNGEON RULES',519,143);
      ctx.font=`700 14px ${UI_FONT}`;
      const controls=isMobileDevice?[
        ['Move','Left joystick'],
        ['Run','Double-tap a direction'],
        ['Sword','Hold right joystick'],
        ['Aim','Eight directions'],
        ['Active item','ITEM button'],
        ['Bomb','BOMB button'],
        ['Jump','JUMP button'],
        ['Pause','Top PAUSE button'],
        ['Mute','Top SOUND button']
      ]:[
        ['Move','WASD or Arrow Keys'],
        ['Run','Double-tap one direction'],
        ['Sword','Mouse click toward target'],
        ['Aim','Attacks snap to 8 directions'],
        ['Active item','X'],
        ['Bomb','C'],
        ['Jump','Z or Space'],
        ['Pause','P or Escape'],
        ['Mute','M']
      ];
      let y=174;for(const [label,value] of controls){ctx.fillStyle='#173522';ctx.font=`900 13px ${UI_FONT}`;ctx.fillText(`${label}:`,153,y);ctx.fillStyle='#263329';ctx.font=`700 13px ${UI_FONT}`;ctx.fillText(value,235,y);y+=35}
      ctx.fillStyle='#263329';ctx.font=`700 13px ${UI_FONT}`;
      const rules=[
        'Double-tap a movement direction to run until blocked or attacking.',
        'Clear every enemy to unlock normal doors and chests.',
        'Hit a shield twice to stun its guard for one second.',
        'Jump over enemies, projectiles, blocks, and gaps.',
        'Falling into a hole costs half a heart.',
        'Bomb cracked blocks and suspicious walls; blasts are wide and powerful.',
        'Secret rooms stay hidden until you enter them.',
        'Passive upgrades work automatically; click one in the HUD for details.',
        'Use X for your equipped weapon or magic item.',
        'Purple arcane crystals restore charges to runes and charged magic.',
        'Boss stairs lead to a six-item merchant shop.',
        'Death restarts the run from Stage 1.'
      ];
      y=166;for(const line of rules){wrapText(`• ${line}`,519,y,286,17);y+=32}
    }else if(overlay==='scores'){
      const scores=getScores();
      if(!scores.length){ctx.fillStyle='#354336';ctx.textAlign='center';ctx.font=`800 16px ${UI_FONT}`;ctx.fillText('No runs have been recorded yet.',CW/2,250);ctx.textAlign='left'}
      scores.forEach((s,i)=>{
        const y=146+i*112;ctx.fillStyle='#d7c994';ctx.fillRect(175,y,610,88);ctx.strokeStyle='#6e6544';ctx.lineWidth=2;ctx.strokeRect(175,y,610,88);
        ctx.fillStyle='#172219';ctx.font=`900 20px ${UI_FONT}`;ctx.fillText(`${i+1}. FURTHEST STAGE: ${s.stage}`,198,y+31);
        ctx.font=`800 13px ${UI_FONT}`;ctx.fillStyle='#314335';ctx.fillText(`SEED ID: ${s.seed}`,198,y+55);ctx.font=`600 12px ${UI_FONT}`;ctx.fillText(s.date,198,y+75);
      });
      ctx.fillStyle='#53604e';ctx.font=`700 12px ${UI_FONT}`;ctx.fillText('Scores are saved locally in this browser.',175,503);
    }else{
      const info=selectedPowerup;
      ctx.fillStyle='#d9c98f';ctx.fillRect(190,132,580,338);ctx.strokeStyle='#746a47';ctx.lineWidth=3;ctx.strokeRect(190,132,580,338);
      if(info?.kind==='passive'&&info.id&&PASSIVES[info.id]){
        const def=PASSIVES[info.id],count=player?.passive?.[info.id]||0;
        drawPowerIcon(info.id,244,205);
        ctx.fillStyle='#172219';ctx.font=`900 24px ${UI_FONT}`;ctx.fillText(def.name,282,194);
        ctx.fillStyle='#36503a';ctx.font=`800 13px ${UI_FONT}`;ctx.fillText(`PASSIVE POWER-UP${count>1?` · LEVEL ${count}`:''}`,282,220);
        ctx.fillStyle='#263329';ctx.font=`700 16px ${UI_FONT}`;wrapText(def.desc,235,276,490,25);
        ctx.fillStyle='#53604e';ctx.font=`700 13px ${UI_FONT}`;wrapText('This power-up works automatically and remains active for the rest of the run.',235,350,490,21);
      }else if(info?.kind==='active'&&info.id&&ACTIVES[info.id]){
        const def=ACTIVES[info.id];
        ctx.fillStyle='#294d34';ctx.fillRect(224,177,42,42);ctx.fillStyle='#edf5d8';ctx.font=`900 25px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('X',245,207);ctx.textAlign='left';
        ctx.fillStyle='#172219';ctx.font=`900 24px ${UI_FONT}`;ctx.fillText(def.name,286,194);
        ctx.fillStyle='#36503a';ctx.font=`800 13px ${UI_FONT}`;ctx.fillText('ACTIVE ITEM · PRESS X TO USE',286,220);
        ctx.fillStyle='#263329';ctx.font=`700 16px ${UI_FONT}`;wrapText(def.desc,235,276,490,25);
        ctx.fillStyle='#53604e';ctx.font=`700 13px ${UI_FONT}`;wrapText(activeStatusText(),235,350,490,21);
      }else{
        ctx.fillStyle='#294d34';ctx.fillRect(224,177,42,42);ctx.fillStyle='#edf5d8';ctx.font=`900 25px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('X',245,207);ctx.textAlign='left';
        ctx.fillStyle='#172219';ctx.font=`900 24px ${UI_FONT}`;ctx.fillText('No Active Item',286,198);
        ctx.fillStyle='#263329';ctx.font=`700 16px ${UI_FONT}`;wrapText('Find an active weapon or magic item in a chest, secret room, boss reward, or merchant shop.',235,276,490,25);
      }
      ctx.fillStyle='#53604e';ctx.font=`700 12px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('The game is paused while this information is open.',CW/2,438);ctx.textAlign='left';
    }
    ctx.fillStyle='#314b34';ctx.fillRect(390,536,180,38);ctx.strokeStyle='#172219';ctx.lineWidth=2;ctx.strokeRect(390,536,180,38);ctx.fillStyle='#f0e4b7';ctx.textAlign='center';ctx.font=`900 14px ${UI_FONT}`;ctx.fillText('CLOSE',480,561);ctx.textAlign='left';
  }
  function drawPause(){
    if(!paused) return;
    ctx.fillStyle='rgba(8,12,9,.78)';ctx.fillRect(0,0,CW,CH);ctx.fillStyle='#e9ddb0';ctx.fillRect(315,226,330,172);ctx.strokeStyle='#263329';ctx.lineWidth=5;ctx.strokeRect(315,226,330,172);
    ctx.fillStyle='#182219';ctx.font=`900 31px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('PAUSED',CW/2,277);ctx.font=`700 15px ${UI_FONT}`;ctx.fillText('Gameplay controls are locked.',CW/2,312);ctx.fillStyle='#31513a';ctx.fillRect(390,340,180,38);ctx.fillStyle='#f0e6bd';ctx.font=`900 14px ${UI_FONT}`;ctx.fillText('RESUME',CW/2,365);ctx.textAlign='left';
  }

  function render(){
    ctx.save();if(shake>0)ctx.translate(fxRand(-shake,shake),fxRand(-shake,shake));
    if(state==='title') drawTitle();
    else if(state==='shop') drawShop();
    else if(state==='gameover') drawGameOver();
    else drawPlay();
    if(flash>0){ctx.fillStyle=`rgba(255,245,210,${clamp(flash*4,0,.45)})`;ctx.fillRect(0,0,CW,CH)}
    drawPause();drawOverlay();ctx.restore();
  }

  function snapAim(dx,dy){
    const a=Math.atan2(dy,dx);let best=AIM_DIRS[0],score=Infinity;
    for(const d of AIM_DIRS){let diff=Math.abs(Math.atan2(Math.sin(a-d.a),Math.cos(a-d.a)));if(diff<score){score=diff;best=d}}
    return best;
  }
  function canvasPoint(ev){
    const r=canvas.getBoundingClientRect();return {x:(ev.clientX-r.left)*CW/r.width,y:(ev.clientY-r.top)*CH/r.height};
  }
  function handleCanvasClick(ev){
    unlockSoundAssets();const p=canvasPoint(ev);mouse=p;
    if(anyModalOpen()) return;
    if(overlay){if(p.x>=390&&p.x<=570&&p.y>=536&&p.y<=574)closeOverlay();return}
    if(paused){if(p.x>=390&&p.x<=570&&p.y>=340&&p.y<=378)togglePause(false);return}
    if(state==='title'||state==='gameover'){openNewRunModal();return}
    if(state==='shop'){
      for(let i=0;i<6;i++){const r=shopItemRect(i);if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){buyShopItem(i);return}}
      return;
    }
    if(state!=='play'||transition) return;
    const powerHit=powerupPanelHit(p.x,p.y);
    if(powerHit){openPowerupDetails(powerHit.kind,powerHit.id);return}
    if(isMobileDevice) return;
    if(p.x<VIEW.x||p.x>VIEW.x+VIEW.w||p.y<VIEW.y||p.y>VIEW.y+VIEW.h) return;
    const w=screenToWorld(p.x,p.y),d=snapAim(w.x-player.x,w.y-player.y);aimDir=d;attackSword(d);
  }
  function handleMouseMove(ev){
    const p=canvasPoint(ev);mouse=p;
    if(state==='play'&&!paused&&!overlay&&!transition&&!anyModalOpen()&&p.x>=VIEW.x&&p.x<=VIEW.x+VIEW.w&&p.y>=VIEW.y&&p.y<=VIEW.y+VIEW.h){const w=screenToWorld(p.x,p.y);aimDir=snapAim(w.x-player.x,w.y-player.y)}
  }

  const blockedCodes=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyW','KeyA','KeyS','KeyD','KeyX','KeyC','KeyP','Escape','KeyM']);
  window.addEventListener('keydown',e=>{
    if(soundOn) unlockSoundAssets();
    if(anyModalOpen()){
      if(!customSeedModal.hidden){
        if(e.code==='Escape'){e.preventDefault();customSeedModal.hidden=true;newRunModal.hidden=false;seedError.textContent=''}
        else if(e.code==='Enter'&&document.activeElement===seedInput){e.preventDefault();beginRunFromModal(seedInput.value)}
      }else if(e.code==='Escape'){e.preventDefault();closeAllModals()}
      return;
    }
    if(blockedCodes.has(e.code)) e.preventDefault();
    if(e.code==='KeyM'){soundOn=!soundOn;syncSoundButtons();if(soundOn){unlockSoundAssets().then(()=>{applySoundVolume();sfx('rupee')})}return}
    if(overlay){if(e.code==='Escape')closeOverlay();return}
    if(paused){if(e.code==='KeyP'||e.code==='Escape')togglePause(false);return}
    if(state==='title'||state==='gameover'){if(e.code==='Enter'||e.code==='Space')openNewRunModal();return}
    if(e.code==='KeyP'||e.code==='Escape'){togglePause();return}
    if(e.repeat&&['Space','KeyZ','KeyX','KeyC'].includes(e.code)) return;
    if(e.code==='Space'||e.code==='KeyZ'){
      if(state==='play')startJump();
      else if(state==='shop'&&player.jumpCooldown<=0){player.jumpTimer=.52;player.jumpCooldown=.82;sfx('jump')}
      return;
    }
    if(e.code==='KeyX'){useActive();return}
    if(e.code==='KeyC'){placeBomb();return}
    if(directionFromCode(e.code)) handleDirectionPress(e.code,e.repeat);
    keys[e.code]=true;
  });
  window.addEventListener('keyup',e=>{keys[e.code]=false});
  window.addEventListener('blur',()=>{if(!anyModalOpen()&&(state==='play'||state==='shop')&&!paused)togglePause(true)});
  canvas.addEventListener('pointerdown',handleCanvasClick);
  canvas.addEventListener('pointermove',handleMouseMove);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  newBtn.addEventListener('click',()=>{unlockSoundAssets();openNewRunModal()});
  pauseBtn.addEventListener('click',()=>{unlockSoundAssets();if(!anyModalOpen()&&!overlay)togglePause()});
  soundBtn.addEventListener('click',async()=>{soundOn=!soundOn;syncSoundButtons();if(soundOn){await unlockSoundAssets();applySoundVolume();sfx('rupee')}});
  volumeSlider.addEventListener('input',()=>{soundVolume=clamp(Number(volumeSlider.value||80)/100,0,1);applySoundVolume()});
  volumeSlider.addEventListener('change',async()=>{soundVolume=clamp(Number(volumeSlider.value||80)/100,0,1);applySoundVolume(); if(soundOn){await unlockSoundAssets(); sfx('rupee');}});
  scoresBtn.addEventListener('click',()=>{if(!anyModalOpen())openOverlay('scores')});
  helpBtn.addEventListener('click',()=>{if(!anyModalOpen())openOverlay('help')});

  randomSeedBtn.addEventListener('click',()=>{unlockSoundAssets();beginRunFromModal('')});
  openCustomSeedBtn.addEventListener('click',()=>{unlockSoundAssets();openCustomSeedModal()});
  useSeedBtn.addEventListener('click',()=>{unlockSoundAssets();beginRunFromModal(seedInput.value)});
  backToNewRunBtn.addEventListener('click',()=>{customSeedModal.hidden=true;newRunModal.hidden=false;seedError.textContent=''});
  cancelNewRunBtn.addEventListener('click',closeAllModals);
  cancelCustomSeedBtn.addEventListener('click',closeAllModals);
  newRunClose.addEventListener('click',closeAllModals);
  customSeedClose.addEventListener('click',closeAllModals);
  newRunModal.addEventListener('pointerdown',e=>{if(e.target===newRunModal)closeAllModals()});
  customSeedModal.addEventListener('pointerdown',e=>{if(e.target===customSeedModal)closeAllModals()});
  seedInput.addEventListener('input',()=>{
    let clean=seedInput.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
    if(clean.length>4) clean=`${clean.slice(0,4)}-${clean.slice(4)}`;
    seedInput.value=clean;
    seedError.textContent='';
  });

  function loop(now){
    const dt=Math.min(.033,(now-lastTime)/1000||0);lastTime=now;update(dt);render();requestAnimationFrame(loop);
  }
  preloadSoundAssets();
  applySoundVolume();
  syncPauseButtons();
  syncSoundButtons();
  setupMobileControls();
  requestAnimationFrame(loop);
})();
