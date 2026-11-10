(()=>{'use strict';
/* Rational Rift — offline 2D fantasy adventure. All problem answers are stored as exact reduced rationals. */
const $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t, TAU=Math.PI*2;
const screenIds=['titleScreen','mapScreen','gameScreen'];
const worldData=[
 {name:'The Numberlands',subject:'Understanding rational numbers',short:'Compare, order and represent',tag:'The awakening',description:'Begin among whispering meadows and ancient number stones. Learn to recognize, compare, order, and locate rational numbers.',boss:'Stone Sentinel',color:'#84dac9',floor:'#547d6b',dark:'#153d42',light:'#9dd0aa',accent:'#b2eeda',lore:'Every number has a place. Find yours, Guardian.',lessons:['Identify rational numbers','Compare positive and negative values','Equivalent fractions and decimals','Ordering and number lines','Stone Sentinel']},
 {name:'Addition Forest',subject:'Adding rational numbers',short:'Add with signs & fractions',tag:'The growing wilds',description:'Restore ancient bridges and calm the tangled forest by adding signed fractions, decimals, and mixed numbers.',boss:'Thorn Guardian',color:'#b7df83',floor:'#497d58',dark:'#183c37',light:'#90bc79',accent:'#e0fa9c',lore:'Even opposites can work together.',lessons:['Adding signed integers and decimals','Adding fractions','Mixed numbers and signed values','Adding in context','Thorn Guardian']},
 {name:'Subtraction Caverns',subject:'Subtracting rational numbers',short:'Subtract with signed numbers',tag:'Below the mountain',description:'Explore glowing crystalline caves where subtracting a negative can change the way forward.',boss:'Crystal Golem',color:'#bea5fa',floor:'#5b567c',dark:'#262946',light:'#888ac1',accent:'#dcc7ff',lore:'Sometimes taking away a debt sets you free.',lessons:['Subtracting integers','Subtracting signed decimals','Subtracting fractions','Multi-step subtraction','Crystal Golem']},
 {name:'Multiplication Marsh',subject:'Multiplying rational numbers',short:'Multiply signed rational values',tag:'The flooded ruins',description:'Wade through enchanted marshes and discover how signs and factors transform magical power.',boss:'Marsh Hydra',color:'#b0e3b4',floor:'#537c72',dark:'#18474a',light:'#96af77',accent:'#e0f3ab',lore:'A small factor can change a mighty force.',lessons:['Signs in multiplication','Fraction multiplication','Decimals and mixed numbers','Products and patterns','Marsh Hydra']},
 {name:'Division Depths',subject:'Dividing rational numbers',short:'Divide, reciprocals & signs',tag:'The sunken citadel',description:'Descend into a drowned civilization where dividing and understanding reciprocals opens hidden passages.',boss:'Abyss Serpent',color:'#7fdbea',floor:'#416e8b',dark:'#173d67',light:'#699cbe',accent:'#b0fff5',lore:'A kingdom can be shared without being diminished.',lessons:['Dividing signed numbers','Dividing decimals','Dividing fractions','Reciprocals and mixed numbers','Abyss Serpent']},
 {name:'Chaos Castle',subject:'Order of operations (BEDMAS)',short:'Mixed operations & BEDMAS',tag:'The final restoration',description:'Journey into the fractured castle and combine all your skills to restore the six crystals of Numeria.',boss:'The Rift King',color:'#eeaff2',floor:'#675477',dark:'#302345',light:'#a77ca7',accent:'#ffd0a2',lore:'Order brings harmony to chaos.',lessons:['BEDMAS with signed values','Brackets and fractions','Multiplication before addition','Mixed rational-number expressions','The Rift King']}
];
const STORE='rational-rift-save-v1';
const baseSave=()=>({version:1,stars:Array(30).fill(0),coins:0,crystals:[],maxHealth:5,attackTier:0,magicTier:0,totalCorrect:0,totalWrong:0,levelsPlayed:0,treasures:0,settings:{sound:true,music:false,particles:true},achievements:[]});
let save=baseSave();try{let raw=localStorage.getItem(STORE);if(raw){const old=JSON.parse(raw);save={...baseSave(),...old,settings:{...baseSave().settings,...old.settings}};if(!Array.isArray(save.stars)||save.stars.length!==30)save.stars=Array(30).fill(0);}}catch(e){console.warn('Save unavailable',e)}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(save))}catch(e){console.warn('Progress could not be saved',e)}}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){let t=a%b;a=b;b=t}return a||1}
function R(n,d=1){if(!Number.isFinite(n)||!Number.isFinite(d)||!d)throw Error('Invalid rational');n=Math.round(n);d=Math.round(d);if(d<0){n=-n;d=-d}let g=gcd(n,d);return {n:n/g,d:d/g}}
const add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>R(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>R(a.n*b.n,a.d*b.d),div=(a,b)=>R(a.n*b.d,a.d*b.n),eq=(a,b)=>!!a&&!!b&&a.n===b.n&&a.d===b.d,cmp=(a,b)=>a.n*b.d-b.n*a.d;
function fromDecimal(s){s=String(s).replace(/\u2212/g,'-').trim();if(!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s))return null;let neg=s[0]==='-'?-1:1;let clean=s.replace(/^[+-]/,'');let parts=clean.split('.'),d=Math.pow(10,(parts[1]||'').length);return R(neg*(parseInt(parts[0]||'0',10)*d+parseInt(parts[1]||'0',10)),d)}
function parseRational(raw){let s=String(raw).trim().replace(/[\u2212\u2013]/g,'-').replace(/,/g,'').replace(/\s*\/\s*/g,'/');let mixed=s.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);if(mixed){let whole=+mixed[1],n=+mixed[2],d=+mixed[3];if(d===0||n<0||d>100000)return null;return R((Math.abs(whole)*d+n)*(whole<0?-1:1),d)}let frac=s.match(/^([+-]?\d+)\/([+-]?\d+)$/);if(frac){if(+frac[2]===0||Math.abs(+frac[2])>100000)return null;return R(+frac[1],+frac[2])}return fromDecimal(s)}
function fmt(r,style='fraction'){if(style==='decimal'&&[1,2,4,5,8,10,20,25,40,50,100].some(d=>d%r.d===0))return String(Number((r.n/r.d).toFixed(4)));if(style==='mixed'&&Math.abs(r.n)>r.d&&r.d!==1){let a=Math.trunc(r.n/r.d),b=Math.abs(r.n)%r.d;return `${a} ${b}/${r.d}`}return r.d===1?String(r.n):`${r.n}/${r.d}`}
function pretty(s){return String(s).replace(/(^|[^\w])-([\d])/g,'$1−$2').replace(/ \* /g,' × ').replace(/ : /g,' ÷ ')}
const randint=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1));const pick=arr=>arr[randint(0,arr.length-1)];const shuffle=arr=>{let a=[...arr];for(let i=a.length-1;i>0;i--){let j=randint(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
function randomRat(difficulty=0,zeroOK=true,style='normal'){
 let dens=difficulty<1?[1,2,4,5]:difficulty<3?[1,2,3,4,5,10]:[1,2,3,4,5,6,8,10];
 let den=pick(dens),lim=difficulty<1?4:difficulty<3?7:11,n=randint(-lim*den,lim*den);
 if(style==='simple')n=randint(-7,7)*den+randint(-2,2);
 if(!zeroOK&&n===0)n=pick([-1,1])*randint(1,den*2);
 return R(n,den)
}
function uniqueOptions(answer,variants){let opts=[answer],keys=new Set([`${answer.n}/${answer.d}`]);for(let r of variants){let k=`${r.n}/${r.d}`;if(!keys.has(k)){keys.add(k);opts.push(r)}if(opts.length>=4)break}while(opts.length<4){let shift=R(randint(-6,6)||2,pick([1,2,3,4]));let candidate=add(answer,shift),k=`${candidate.n}/${candidate.d}`;if(!keys.has(k)){keys.add(k);opts.push(candidate)}}return shuffle(opts).map((r,i)=>({text:fmt(r,pick(['fraction','fraction','decimal'])),value:r}))}
function valueQuestion(w,difficulty,kind){
 const ops=['','+','−','×','÷'];let a,b,answer,expression,step,hint;
 for(let t=0;t<30;t++){
   a=randomRat(difficulty,true);b=randomRat(difficulty,w===4?false:true);
   if(w===1)answer=add(a,b);if(w===2)answer=sub(a,b);if(w===3)answer=mul(a,b);if(w===4)answer=div(a,b);
   if(Math.abs(answer.n/answer.d)<18&&Math.abs(answer.n)<1500)break;
 }
 const av=fmt(a,pick(['fraction','fraction','decimal','mixed'])),bv=fmt(b,pick(['fraction','fraction','decimal']));
 expression=`${pretty(av)} ${ops[w]} ${pretty(bv)}`;
 hint=w===1?'When adding unlike signs, compare their absolute values. For fractions, use a common denominator.':w===2?'Subtracting a number is the same as adding its opposite. Use a common denominator for fractions.':w===3?'Multiply the numerators and denominators, then simplify. A negative times a negative is positive.':'To divide fractions, multiply by the reciprocal of the divisor. Follow the sign rules.';
 if(w===1||w===2){
   let den=a.d*b.d/gcd(a.d,b.d),an=a.n*(den/a.d),bn=b.n*(den/b.d),result=w===1?an+bn:an-bn;
   step=`Use the common denominator ${den}. Rewrite as ${an}/${den} ${w===1?'+':'−'} (${bn}/${den}). Combine the numerators: ${result}/${den} = ${pretty(fmt(answer))}.`;
  }else if(w===3){
   step=`Multiply the numerators: ${a.n} × ${b.n} = ${a.n*b.n}. Multiply the denominators: ${a.d} × ${b.d} = ${a.d*b.d}. Simplify ${a.n*b.n}/${a.d*b.d} to ${pretty(fmt(answer))}.`;
  }else{
   const inverse=R(b.d,b.n);
   step=`Keep the first number, then multiply by the reciprocal of ${pretty(fmt(b))}, which is ${pretty(fmt(inverse))}. So ${pretty(fmt(a))} × ${pretty(fmt(inverse))} = ${pretty(fmt(answer))}.`;
  }
 return {a,b,answer,expression,hint,explain:step,context:pick(['A glowing rune blocks your path.','The crystal mechanism needs an exact value.','A guardian has carved a calculation into the stone.','Restore the correct magical energy.'])};
}
function makeQuestion(world,level=0,sequence=0){
 const diff=Math.min(4,Math.floor(level/2)+(level%5===4?2:0)),kind=(sequence+randint(0,3)+level)%5;
 if(world===0){
  if(kind===0){let a=randomRat(diff,true),b=randomRat(diff,true);while(eq(a,b))b=randomRat(diff,true);let correct=cmp(a,b)>0?'>':'<',options=shuffle(['<','>','=']);return {type:'choice',prompt:`Which symbol makes ${pretty(fmt(a))} ___ ${pretty(fmt(b))} true?`,context:'Compare both values on the number line.',options,answer:options.indexOf(correct),hint:'Any negative number is less than any positive number. Among negative numbers, the one farther left is smaller.',explain:`${pretty(fmt(a))} ${correct} ${pretty(fmt(b))} because ${pretty(fmt(a))} is ${correct==='>'?'greater':'less'} than ${pretty(fmt(b))}.`}}
  if(kind===1){
   let den=pick([2,4,5,10]),n=randint(-13,13)||3;while(n%den===0)n=randint(-13,13)||3;
   let a=R(n,den),opts=uniqueOptions(a,[add(a,R(1,den)),sub(a,R(1,den)),mul(a,R(-1)),add(a,R(1))]);
   return {type:'choice',prompt:`Which decimal is equivalent to ${pretty(fmt(a))}?`,context:'Equivalent fractions and decimals name the same point.',options:opts.map(o=>pretty(fmt(o.value,'decimal'))),answer:opts.findIndex(o=>eq(o.value,a)),hint:'Divide the numerator by the denominator to convert a fraction to a decimal. A negative fraction gives a negative decimal.',explain:`${pretty(fmt(a))} = ${pretty(fmt(a,'decimal'))}. Dividing ${a.n} by ${a.d} gives the equivalent decimal.`}
  }
  if(kind===2){let den=pick([1,2,4]),n=randint(-10,10),target=R(n,den);while(target.n/target.d < -3||target.n/target.d>3)target=R(randint(-12,12),4);return {type:'line',prompt:`Mark ${pretty(fmt(target))} on the number line.`,context:'Select the correct location, then confirm.',target,min:-3,max:3,step:.25,hint:'Start at zero. Negative numbers are to the left, positive numbers to the right. Each small step represents one quarter.',explain:`${pretty(fmt(target))} belongs ${target.n<0?'to the left of':target.n>0?'to the right of':'at'} zero, at position ${pretty(fmt(target,'decimal'))}.`}}
  if(kind===3){let values=[];while(values.length<3){let r=R(randint(-15,15),pick([2,4,5,10]));if(!values.some(x=>eq(x,r)))values.push(r)}let decorated=values.map((r,i)=>({id:i,value:r,text:pretty(fmt(r,pick(['fraction','decimal','mixed'])))}));return {type:'order',prompt:'Choose these values from least to greatest.',context:'Tap one value at a time to build the correct order.',items:shuffle(decorated),answer:values.map((_,i)=>i).sort((i,j)=>cmp(values[i],values[j])),hint:'Negative values come before zero and positives. For negative values, the greater absolute value is actually smaller.',explain:`Least to greatest: ${values.slice().sort(cmp).map(v=>pretty(fmt(v))).join(' < ')}.`}}
  let den=pick([2,4,5,10]),target=R(randint(-17,17)||3,den),dec=fmt(target,'decimal');return {type:'entry',prompt:`Write ${pretty(dec)} as a fraction in simplest form.`,context:'Enter a fraction such as -3/4. Equivalent answers are accepted.',answer:target,hint:'Put the decimal over 10, 100, or 1000 depending on its decimal places, then simplify.',explain:`${pretty(dec)} = ${pretty(fmt(target))}. Divide numerator and denominator by their greatest common factor.`};
 }
 if(world===5){
  let a=randomRat(diff),b=randomRat(diff,false),c=randomRat(Math.max(0,diff-1),false);
  const op=pick([0,1,2,3,4]);let expr,answer,rule;
  if(op===0){expr=`${pretty(fmt(a))} + ${pretty(fmt(b))} × ${pretty(fmt(c))}`;answer=add(a,mul(b,c));rule='Multiply before adding.'}
  else if(op===1){expr=`(${pretty(fmt(a))} + ${pretty(fmt(b))}) × ${pretty(fmt(c))}`;answer=mul(add(a,b),c);rule='Evaluate the brackets first, then multiply.'}
  else if(op===2){expr=`${pretty(fmt(a))} − ${pretty(fmt(b))} ÷ ${pretty(fmt(c))}`;answer=sub(a,div(b,c));rule='Divide before subtracting.'}
  else if(op===3){expr=`(${pretty(fmt(a))} − ${pretty(fmt(b))}) ÷ ${pretty(fmt(c))}`;answer=div(sub(a,b),c);rule='Evaluate the brackets first, then divide.'}
  else {let base=randint(-4,4),power=pick([2,3]),square=R(Math.pow(base,power));expr=`(${base})${power===2?'²':'³'} + ${pretty(fmt(b))}`;answer=add(square,b);rule=`Evaluate the exponent first: (${base}) to the power of ${power} is ${square.n}. Then add.`}
  let core={prompt:`Evaluate: ${expr}`,context:'The Rift King has scrambled the order of the operations.',answer,hint:'BEDMAS: brackets, exponents, division and multiplication (left to right), then addition and subtraction (left to right).',explain:`${rule} ${expr} = ${pretty(fmt(answer))}.`};
  return kind%2===0?{...core,type:'entry'}:makeChoiceForValue(core);
 }
 const core=valueQuestion(world,diff,kind);
 if(kind===0||kind===3)return {type:'entry',prompt:`Calculate: ${core.expression}`,context:core.context,answer:core.answer,hint:core.hint,explain:core.explain};
 if(kind===1||kind===4)return makeChoiceForValue({prompt:`What is ${core.expression}?`,context:core.context,answer:core.answer,hint:core.hint,explain:core.explain});
 if(kind===2){
   // Locate a result on a quarter-unit number line when practical.
   let a=R(randint(-8,8),pick([1,2,4])),b=R(randint(-8,8),pick([1,2,4]));if(world===4&&b.n===0)b=R(1);let result=world===1?add(a,b):world===2?sub(a,b):world===3?mul(a,b):div(a,b);
   if(result.n/result.d>=-3&&result.n/result.d<=3&&4%result.d===0){let e=`${pretty(fmt(a))} ${['','+','−','×','÷'][world]} ${pretty(fmt(b))}`;return {type:'line',prompt:`Calculate ${e}, then mark the result on the number line.`,context:'Use the number line to represent your answer.',target:result,min:-3,max:3,step:.25,hint:core.hint,explain:`${e} = ${pretty(fmt(result))}. The marker goes at ${pretty(fmt(result,'decimal'))}.`}}
   return makeChoiceForValue({prompt:`What is ${core.expression}?`,context:core.context,answer:core.answer,hint:core.hint,explain:core.explain});
 }
 return makeChoiceForValue({prompt:`What is ${core.expression}?`,context:core.context,answer:core.answer,hint:core.hint,explain:core.explain});
}
function makeChoiceForValue(core){const a=core.answer,choices=uniqueOptions(a,[add(a,R(1)),sub(a,R(1)),mul(a,R(-1)),add(a,R(1,2)),sub(a,R(1,2))]);return {...core,type:'choice',options:choices.map(o=>pretty(o.text)),answer:choices.findIndex(o=>eq(o.value,a))}}
const canvas=$('worldCanvas'),ctx=canvas.getContext('2d',{alpha:false});let viewW=1200,viewH=760,dpr=1,currentScreen='titleScreen',selectedWorld=0,game=null,activeQuestion=null,practice=null,lastTime=0,frameCount=0,keys={},touchMove={x:0,y:0},stickPointer=null,audioCtx=null,lastMusic=0;
function audioInit(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function tone(freq,dur=.15,type='sine',vol=.1,delay=0){if(!save.settings.sound||!audioCtx)return;try{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),start=audioCtx.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol),start+.014);gain.gain.exponentialRampToValueAtTime(.0001,start+dur);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(start);osc.stop(start+dur+.03)}catch(e){}}
function sfx(name){if(!audioCtx)return;switch(name){case 'attack':tone(210,.085,'triangle',.045);tone(390,.12,'sawtooth',.018,.045);break;case 'hit':tone(105,.18,'sawtooth',.065);break;case 'collect':tone(500,.09,'sine',.07);tone(730,.17,'triangle',.07,.09);break;case 'correct':tone(523,.13,'sine',.08);tone(659,.17,'sine',.09,.12);tone(784,.25,'sine',.07,.25);break;case 'wrong':tone(245,.14,'triangle',.06);tone(196,.24,'triangle',.065,.12);break;case 'level':tone(392,.21,'sine',.08);tone(523,.2,'sine',.09,.22);tone(659,.23,'sine',.09,.4);tone(784,.41,'sine',.1,.62);break;case 'open':tone(330,.09,'triangle',.055);tone(440,.15,'triangle',.045,.08);break;case 'cast':tone(560,.18,'sine',.065);tone(840,.24,'triangle',.045,.07);break;case 'hurt':tone(128,.28,'sawtooth',.065);break;}}
function musicTick(now){if(!audioCtx||!save.settings.music||currentScreen!=='gameScreen'||!game||game.blocked)return;if(now-lastMusic<3100)return;lastMusic=now;let root=[196,220,174.61,164.81,146.83,185][game.world],notes=[0,7,12,14,7,4,12,7];notes.forEach((n,i)=>tone(root*Math.pow(2,n/12),.40,'sine',.015,i*.28));}
function showScreen(id){currentScreen=id;for(let s of screenIds)$(s).classList.toggle('hidden',s!==id);if(id==='gameScreen')resizeCanvas();}
function modalOpen(markup,wide=false){$('modal').innerHTML=markup;$('modal').classList.toggle('wide',wide);$('modal').classList.remove('puzzle-modal');$('modal').scrollTop=0;$('overlay').classList.remove('hidden');if(game)game.blocked=true}
function modalClose(){$('overlay').classList.add('hidden');$('modal').innerHTML='';activeQuestion=null;if(game)game.blocked=false}
function closeButton(){return '<button class="close" data-close aria-label="Close">×</button>'}
function wireClose(){let b=$('modal').querySelector('[data-close]');if(b)b.onclick=modalClose}
function roundCoins(n){save.coins=Math.max(0,save.coins+n);persist();refreshHud()}
function starStr(n){return '★'.repeat(n)+'☆'.repeat(3-n)}
function unlocked(idx){return idx===0||save.stars[idx-1]>0}
function regionOpen(w){return w===0||save.stars[w*5-1]>0}
function totalStars(){return save.stars.reduce((a,b)=>a+b,0)}
function showTitle(){modalClose();showScreen('titleScreen');$('btnContinue').textContent=save.stars.some(x=>x>0)?'✦   Continue Adventure':'✦   Begin Adventure';$('titleProgress').textContent=save.stars.some(Boolean)?`${save.stars.filter(Boolean).length} / 30 levels complete · ${totalStars()} stars earned`:'30 levels · six worlds · no time limits';}
function showMap(w=selectedWorld){modalClose();selectedWorld=clamp(w,0,5);renderMap();showScreen('mapScreen')}
function renderMap(){
 $('mapCrystals').textContent=save.crystals.length;$('mapGold').textContent=save.coins;
 $('worldGrid').innerHTML=worldData.map((world,i)=>{let open=regionOpen(i),stars=save.stars.slice(i*5,i*5+5).reduce((a,b)=>a+b,0);return `<button class="world-card ${i===selectedWorld?'selected':''} ${open?'':'locked'}" data-world="${i}"><div class="world-art" style="background-image:url('assets/world-${i+1}.svg')"></div><div class="world-art-shade"></div><div class="world-card-inner"><div class="world-index">WORLD ${i+1} ${open?'':'· LOCKED'}</div><div class="world-title">${world.name}</div><div class="world-tag">${world.short}</div></div><div class="world-status">${open?`<span class="world-star">★ ${stars}/15</span>`:'🔒'}</div></button>`}).join('');
 $('worldGrid').querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{selectedWorld=+b.dataset.world;renderMap();});
 const w=worldData[selectedWorld],open=regionOpen(selectedWorld);
 $('selWorldName').textContent=w.name;$('selWorldDesc').textContent=w.description;
 $('levelNodes').innerHTML=w.lessons.map((l,i)=>{let id=selectedWorld*5+i,can=unlocked(id),isBoss=i===4;return `<button class="level-node ${isBoss?'boss-node':''}" data-level="${id}" ${can?'':'disabled'} title="${l}"><span class="level-number">${isBoss?'♛':i+1}</span><span>${isBoss?'BOSS':`LEVEL ${i+1}`}</span><span class="level-star">${starStr(save.stars[id])}</span></button>`}).join('');
 $('levelNodes').querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>startLevel(+b.dataset.level));
 $('unlockHint').textContent=open?`${w.lessons.filter((x,i)=>save.stars[selectedWorld*5+i]>0).length}/5 levels complete · ${w.subject}`:'Complete the previous world to unlock this region.';
 $('btnPractice').disabled=!open;
 $('gearSummary').innerHTML=`♥ Health: ${save.maxHealth} &nbsp; ⚔ Blade: ${save.attackTier+1}<br>✦ Magic: ${save.magicTier+1} &nbsp; ★ Stars earned: ${totalStars()}<br>⚡ Abilities: ${Math.min(4,save.crystals.length)} of 4`;
}
function showHow(){modalOpen(`<div class="modal-top"><div><div class="overline">FIELD GUIDE</div><h2>How to Play</h2></div>${closeButton()}</div><p>You are Numeria's last Rift Guardian. Explore six regions, solve mathematical runes, recover crystal shards and defeat the guardians of the Rift. There are <b>no timers</b> on math problems.</p><div class="help-grid"><div><b>Movement</b><span class="help-key">W A S D</span> or arrow keys. On mobile, use the virtual joystick.</div><div><b>Attack</b>Click the game world or press <span class="help-key">Space</span>. Touch the sword button on mobile. Enemies are optional encounters.</div><div><b>Interact</b>Approach a glowing rune, chest or portal, then press <span class="help-key">F</span>. On mobile, touch ✧.</div><div><b>Magic / powers</b><span class="help-key">E</span> uses your selected power. Choose unlocked powers with <span class="help-key">1–4</span>.</div><div><b>Math puzzles</b>Choose answers, type fractions, arrange numbers, or tap the number line directly. Use Undo and hints whenever you need them.</div><div><b>Saving & progress</b>Finish levels to unlock the next. Earn up to 3 stars. Your progress is saved locally on this browser.</div></div><p><b>Important:</b> Coins can buy upgrades on the world map. Enemies can be fought, but the objective is to restore the runes and reach the portal. If you lose all health, you respawn with full health and keep your puzzle progress.</p><div class="modal-actions"><button class="btn gold" id="helpOkay">Let's Adventure</button></div>`,true);wireClose();$('helpOkay').onclick=modalClose}
const journalEntries=[
 {title:'Understanding Rational Numbers',rule:'A rational number can be written as a fraction a/b, where a and b are integers and b is not zero.',example:'−1.5 = −3/2     and     0.75 = 3/4',tips:['Fractions, terminating decimals, repeating decimals, integers, and mixed numbers are rational.','Place negative numbers to the left of zero on a number line.','For negative numbers, −4 is less than −2.','Equivalent forms represent exactly the same number.'],aside:'Counterexamples: √2 and π cannot be written as a ratio of two integers. These are non-rational (irrational) numbers. You will not be quizzed on them in World 1.'},
 {title:'Adding Rational Numbers',rule:'Add values using their signs. For fractions, find a common denominator first.',example:'−3/4 + 1/2 = −3/4 + 2/4 = −1/4',tips:['Same signs: add absolute values and keep the sign.','Different signs: subtract the smaller absolute value from the larger, then use the sign of the larger.','For unlike denominators, rewrite the fractions with a common denominator.'],aside:'Number-line strategy: adding a negative moves left; adding a positive moves right.'},
 {title:'Subtracting Rational Numbers',rule:'Subtracting is equivalent to adding the opposite: a − b = a + (−b).',example:'−1/2 − (−3/4) = −2/4 + 3/4 = 1/4',tips:['Change subtraction into addition of the opposite.','Keep track of the sign outside parentheses.','Use common denominators when subtracting fractions.'],aside:'Subtracting a negative may result in an increase.'},
 {title:'Multiplying Rational Numbers',rule:'Multiply the numerators and denominators, simplify, then apply the sign rule.',example:'(−2/3) × (−3/4) = 6/12 = 1/2',tips:['Two factors with the same sign produce a positive product.','Different signs produce a negative product.','Cross-cancellation can help simplify before multiplying.'],aside:'When a positive fraction less than one multiplies a number, its magnitude decreases.'},
 {title:'Dividing Rational Numbers',rule:'To divide by a nonzero fraction, multiply by its reciprocal.',example:'(−3/4) ÷ (1/2) = (−3/4) × (2/1) = −3/2',tips:['Flip the second fraction and multiply.','You cannot divide by zero.','Use the same sign rules as multiplication.','Convert mixed numbers into improper fractions first.'],aside:'A reciprocal of 2/3 is 3/2; the reciprocal of −5 is −1/5.'},
 {title:'Order of Operations — BEDMAS',rule:'Evaluate brackets first; then exponents; then multiplication/division left to right; finally addition/subtraction left to right.',example:'3/2 + (−2) × 1/4 = 3/2 − 1/2 = 1',tips:['Multiplication and division have equal priority: work left to right.','Addition and subtraction also share priority.','Keep the parentheses around negative numbers until their operation is completed.'],aside:'A negative sign outside a bracket changes the signs when it is distributed.'}
];
function showJournal(tab=0){let before=$('overlay').classList.contains('hidden');let j=journalEntries[tab];modalOpen(`<div class="modal-top"><div><div class="overline">GUARDIAN'S REFERENCE</div><h2>Math Journal</h2></div>${closeButton()}</div><div class="journal-tabs">${journalEntries.map((x,i)=>`<button class="journal-tab ${i===tab?'active':''}" data-tab="${i}">${i+1}. ${['Rational Values','Addition','Subtraction','Multiplication','Division','BEDMAS'][i]}</button>`).join('')}</div><div class="journal-paper"><div class="overline">CHAPTER ${tab+1}</div><h3>${j.title}</h3><p>${j.rule}</p><div class="journal-example">${j.example}</div><ul>${j.tips.map(x=>`<li>${x}</li>`).join('')}</ul><p class="muted">${j.aside}</p></div><div class="modal-actions"><button class="btn gold" data-close2>Return to Adventure</button></div>`,true);wireClose();$('modal').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showJournal(+b.dataset.tab));$('modal').querySelector('[data-close2]').onclick=()=>{modalClose();if(currentScreen==='mapScreen')renderMap()}}
function showSettings(){modalOpen(`<div class="modal-top"><div><div class="overline">YOUR ADVENTURE</div><h2>Settings</h2></div>${closeButton()}</div><div class="setting-row">Sound effects <button class="toggle ${save.settings.sound?'on':''}" id="toggleSound">${save.settings.sound?'On':'Off'}</button></div><div class="setting-row">Ambient music <button class="toggle ${save.settings.music?'on':''}" id="toggleMusic">${save.settings.music?'On':'Off'}</button></div><div class="setting-row">Visual particles <button class="toggle ${save.settings.particles?'on':''}" id="toggleParticles">${save.settings.particles?'On':'Off'}</button></div><p class="tiny-note">Original synthesized audio plays directly in your browser. Your settings and progress are stored only on this device.</p><h3>Save Data</h3><p>${save.stars.filter(Boolean).length} of 30 levels completed · ${totalStars()} total stars · ${save.totalCorrect} correct math answers</p><div class="modal-actions"><button class="btn subtle" id="resetProgress">Reset Adventure</button><button class="btn gold" data-close2>Done</button></div>`);wireClose();$('modal').querySelector('[data-close2]').onclick=modalClose;[['Sound','sound'],['Music','music'],['Particles','particles']].forEach(([s,k])=>{$('toggle'+s).onclick=()=>{save.settings[k]=!save.settings[k];persist();audioInit();showSettings()}});$('resetProgress').onclick=()=>{modalOpen(`<div class="overline">CONFIRM RESET</div><h2>Erase Adventure Progress?</h2><p>This permanently resets completed levels, stars, coins, unlocked abilities, and upgrades on this browser.</p><div class="modal-actions"><button class="btn subtle" id="cancelReset">Keep My Progress</button><button class="btn gold" id="confirmReset">Yes, Reset</button></div>`);$('cancelReset').onclick=showSettings;$('confirmReset').onclick=()=>{save=baseSave();persist();game=null;showTitle();sfx('open')}}}
function showShop(){modalOpen(`<div class="modal-top"><div><div class="overline">GUARDIAN'S FORGE</div><h2>Upgrades</h2></div>${closeButton()}</div><p>Use coins from exploration, enemies, and puzzles to improve your equipment. You have <b style="color:var(--gold)">◈ ${save.coins}</b> coins.</p>${[
 ['maxHealth','Heart Container','Increase maximum health by one heart.',[30,60,100],save.maxHealth-5],
 ['attackTier','Blade Sharpening','Deal stronger damage to hostile creatures.',[35,70],save.attackTier],
 ['magicTier','Arcane Focus','Your magic charges faster and hits harder.',[40,80],save.magicTier]
 ].map(([key,name,desc,costs,tier])=>{let done=tier>=costs.length,cost=costs[tier];return `<div class="shop-item"><div class="item-detail"><b>${name} · ${tier}/${costs.length}</b><span>${desc}</span></div><button class="btn ${done?'subtle':'gold'}" data-buy="${key}" ${done||save.coins<cost?'disabled':''}>${done?'MAXED':`◈ ${cost}`}</button></div>`}).join('')}<div class="modal-actions"><button class="btn blue" data-close2>Back to Map</button></div>`);wireClose();$('modal').querySelector('[data-close2]').onclick=()=>{modalClose();renderMap()};$('modal').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{let k=b.dataset.buy,i=k==='maxHealth'?save.maxHealth-5:save[k],cost=({maxHealth:[30,60,100],attackTier:[35,70],magicTier:[40,80]})[k][i];if(cost===undefined||save.coins<cost)return;save.coins-=cost;save[k]++;persist();audioInit();sfx('collect');renderMap();showShop()})}
function beginPractice(w){if(!regionOpen(w))return;practice={world:w,count:0,correct:0,wrong:0,limit:5};showScreen('mapScreen');nextPractice()}
function nextPractice(){if(!practice)return;if(practice.count>=practice.limit){let correct=practice.correct,wrong=practice.wrong;if(correct>=3)roundCoins(correct*2);let won=practice;practice=null;modalOpen(`<div class="overline">FREE PRACTICE COMPLETE</div><h2>Nicely Done, Guardian!</h2><p>You practiced ${worldData[won.world].subject.toLowerCase()} without any time pressure.</p><div class="outcome-grid"><div><b>${correct}</b><span>Correct first tries</span></div><div><b>${wrong}</b><span>Retries</span></div><div><b>◈ ${correct>=3?correct*2:0}</b><span>Coins earned</span></div></div><div class="modal-actions"><button class="btn gold" id="practiceAgain">Practice Again</button><button class="btn subtle" id="practiceExit">Return to Map</button></div>`);$('practiceAgain').onclick=()=>beginPractice(won.world);$('practiceExit').onclick=()=>showMap(won.world);return;}let p=makeQuestion(practice.world,practice.count,practice.count+randint(0,10));startQuestion(p,{practice:true});}
function startQuestion(problem,context){audioInit();sfx('open');activeQuestion={problem,context,errors:0,hintShown:false,selected:[],lineValue:0,entryDraft:'',choiceMistakes:[],lastOrderCheck:null,lastLineCheck:null,finished:false};renderQuestion()}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function syncOrderUI(){
 const q=activeQuestion,p=q?.problem;if(!q||p.type!=='order')return;
 const slots=$('orderedValues');if(!slots)return;
 slots.innerHTML=Array.from({length:p.items.length},(_,i)=>{
  const id=q.selected[i],found=p.items.find(x=>x.id===id);
  return found?`<button class="order-slot filled" data-remove="${i}" title="Remove ${escapeHtml(found.text)} from your order">${escapeHtml(found.text)}</button>`:`<span class="order-slot" aria-hidden="true">${i+1}</span>`;
 }).join('');
 $('orderCount').textContent=`${q.selected.length} of ${p.items.length}`;
 $('orderDots').innerHTML=Array.from({length:p.items.length},(_,i)=>`<span class="order-dot ${i<q.selected.length?'done':''}"></span>`).join('');
 $('undoOrder').disabled=!q.selected.length;$('clearOrder').disabled=!q.selected.length;
 const unchanged=q.selected.length===p.items.length&&q.lastOrderCheck===q.selected.join(',');$('checkOrder').disabled=q.selected.length!==p.items.length||unchanged;$('checkOrder').textContent=unchanged?'Adjust to retry':q.selected.length===p.items.length?'Check Order':`Choose ${p.items.length-q.selected.length} more`;
 $('modal').querySelectorAll('[data-order]').forEach(b=>{b.disabled=q.selected.includes(+b.dataset.order)});
 slots.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{q.selected.splice(+b.dataset.remove,1);syncOrderUI()});
}
function renderQuestion(message='',good=false){
 if(!activeQuestion)return;
 const q=activeQuestion,p=q.problem,world=q.context.practice?practice.world:game.world;
 const typeText={choice:'CHOOSE AN ANSWER',entry:'SOLVE THE PROBLEM',line:'LOCATE THE VALUE',order:'ARRANGE THE VALUES'}[p.type];
 const heading=q.context.practice?`Skill practice · ${practice.count+1} of ${practice.limit}`:q.context.boss?'Break the Rift Seal':'Restore the Rune';
 let markup=`<div class="puzzle-shell"><div class="puzzle-head"><div class="puzzle-crest" aria-hidden="true">✦</div><div class="puzzle-heading"><div class="overline">${q.context.practice?'PRACTICE':q.context.boss?'BOSS ENCOUNTER':'ANCIENT RUNE'} &nbsp;·&nbsp; WORLD ${world+1}</div><h2>${heading}</h2></div>${closeButton()}</div><div class="puzzle-body"><div class="puzzle-instruction">${escapeHtml(p.context)}</div><div class="puzzle-question">${p.prompt}</div>`;
 if(p.type==='choice'){
  markup+=`<div class="puzzle-micro">${typeText}</div><div class="puzzle-options">${p.options.map((x,i)=>`<button class="puzzle-option ${q.choiceMistakes.includes(i)?'option-wrong':''}" data-choice="${i}" ${q.choiceMistakes.includes(i)?'disabled':''}><span class="option-index">${i+1}</span>${escapeHtml(pretty(x))}</button>`).join('')}</div><p class="puzzle-subnote">Select the best answer or press keys 1–4. There is no time limit.</p>`;
 }
 if(p.type==='entry'){
  markup+=`<label class="puzzle-micro" for="puzzleAnswer">${typeText}</label><div class="puzzle-entry-row"><input class="puzzle-input" id="puzzleAnswer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" placeholder="e.g. −3/4 or −0.75" value="${escapeHtml(q.entryDraft||'')}"><button class="btn gold" id="checkEntry">Check Answer</button></div><div class="puzzle-subnote">Fractions, decimals and mixed numbers are accepted. Use / for fractions.</div>`;
 }
 if(p.type==='line'){
  const val=clamp(q.lineValue,p.min,p.max),pct=((val-p.min)/(p.max-p.min))*100;
  markup+=`<div class="line-number-display"><span class="puzzle-micro">${typeText}</span><span>Selected: <strong id="lineValue">${pretty(String(val))}</strong></span></div><div class="line-ruler" id="lineRuler" role="slider" tabindex="0" aria-label="Number line position" aria-valuemin="${p.min}" aria-valuemax="${p.max}" aria-valuenow="${val}">${Array.from({length:Math.round((p.max-p.min)/p.step)+1},(_,i)=>{let v=p.min+i*p.step,major=Math.abs(v-Math.round(v))<.00001;return `<span class="line-tick ${major?'major':''}" style="left:${(v-p.min)/(p.max-p.min)*100}%">${major?`<label>${v}</label>`:''}</span>`}).join('')}<span class="line-marker" id="lineMarker" style="left:${pct}%"></span></div><div class="line-slider-controls"><button class="btn ghost" id="lineMinus" aria-label="Move left one step">− ¼</button><input class="line-range" aria-label="Choose position on number line" id="lineSlider" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}"><button class="btn ghost" id="linePlus" aria-label="Move right one step">+ ¼</button></div><div class="line-action"><button class="btn gold" id="checkLine">Confirm Position</button></div><div class="puzzle-subnote">Tap the number line, drag the slider, or use the quarter-step buttons.</div>`;
 }
 if(p.type==='order'){
  markup+=`<div class="order-status"><div class="order-stage"><span id="orderCount">0 of ${p.items.length}</span><div class="order-dots" id="orderDots"></div></div><div class="order-toolbar-actions"><button class="btn ghost compact" id="undoOrder">↶ Undo</button><button class="btn ghost compact" id="clearOrder">Clear</button></div></div><div class="puzzle-micro">YOUR ORDER · LEAST TO GREATEST</div><div class="order-selected" id="orderedValues"></div><div class="puzzle-micro">CHOOSE FROM</div><div class="order-items">${p.items.map(x=>`<button class="order-item" data-order="${x.id}">${escapeHtml(x.text)}</button>`).join('')}</div><div class="order-action-row"><button class="btn gold check-order" id="checkOrder" disabled>Check Order</button></div><p class="puzzle-subnote">Tap each value in order. Tap a chosen value to remove it.</p>`;
 }
 if(message)markup+=`<div class="puzzle-feedback ${good?'good':''}" role="status">${message}</div>`;
 if(q.hintShown)markup+=`<div class="hint-box" role="note"><strong>Guardian's hint:</strong> ${p.hint}</div>`;
 markup+=`<div class="puzzle-footer"><div class="puzzle-secondary"><button id="showHint" class="btn ghost">${q.hintShown?'↻ Show Hint':'✧ Need a hint?'}</button>${q.errors>=2?'<button id="revealAnswer" class="btn subtle">See worked solution</button>':''}</div><span class="puzzle-micro">TAKE YOUR TIME ✦</span></div></div></div>`;
 modalOpen(markup);$('modal').classList.add('puzzle-modal');wireClose();
 $('showHint').onclick=()=>{if(q.hintShown)return;q.hintShown=true;const div=document.createElement('div');div.className='hint-box';div.setAttribute('role','note');div.innerHTML=`<strong>Guardian's hint:</strong> ${p.hint}`;$('modal').querySelector('.puzzle-footer').before(div);$('showHint').textContent='✧ Hint revealed';$('showHint').disabled=true};
 if(q.hintShown){$('showHint').textContent='✧ Hint revealed';$('showHint').disabled=true}
 if(q.errors>=2)$('revealAnswer').onclick=()=>finishQuestion(false,true);
 if(p.type==='choice')$('modal').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>checkAnswer(+b.dataset.choice));
 if(p.type==='entry'){
  const entry=$('puzzleAnswer');entry.oninput=()=>{q.entryDraft=entry.value};
  $('checkEntry').onclick=()=>{let text=entry.value.trim();q.entryDraft=text;if(!text){entry.focus();return}let val=parseRational(text);if(!val){let fb=$('modal').querySelector('.puzzle-feedback');if(!fb){fb=document.createElement('div');fb.className='puzzle-feedback';$('modal').querySelector('.puzzle-footer').before(fb)}fb.textContent='Please enter a valid fraction, decimal, or mixed number.';return}checkAnswer(val)};
  entry.onkeydown=e=>{if(e.key==='Enter')$('checkEntry').click()};setTimeout(()=>{if(document.activeElement===document.body&&$('puzzleAnswer'))$('puzzleAnswer').focus()},20);
 }
 if(p.type==='line'){
  const slider=$('lineSlider');
  function setLine(n){let steps=Math.round((clamp(+n,p.min,p.max)-p.min)/p.step);let v=Number((p.min+steps*p.step).toFixed(6));q.lineValue=v;slider.value=String(v);$('lineValue').textContent=pretty(String(v));$('lineMarker').style.left=(v-p.min)/(p.max-p.min)*100+'%';$('lineRuler').setAttribute('aria-valuenow',String(v));$('checkLine').disabled=q.lastLineCheck===v}
  slider.oninput=()=>setLine(slider.value);$('lineMinus').onclick=()=>setLine(q.lineValue-p.step);$('linePlus').onclick=()=>setLine(q.lineValue+p.step);
  const ruler=$('lineRuler');ruler.onclick=e=>{const b=ruler.getBoundingClientRect();setLine(p.min+(clamp((e.clientX-b.left)/b.width,0,1))*(p.max-p.min))};
  ruler.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setLine(q.lineValue+(e.key==='ArrowLeft'?-p.step:p.step))}};
  $('checkLine').disabled=q.lastLineCheck===q.lineValue;$('checkLine').onclick=()=>checkAnswer(R(Math.round(q.lineValue*100),100));
 }
 if(p.type==='order'){
  syncOrderUI();$('modal').querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>{const id=+b.dataset.order;if(q.selected.includes(id))return;q.selected.push(id);syncOrderUI()});
  $('clearOrder').onclick=()=>{q.selected=[];syncOrderUI()};$('undoOrder').onclick=()=>{q.selected.pop();syncOrderUI()};
  $('checkOrder').onclick=()=>{if(q.selected.length===p.items.length)checkAnswer([...q.selected])};
 }
}
function checkAnswer(value){if(!activeQuestion||activeQuestion.finished)return;let q=activeQuestion,p=q.problem,correct=p.type==='entry'?eq(value,p.answer):p.type==='line'?eq(value,p.target):p.type==='choice'?value===p.answer:p.type==='order'?value.join(',')===p.answer.join(','):false;
 if(correct){sfx('correct');save.totalCorrect++;persist();finishQuestion(true,false);return}
 if(p.type==='order')q.lastOrderCheck=q.selected.join(',');if(p.type==='line')q.lastLineCheck=q.lineValue;if(p.type==='choice')q.choiceMistakes.push(value);q.errors++;save.totalWrong++;if(game&&!q.context.practice)game.mathMistakes++;persist();sfx('wrong');renderQuestion(`Not quite — give it another try. ${q.errors>=2?'You can review the worked solution below.':''}`,false);
}
function finishQuestion(correct,revealed){
 if(!activeQuestion)return;
 let q=activeQuestion,p=q.problem;
 q.finished=true;
 if(revealed){save.totalWrong++;if(game&&!q.context.practice)game.mathMistakes+=2;persist()}
 modalOpen(`<div class="result-modal"><div class="modal-top"><div><div class="overline">${correct?'RUNE RESTORED':'GUIDED SOLUTION'}</div><h2>${correct?'Excellent work!':'Keep learning, Guardian!'}</h2></div></div><div class="puzzle-feedback ${correct?'good':''}">${correct?'✦ Your answer was correct. The magical seal has responded!':'✧ You can use this explanation to solve the next challenge.'}</div><h3>Worked explanation</h3><div class="journal-paper"><p>${p.explain}</p></div><div class="modal-actions"><button class="btn gold" id="finishPuzzle">${q.context.practice?'Next Problem':'Continue Adventure'}</button></div></div>`);
 $('finishPuzzle').onclick=()=>{
  const context=q.context;
  activeQuestion=null;
  if(context.practice){
   practice.count++;
   if(correct&&q.errors===0)practice.correct++;
   practice.wrong+=q.errors;
   nextPractice();
   return;
  }
  if(game){
   let rune=game.runes[context.runeIndex];
   if(rune){
    rune.solved=true;
    game.correctRunes+=correct?1:0;
    game.runeAttempts+=q.errors;
    game.particles.push(...Array.from({length:23},()=>({x:rune.x,y:rune.y,vx:randint(-160,160),vy:randint(-170,100),life:1,age:0,size:randint(2,6),color:worldData[game.world].accent})));
    if(context.boss){
     game.bossPhase++;
     game.bossHp=Math.max(0,3-game.bossPhase);
     game.shake=7;
     sfx('hit');
     if(game.bossPhase===3){game.bossDead=true;game.enemies=[];toast('The guardian has fallen! Reach the portal.',2800);sfx('level')}
     else toast(`The boss weakens! Seal ${game.bossPhase}/3 broken.`,2300);
    }else toast('The ancient rune shines again!',2200);
    refreshHud();
   }
  }
  modalClose();
 };
}
function showPause(){if(!game||currentScreen!=='gameScreen')return;modalOpen(`<div class="overline">ADVENTURE PAUSED</div><h2>${worldData[game.world].name}</h2><p>World ${game.world+1} · ${game.isBoss?'Boss Encounter':`Level ${game.stage+1}`} · ${game.runes.filter(x=>x.solved).length}/${game.runes.length} runes restored</p><div class="modal-actions"><button class="btn gold" id="resumeGame">Resume Adventure</button><button class="btn blue" id="pauseJournal">Math Journal</button><button class="btn blue" id="pauseSettings">Settings</button><button class="btn subtle" id="pauseMap">World Map</button></div>`);$('resumeGame').onclick=modalClose;$('pauseJournal').onclick=()=>showJournal(game.world);$('pauseSettings').onclick=showSettings;$('pauseMap').onclick=()=>showMap(game.world)}
function refreshHud(){if(!game)return;let w=worldData[game.world];$('hudWorld').textContent=`${w.name.toUpperCase()} · ${game.world+1}—${game.stage+1}`;$('hudHearts').innerHTML='♥ '.repeat(Math.max(0,game.hp))+`<span class="empty">${'♡ '.repeat(Math.max(0,save.maxHealth-game.hp))}</span>`;$('hudCoins').textContent=save.coins;$('hudRunes').textContent=`${game.runes.filter(x=>x.solved).length}/${game.runes.length}`;let done=game.runes.every(x=>x.solved);$('objectiveText').textContent=done?'Reach the glowing exit portal':game.isBoss?`Shatter the boss seals · ${game.runes.filter(x=>x.solved).length}/3`:`Restore the magical runes · ${game.runes.filter(x=>x.solved).length}/${game.runes.length}`;renderAbilities()}
function renderAbilities(){if(!game)return;let list=[['⚔','Fraction Blade'],['✦','Decimal Staff'],['◈','Negative Shield'],['❖','Order Orb']];$('abilityBar').innerHTML=list.map(([icon,label],i)=>`<button aria-label="${label}" title="${label}" data-ability="${i}" class="ability-slot ${i===game.ability?'active':''} ${i>=Math.min(4,save.crystals.length+1)?'locked':''}">${icon}<small>${i+1}</small></button>`).join('');$('abilityBar').querySelectorAll('[data-ability]').forEach(b=>b.onclick=()=>selectAbility(+b.dataset.ability))}
function selectAbility(i){if(!game)return;let available=Math.min(4,save.crystals.length+1);if(i>=available){toast('Restore more world crystals to unlock this ability.');return}game.ability=i;renderAbilities();toast(['Fraction Blade equipped','Decimal Staff equipped','Negative Shield equipped','Order Orb equipped'][i],1100)}
function toast(msg,duration=1700){let t=$('toast');t.textContent=msg;t.classList.add('show');t.dataset.until=String(performance.now()+duration)}
function resultModal(stars,already){let w=worldData[game.world];let reward=already?Math.floor(7+game.stage*2):12+game.stage*4;let rewards=`<div class="outcome-grid"><div><b>${game.runes.length}</b><span>Runes restored</span></div><div><b>${game.mathMistakes}</b><span>Incorrect tries</span></div><div><b>◈ ${reward}</b><span>Completion coins</span></div></div>`;
 modalOpen(`<div class="overline">${game.isBoss?'WORLD RESTORED':'LEVEL COMPLETE'}</div><h2>${game.isBoss?`${w.name} is Restored!`:'Adventure Complete!'}</h2><div class="star-row">${starStr(stars)}</div><p style="text-align:center">${game.isBoss?'You have recovered the magical crystal of this region.':`You cleared ${w.lessons[game.stage]}. Keep exploring the world!`}</p>${rewards}${game.isBoss?'<div class="puzzle-feedback good">✦ Crystal recovered! A new region and ability may now be available.</div>':''}<div class="modal-actions"><button class="btn gold" id="nextLevel">${game.index<29?'Next Level':'Victory!'}</button><button class="btn blue" id="returnMap">World Map</button><button class="btn subtle" id="replayLevel">Replay</button></div>`);
 $('nextLevel').onclick=()=>{if(game.index<29)startLevel(game.index+1);else showVictory()};$('returnMap').onclick=()=>showMap(game.world);$('replayLevel').onclick=()=>startLevel(game.index);
}
function showVictory(){modalOpen(`<div class="overline">THE SIX CRYSTALS ARE UNITED</div><h2>Numeria Is Restored!</h2><p>The Rift King is defeated, the six regions shine again, and the kingdom is safe. You have mastered the skills of the Rational Guardian.</p><div class="star-row">✦ ★ ✦</div><p style="text-align:center">${totalStars()} of 90 stars · ${save.stars.filter(Boolean).length} of 30 levels completed</p><p>Your adventure isn't over: replay levels to improve your stars, find hidden treasures, or practice any mathematical skill.</p><div class="modal-actions"><button class="btn gold" id="victoryMap">Explore Again</button><button class="btn subtle" id="victoryTitle">Main Menu</button></div>`);$('victoryMap').onclick=()=>showMap(5);$('victoryTitle').onclick=showTitle}
const WORLD_W=1960,WORLD_H=1200;
function makeRng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function startLevel(index){
 if(!unlocked(index)){toast('Finish the preceding adventure first.');return}
 modalClose();audioInit();lastMusic=0;
 const world=Math.floor(index/5),stage=index%5,isBoss=stage===4;
 const rand=makeRng((world+1)*34593+(stage+1)*49141);
 const runeCount=isBoss?3:stage<2?2:3;
 let runes=Array.from({length:runeCount},(_,i)=>{let x=runeCount===2?[665,1280][i]:[570,1000,1460][i],y=runeCount===2?[440,805][i]:[480,790,405][i];if(isBoss){x=[660,1045,1410][i];y=[400,790,360][i]};return {x,y,solved:false,phase:i}});
 let enemies=Array.from({length:isBoss?5:5+stage+world},(_,i)=>{let x=440+rand()*1080,y=260+rand()*650;return {x,y,homeX:x,homeY:y,vx:0,vy:0,hp:2+Math.floor(world/2)+(stage>2?1:0),maxHp:2+Math.floor(world/2)+(stage>2?1:0),speed:35+world*4+rand()*18,attackCD:1+rand()*2,phase:rand()*TAU,hit:0,alive:true,elite:i===0&&world>2}});
 let coins=Array.from({length:15},(_,i)=>({x:340+rand()*1310,y:220+rand()*760,got:false,phase:rand()*TAU}));
 let chests=[{x:390+rand()*200,y:920,got:false},{x:1270+rand()*300,y:240,got:false}];
 let props=Array.from({length:120},(_,i)=>{let x=rand()*WORLD_W,y=rand()*WORLD_H,kind=Math.floor(rand()*7),scale=.7+rand()*.9;return {x,y,kind,scale,seed:rand()*1000}}).filter(p=>p.x>135&&p.x<WORLD_W-95&&Math.abs(p.y-600)>95&&runes.every(r=>Math.hypot(p.x-r.x,p.y-r.y)>100)&&Math.hypot(p.x-1740,p.y-610)>130);
 game={index,world,stage,isBoss,runes,enemies,coins,chests,props,player:{x:195,y:608,radius:20,face:0,walk:0,attack:0,attackCD:0,castCD:0,shield:0,hurt:0,dash:0},hp:save.maxHealth,coinsFound:0,treasuresFound:0,mathMistakes:0,correctRunes:0,runeAttempts:0,blocked:false,ability:Math.min(3,save.crystals.length),projectiles:[],particles:[],floaters:[],effects:[],camX:0,camY:0,shake:0,elapsed:0,bossHp:3,bossPhase:0,bossDead:false,bossAttackCD:3,near:null,portalPulse:0,moveX:0,moveY:0,landscape:null};
 game.landscape=buildLandscape(game,rand);
 showScreen('gameScreen');refreshHud();resizeCanvas();toast(isBoss?`BOSS · ${worldData[world].boss}`:worldData[world].lore,3200);
}
function completeLevel(){if(!game||game.blocked)return;game.blocked=true;let stars=1+(game.mathMistakes<=2?1:0)+(game.mathMistakes===0&&game.coinsFound>=5?1:0),wasDone=save.stars[game.index]>0,idx=game.index;save.stars[idx]=Math.max(stars,save.stars[idx]);let reward=wasDone?Math.floor(7+game.stage*2):12+game.stage*4;save.coins+=reward;if(game.isBoss&&!save.crystals.includes(game.world)){save.crystals.push(game.world)}save.levelsPlayed++;persist();sfx('level');resultModal(stars,wasDone)}
function closestInteract(){if(!game)return null;const p=game.player,items=[];game.runes.forEach((r,i)=>{if(!r.solved&&(!game.isBoss||i===game.bossPhase))items.push({type:'rune',index:i,x:r.x,y:r.y})});game.chests.forEach((c,i)=>{if(!c.got)items.push({type:'chest',index:i,x:c.x,y:c.y})});items.push({type:'gate',x:1750,y:608});let chosen=null,min=124;items.forEach(x=>{let d=Math.hypot(x.x-p.x,x.y-p.y);if(d<min){min=d;chosen=x}});return chosen}
function interact(){if(!game||game.blocked)return;let n=closestInteract();if(!n){toast('Move closer to a glowing rune, chest, or portal.');return}if(n.type==='rune'){let idx=n.index,problem=makeQuestion(game.world,game.stage,idx+randint(0,3));startQuestion(problem,{runeIndex:idx,boss:game.isBoss});return}if(n.type==='chest'){let c=game.chests[n.index];c.got=true;game.treasuresFound++;save.treasures++;roundCoins(10+game.world*2);burst(c.x,c.y,worldData[game.world].accent,20);sfx('collect');toast(`Secret treasure! +${10+game.world*2} coins`,1700);return}if(n.type==='gate'){if(game.runes.every(r=>r.solved)){completeLevel()}else toast('The portal is sealed. Restore all runes first.',2000)}}
function damagePlayer(amount=1){if(!game||game.blocked)return;let p=game.player;if(p.hurt>0||p.shield>0)return;game.hp-=amount;p.hurt=1.2;game.shake=7;burst(p.x,p.y,'#ff6f6d',12);game.floaters.push({x:p.x,y:p.y-66,label:`−${amount} ♥`,age:0,life:.9,color:'#ffaaa3'});audioInit();sfx('hurt');refreshHud();if(game.hp<=0){game.hp=save.maxHealth;p.x=195;p.y=608;p.hurt=2.5;game.projectiles=[];toast('The crystal revived you! Your rune progress is safe.',3100);refreshHud()}}
function hitEnemy(e,damage=1){if(!e.alive)return;e.hp-=damage;e.hit=.35;game.floaters.push({x:e.x+Math.random()*14-7,y:e.y-52,label:`−${damage}`,age:0,life:.85,color:'#ffe4a0'});game.shake=Math.min(7,game.shake+1);burst(e.x,e.y,worldData[game.world].accent,5);if(e.hp<=0){e.alive=false;roundCoins(2+game.world);burst(e.x,e.y,'#e8cd8b',12);sfx('collect')}else sfx('hit')}
// Sword reach and visible sweep share these values so hits match the animation.
const SWORD_REACH=132, SWORD_UPGRADE_REACH=9, SWORD_ARC_HALF=1.55;
function attack(targetX,targetY){if(!game||game.blocked)return;let p=game.player;if(p.attackCD>0)return;p.attackCD=.39;p.attack=.29;audioInit();sfx('attack');if(Number.isFinite(targetX)&&Number.isFinite(targetY)){p.face=Math.atan2(targetY-p.y,targetX-p.x)}let rng=SWORD_REACH+save.attackTier*SWORD_UPGRADE_REACH;for(let e of game.enemies){let d=Math.hypot(e.x-p.x,e.y-p.y),ang=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(ang-p.face),Math.cos(ang-p.face));if(e.alive&&d<rng&&Math.abs(delta)<SWORD_ARC_HALF)hitEnemy(e,1+save.attackTier)}for(let i=0;i<10;i++){let angle=p.face+(Math.random()-.5)*SWORD_ARC_HALF*2,dist=80+Math.random()*(rng-83);game.particles.push({x:p.x+Math.cos(angle)*dist,y:p.y+Math.sin(angle)*dist,vx:Math.cos(angle)*randint(35,110),vy:Math.sin(angle)*randint(35,110),life:.35,age:0,size:randint(2,5),color:'#ffe3ad'})}}
function castAbility(){if(!game||game.blocked)return;let p=game.player;if(p.castCD>0)return;audioInit();let k=game.ability;if(k===0){p.castCD=1.4;p.attackCD=0;p.attack=.48;game.effects.push({x:p.x,y:p.y,type:'spin',life:.52,age:0,r:110});for(let e of game.enemies){if(e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<112)hitEnemy(e,1+save.attackTier)}sfx('cast')}
 else if(k===1){p.castCD=Math.max(1.1,2.1-save.magicTier*.3);game.projectiles.push({x:p.x+Math.cos(p.face)*32,y:p.y+Math.sin(p.face)*32,vx:Math.cos(p.face)*440,vy:Math.sin(p.face)*440,life:1.6,enemy:false,damage:2+save.magicTier,size:13});sfx('cast')}
 else if(k===2){p.castCD=Math.max(3,6-save.magicTier*.6);p.shield=3.6+save.magicTier;burst(p.x,p.y,'#b7d2ff',19);sfx('cast');toast('A shield protects you!',1300)}
 else {p.castCD=Math.max(3.3,6-save.magicTier*.6);game.effects.push({x:p.x,y:p.y,type:'orb',life:.8,age:0,r:165});for(let e of game.enemies)if(e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<170)hitEnemy(e,2+save.magicTier);sfx('cast')}
}
function burst(x,y,color,count=10){if(!game)return;for(let i=0;i<count;i++){let a=Math.random()*TAU,sp=randint(35,175),life=.45+Math.random()*.65;game.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life,age:0,size:1.5+Math.random()*4.5,color})}}
function update(dt){if(!game||game.blocked)return;let g=game,p=g.player;g.elapsed+=dt;g.portalPulse+=dt;g.shake=Math.max(0,g.shake-dt*16);p.attack=Math.max(0,p.attack-dt);p.attackCD=Math.max(0,p.attackCD-dt);p.castCD=Math.max(0,p.castCD-dt);p.shield=Math.max(0,p.shield-dt);p.hurt=Math.max(0,p.hurt-dt);
 let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+touchMove.x,dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+touchMove.y;let len=Math.hypot(dx,dy);if(len>.04){dx/=Math.max(1,len);dy/=Math.max(1,len);let speed=205,pad=30;p.x=clamp(p.x+dx*speed*dt,pad,WORLD_W-pad);p.y=clamp(p.y+dy*speed*dt,pad,WORLD_H-pad);p.walk+=dt*12;p.face=Math.atan2(dy,dx);g.moveX=dx;g.moveY=dy}else{g.moveX=0;g.moveY=0;p.walk+=dt*2}
 // Pick up coins by walking through them; generous magnetic attraction.
 g.coins.forEach(c=>{if(c.got)return;let d=Math.hypot(c.x-p.x,c.y-p.y);if(d<105&&d>1){c.x+=(p.x-c.x)/d*dt*90;c.y+=(p.y-c.y)/d*dt*90}if(d<33){c.got=true;g.coinsFound++;roundCoins(1);burst(c.x,c.y,'#f5d38b',4);sfx('collect')}});
 for(let e of g.enemies){if(!e.alive)continue;e.hit=Math.max(0,e.hit-dt);e.attackCD-=dt;e.phase+=dt*2.6;let vx=p.x-e.x,vy=p.y-e.y,dist=Math.hypot(vx,vy);if(dist<360){if(dist>52){e.x+=(vx/Math.max(1,dist))*e.speed*dt;e.y+=(vy/Math.max(1,dist))*e.speed*dt}if(dist<58&&e.attackCD<=0){e.attackCD=2.1+Math.random()*.7;damagePlayer(1)}}else{e.x+=(e.homeX-e.x)*dt*.18+Math.sin(e.phase)*dt*7;e.y+=(e.homeY-e.y)*dt*.18+Math.cos(e.phase*.8)*dt*7}}
 if(g.isBoss&&!g.bossDead){g.bossAttackCD-=dt;if(g.bossAttackCD<0&&Math.hypot(p.x-1340,p.y-560)<680){g.bossAttackCD=3.7;let n=6+g.world;for(let i=0;i<n;i++){let a=i*TAU/n+g.elapsed*.23;g.projectiles.push({x:1340,y:545,vx:Math.cos(a)*115,vy:Math.sin(a)*115,life:3.4,enemy:true,size:9})}burst(1340,545,worldData[g.world].accent,8)}}
 for(let b of g.projectiles){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.enemy){if(Math.hypot(b.x-p.x,b.y-p.y)<p.radius+b.size){damagePlayer();b.life=0}}else{for(let e of g.enemies){if(e.alive&&Math.hypot(b.x-e.x,b.y-e.y)<36){hitEnemy(e,b.damage);b.life=0;break}}}}
 g.projectiles=g.projectiles.filter(b=>b.life>0);
 for(let f of g.particles){f.age+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=1-dt*.7;f.vy*=1-dt*.7}
 g.particles=g.particles.filter(p=>p.age<p.life);for(let e of g.effects)e.age+=dt;g.effects=g.effects.filter(e=>e.age<e.life);for(let f of g.floaters){f.age+=dt;f.y-=31*dt}g.floaters=g.floaters.filter(f=>f.age<f.life);
 let wantedX=clamp(p.x-viewW/2,0,Math.max(0,WORLD_W-viewW)),wantedY=clamp(p.y-viewH/2,0,Math.max(0,WORLD_H-viewH));g.camX=mix(g.camX,wantedX,Math.min(1,dt*7));g.camY=mix(g.camY,wantedY,Math.min(1,dt*7));
 g.near=closestInteract();
 const nextTarget=g.runes.find(x=>!x.solved)||{x:1750,y:608};
 const navAngle=Math.atan2(nextTarget.y-p.y,nextTarget.x-p.x),navDist=Math.round(Math.hypot(nextTarget.x-p.x,nextTarget.y-p.y));
 $('wayfinderArrow').style.transform=`rotate(${navAngle}rad)`;
 $('wayfinderLabel').textContent=g.runes.every(x=>x.solved)?'Exit portal':'Next rune';
 $('wayfinderDistance').textContent=`${navDist} steps away`;
 let interactEl=$('interaction');if(g.near){let n=g.near,label=n.type==='rune'?`F · ${g.isBoss?'Break the seal':'Restore this rune'}`:n.type==='chest'?'F · Open treasure chest':g.runes.every(x=>x.solved)?'F · Enter portal':'Portal sealed · Restore all runes';interactEl.innerHTML=label.replace(/^F ·/,'<b>F</b>  ·');interactEl.classList.remove('hidden')}else interactEl.classList.add('hidden');
 if(+$('toast').dataset.until<performance.now())$('toast').classList.remove('show');
}
function resizeCanvas(){let r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;viewW=r.width;viewH=r.height;dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(viewW*dpr);canvas.height=Math.round(viewH*dpr)}
function frame(now){let dt=lastTime?Math.min(.033,(now-lastTime)/1000):.016;lastTime=now;try{if(currentScreen==='gameScreen'&&game){update(dt);drawWorld()}musicTick(now)}catch(e){if(!window.__lastRuntimeError||window.__lastRuntimeError!==e.message){console.error('Game loop:',e);window.__lastRuntimeError=e.message}}requestAnimationFrame(frame)}
function buildLandscape(g,rng){
 let off=document.createElement('canvas');off.width=WORLD_W;off.height=WORLD_H;let c=off.getContext('2d'),w=worldData[g.world];
 // Rich mottled ground and handcrafted serpentine ancient road.
 let base=c.createLinearGradient(0,0,WORLD_W,WORLD_H);base.addColorStop(0,w.floor);base.addColorStop(.48,w.dark);base.addColorStop(1,w.floor);c.fillStyle=base;c.fillRect(0,0,WORLD_W,WORLD_H);
 if(g.world===5){
  for(let y=0;y<WORLD_H;y+=78){for(let x=0;x<WORLD_W;x+=122){let offset=y%156===0?0:58;c.fillStyle=`rgba(237,199,218,${.035+rng()*.07})`;c.fillRect(x+offset+3,y+3,116,72);c.strokeStyle='#0c132b65';c.lineWidth=3;c.strokeRect(x+offset,y,120,76)}}
  c.strokeStyle='#e1a7ff1e';c.lineWidth=4;for(let i=0;i<20;i++){let x=120+rng()*1760,y=100+rng()*1000;c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++)c.lineTo(x+(rng()-.5)*95,y+k*22);c.stroke()}
 }else{
  for(let i=0;i<1100;i++){let x=rng()*WORLD_W,y=rng()*WORLD_H,r=6+rng()*58;c.fillStyle=rng()>.5?'#e2fac6':'#071b29';c.globalAlpha=.018+rng()*.045;c.beginPath();c.ellipse(x,y,r,r*.52,rng()*Math.PI,0,TAU);c.fill()}c.globalAlpha=1;
 }
 // Rivers / pools are decorative and do not obstruct gameplay.
 if(g.world===3||g.world===4){for(let i=0;i<27;i++){let x=rng()*WORLD_W,y=rng()*WORLD_H,rx=25+rng()*105,ry=13+rng()*45;c.beginPath();c.ellipse(x,y,rx,ry,rng()*3,0,TAU);c.fillStyle=g.world===4?'#50afd438':'#2f9ca07a';c.fill();c.strokeStyle='#b4f6e02c';c.lineWidth=2;c.stroke();for(let j=0;j<5;j++){c.beginPath();c.ellipse(x+(rng()-.5)*rx,y+(rng()-.5)*ry,3+rng()*8,1.4,0,0,TAU);c.fillStyle='#e6ffff25';c.fill()}}}
 // A path gently snakes between the important interactions.
 const way=[{x:165,y:605},...g.runes.map(q=>({x:q.x,y:q.y})),{x:1750,y:608}];
 c.lineCap='round';c.lineJoin='round';for(let stroke=0;stroke<3;stroke++){c.beginPath();c.moveTo(way[0].x,way[0].y);for(let i=1;i<way.length;i++){let prev=way[i-1],next=way[i],mx=(prev.x+next.x)/2;c.bezierCurveTo(mx,prev.y,mx,next.y,next.x,next.y)}c.strokeStyle=stroke===0?'#081e2780':stroke===1?(g.world===5?'#87748c':'#c3b590'):'#e9d6a42a';c.lineWidth=[98,84,66][stroke];c.stroke()}
 // Hand-carved cobbled stones: irregular plates give the road texture.
 for(let i=0;i<420;i++){let x=rng()*WORLD_W,near=way.reduce((best,q)=>Math.min(best,Math.hypot(q.x-x,q.y-605)),9999),y=605+(rng()-.5)*210;if(g.world===5)y=rng()*WORLD_H;c.globalAlpha=.11+rng()*.18;c.fillStyle=rng()>.4?'#fff3c9':'#0b252a';c.beginPath();c.ellipse(x,y,2+rng()*10,1+rng()*4,rng()*TAU,0,TAU);c.fill()}c.globalAlpha=1;
 for(let i=0;i<900;i++){let x=rng()*WORLD_W,y=rng()*WORLD_H;
  if(g.world===2||g.world===5){let s=1+rng()*2.3;c.fillStyle=g.world===2?'#ddadf9':'#ff92d4';c.globalAlpha=.16+rng()*.38;c.beginPath();c.moveTo(x,y-4*s);c.lineTo(x+2*s,y);c.lineTo(x,y+4*s);c.lineTo(x-2*s,y);c.fill()}
  else if(g.world===4){c.strokeStyle='#bbecff';c.globalAlpha=.13+rng()*.23;c.lineWidth=1.4;c.beginPath();c.arc(x,y,2+rng()*8,0,TAU);c.stroke()}
  else {c.strokeStyle=rng()>.5?w.light:'#203d34';c.globalAlpha=.19+rng()*.25;c.lineWidth=1+rng()*1.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-3,y-5-rng()*8,x-7,y-5-rng()*12);c.moveTo(x,y);c.lineTo(x+3+rng()*5,y-7-rng()*8);c.stroke()}}
 c.globalAlpha=1;
 // Ancient carvings around runes, boss and exit.
 for(let r of [...g.runes,{x:1750,y:608}]){c.save();c.translate(r.x,r.y+10);c.strokeStyle=w.accent+'66';c.lineWidth=4;for(let rad of [65,75,90]){c.beginPath();c.arc(0,0,rad,0,TAU);c.stroke()}c.rotate(Math.PI/4);c.strokeRect(-49,-49,98,98);c.rotate(Math.PI/4);c.strokeRect(-48,-48,96,96);for(let i=0;i<12;i++){let a=i*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*94,Math.sin(a)*94);c.lineTo(Math.cos(a)*105,Math.sin(a)*105);c.stroke()}c.restore()}
 // Edging around realm, with dark vegetation fade.
 const edge=c.createRadialGradient(980,610,340,980,610,1100);edge.addColorStop(0,'#07182200');edge.addColorStop(1,'#08121e95');c.fillStyle=edge;c.fillRect(0,0,WORLD_W,WORLD_H);
 return off;
}
function ell(c,x,y,rx,ry,color,rot=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fill()}
function rounded(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function drawProp(c,p,g,t){let w=g.world,scale=p.scale;c.save();c.translate(p.x,p.y);c.scale(scale,scale);ell(c,4,8,37,13,'#061e1d74');
 let kind=p.kind;
 if(w===5&&kind%3===0){ // Broken marble columns and braziers
  ell(c,0,2,27,14,'#101d2e');rounded(c,-19,-83,38,88,5,'#4e4764');rounded(c,-16,-79,9,76,2,'#847691');rounded(c,3,-79,10,75,2,'#352d4a');ell(c,0,-82,24,11,'#9b83a8');ell(c,0,-86,19,6,'#a698b1');drawSpark(c,0,-100,15+t%7,'#ffa4da');
 }else if(w===2&&kind%3===0){drawCrystal(c,0,-30,34,68,'#b3a5fc');drawCrystal(c,-25,-20,13,38,'#e4b5ff');drawCrystal(c,22,-19,18,46,'#908aff');
 }else if(w===4&&kind%4!==1){ // coral and sea fan
   c.lineWidth=7;c.lineCap='round';for(let k=0;k<6;k++){let x=(k-2.5)*9;c.strokeStyle=k%2?'#77c9c7':'#c29ac0';c.beginPath();c.moveTo(0,4);c.quadraticCurveTo(x*.5,-22,x*2,-55-10*Math.sin(k));c.stroke();ell(c,x*2,-55-10*Math.sin(k),5,7,k%2?'#9eece3':'#e9acda')}
 }else if(w===3&&kind%3===0){ // mushrooms and reeds
   for(let k=0;k<3;k++){let x=(k-1)*23,h=20+Math.sin(k*9+p.seed)*13;rounded(c,x-3,-h,6,h+1,3,'#b6dcaa');ell(c,x,-h,15,8,k===1?'#bfa6cf':'#ecac89');for(let j=-1;j<=1;j++)ell(c,x+j*7,-h-2,2.5,2,'#ffeed8')}
 }else if(w===0||w===1||w===3){
  if(kind%4===0){ // painterly tree crown with layered lobes
    rounded(c,-7,-67,14,76,4,'#473c31');rounded(c,-3,-64,5,62,2,'#796d43');let leaves=w===1?['#205b46','#3b9163','#75bb79','#b6da88']:w===3?['#2b5754','#488f82','#8cb5a2','#acd3a4']:['#2d625d','#408576','#75b69a','#a1d6a7'];
    for(let j=0;j<12;j++){let angle=j*2.399+p.seed,rad=18+10*Math.sin(j*3);ell(c,Math.cos(angle)*rad,-85+Math.sin(angle)*rad*.6,21+5*(j%3),21+5*(j%2),leaves[j%leaves.length]);}ell(c,-12,-106,21,12,leaves[3],-.4);ell(c,10,-106,20,11,leaves[2],.3)
  }else if(kind%4===1){ // lush bushes
    for(let j=0;j<7;j++){let x=Math.cos(j*2.3)*22,y=-10+Math.sin(j*2.3)*12;ell(c,x,y,20,14,j%2?'#346957':'#6e9d73');ell(c,x-5,y-5,7,4,'#a1c699')}
  }else if(kind%4===2){ // elegant carved lantern
    rounded(c,-5,-50,10,48,2,'#324443');ell(c,0,-51,18,6,'#c6ac7d');rounded(c,-12,-72,24,23,5,'#e9d29a');ell(c,0,-62,7,10,'#ffecba');ell(c,0,-76,16,7,'#364641');c.shadowColor='#ffca6c';c.shadowBlur=22;ell(c,0,-62,6,7,'#fff8b6');c.shadowBlur=0;
  }else{for(let j=0;j<5;j++){let a=j*TAU/5;ell(c,Math.cos(a)*14,Math.sin(a)*8-6,6,7,j%2?'#efcf87':'#c2cadd')}ell(c,0,-9,7,6,'#edac93')}
 }else{ // Crystal formations, standing stones and mystical columns
  if(kind%3===1){rounded(c,-23,-45,46,47,6,w===5?'#42354a':'#334858');rounded(c,-18,-49,36,12,4,w===5?'#aa7399':'#7188a0');c.strokeStyle=w===2?'#b6aeff':'#b2dbef';c.lineWidth=3;c.beginPath();c.moveTo(-12,-25);c.lineTo(0,-37);c.lineTo(12,-25);c.stroke()}else{drawCrystal(c,-7,-38,26,66,w===2?'#a1a5ec':w===5?'#dca1d3':'#91d3db');drawCrystal(c,17,-20,12,35,w===2?'#e0c1fe':'#c0ecf1')}}
 c.restore()}
function drawCrystal(c,x,y,width,height,color){c.save();c.translate(x,y);c.shadowBlur=12;c.shadowColor=color;c.beginPath();c.moveTo(0,-height/2);c.lineTo(width*.48,-height*.2);c.lineTo(width*.45,height*.38);c.lineTo(0,height*.53);c.lineTo(-width*.47,height*.35);c.lineTo(-width*.48,-height*.2);c.closePath();c.fillStyle=color;c.fill();c.shadowBlur=0;c.beginPath();c.moveTo(0,-height/2);c.lineTo(width*.48,-height*.2);c.lineTo(width*.45,height*.38);c.lineTo(0,height*.53);c.fillStyle='#091d4260';c.fill();c.beginPath();c.moveTo(-width*.44,-height*.16);c.lineTo(0,-height/2);c.lineTo(-width*.05,height*.41);c.closePath();c.fillStyle='#f2ffff80';c.fill();c.restore()}
function drawSpark(c,x,y,r,color){c.save();c.translate(x,y);c.globalAlpha=.72;c.shadowBlur=r;c.shadowColor=color;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.moveTo(0,-r);c.lineTo(0,r);c.stroke();ell(c,0,0,3,3,'#fff6e6');c.restore()}
function drawRune(c,r,i,g,t){let w=worldData[g.world],solved=r.solved,active=!g.isBoss||i===g.bossPhase;
 c.save();c.translate(r.x,r.y);let pulse=.5+Math.sin(t*2.5+i*2)*.5,glow=solved?'#f2d08d':active?w.accent:'#7c8a9d';c.globalAlpha=active||solved?1:.52;
 ell(c,0,11,62,18,'#071c2980');c.save();c.rotate(t*(solved?.22:-.3));c.strokeStyle=glow+'80';c.lineWidth=3;c.beginPath();c.arc(0,0,51,0,TAU);c.stroke();for(let k=0;k<8;k++){let a=k*TAU/8;ell(c,Math.cos(a)*52,Math.sin(a)*52,4,4,glow)}c.restore();
 // Stone foot and floating crystal
 ell(c,0,9,37,19,'#253b46');ell(c,0,1,34,13,'#6e8791');ell(c,0,-4,30,11,'#b4b2a4');
 for(let k=0;k<4;k++){let a=k*TAU/4+.4;ell(c,Math.cos(a)*25,Math.sin(a)*9-7,8,6,'#c9bba4')}
 c.shadowColor=glow;c.shadowBlur=solved?28:16+pulse*13;let y=-46+Math.sin(t*2.1+i)*5;if(solved){drawCrystal(c,0,y,27,45,'#ffe7a3')}else{drawCrystal(c,0,y,27,45,active?glow:'#536474')}c.shadowBlur=0;
 c.font='bold 15px Georgia';c.textAlign='center';c.fillStyle=solved?'#fff4c2':'#e5f4ed';c.fillText(solved?'✓':g.isBoss?String(i+1):'✧',0,-38+Math.sin(t*2.1+i)*5);
 if(!solved&&active){c.globalAlpha=.65;c.fillStyle='#fff8e6';for(let j=0;j<6;j++){let a=t*.8+j*TAU/6,rad=37+6*Math.sin(t+j);ell(c,Math.cos(a)*rad,-40+Math.sin(a)*14,2,2,glow)}}c.restore()}
function drawGate(c,g,t){let open=g.runes.every(r=>r.solved);c.save();c.translate(1750,608);ell(c,0,26,84,28,'#06182799');let outer=c.createRadialGradient(0,-45,8,0,-40,103);outer.addColorStop(0,open?'#fff6c6':'#5a8792');outer.addColorStop(.4,open?'#7bdacc':'#375065');outer.addColorStop(1,'#10182a');c.fillStyle=outer;c.beginPath();c.ellipse(0,-45,68,101,0,0,TAU);c.fill();c.shadowColor=open?'#9affeb':'#608ea6';c.shadowBlur=open?36:10;c.strokeStyle=open?'#ffeeac':'#9fa5ad';c.lineWidth=15;c.beginPath();c.arc(0,-36,75,Math.PI,TAU);c.lineTo(75,24);c.moveTo(-75,-36);c.lineTo(-75,24);c.stroke();c.shadowBlur=0;
 for(let j=0;j<12;j++){let a=j*TAU/12+t*(open?-.24:.05);ell(c,Math.cos(a)*59,-40+Math.sin(a)*81,3.6,3.6,open?'#d9fff4':'#7193a5')}
 c.strokeStyle='#fff5d7';c.globalAlpha=open?.45:.18;c.lineWidth=2;for(let j=0;j<6;j++){c.beginPath();c.arc(0,-38,24+j*7,t+j*.4,t+1.4+j*.4);c.stroke()}c.globalAlpha=1;
 c.fillStyle=open?'#fff1be':'#a3b5c1';c.font='bold 13px Georgia';c.textAlign='center';c.fillText(open?'PORTAL OPEN':'SEALED',0,69);c.restore()}
function drawChest(c,ch,t){if(ch.got)return;c.save();c.translate(ch.x,ch.y);ell(c,0,15,33,12,'#081b2788');rounded(c,-27,-18,54,35,6,'#6d4431');rounded(c,-26,-23,52,20,6,'#ba8350');c.strokeStyle='#e3bb6e';c.lineWidth=4;for(let dx of [-19,19]){c.beginPath();c.moveTo(dx,-20);c.lineTo(dx,14);c.stroke()}rounded(c,-6,-10,12,18,3,'#e5bc71');ell(c,0,-2,3,3,'#493b2f');drawSpark(c,21+Math.sin(t)*4,-35+Math.sin(t*2)*2,6,'#ffdfa8');c.restore()}
function drawCoin(c,coin,t){if(coin.got)return;c.save();c.translate(coin.x,coin.y+Math.sin(t*2.5+coin.phase)*4);ell(c,0,8,11,4,'#0b24376b');c.shadowColor='#ffd57c';c.shadowBlur=8;ell(c,0,-2,9,11,'#d9a65a');ell(c,0,-4,7,9,'#ffe49b');c.shadowBlur=0;c.strokeStyle='#a97935';c.lineWidth=1.3;c.beginPath();c.moveTo(0,-10);c.lineTo(4,-4);c.lineTo(0,3);c.lineTo(-4,-4);c.closePath();c.stroke();c.restore()}
function drawEnemy(c,e,g,t){if(!e.alive)return;let w=g.world,bob=Math.sin(e.phase)*3;c.save();c.translate(e.x,e.y+bob);ell(c,0,20,27,10,'#071a2799');if(e.hit>0)c.globalAlpha=.62+Math.sin(e.hit*60)*.24;
 const colors=[['#286c6c','#82dac1'],['#4a7444','#b7d886'],['#62558c','#dbc2ff'],['#447672','#b7eaa8'],['#327c9b','#a3effa'],['#77517f','#ebb2ec']],col=colors[w];
 if(w===2){ // jagged crystal beetle
  for(let k=0;k<4;k++){c.save();c.rotate(k*Math.PI/2);drawCrystal(c,0,-19,13,33,col[1]);c.restore()}ell(c,0,-11,22,23,col[0]);ell(c,-8,-16,4,5,'#fafffa');ell(c,8,-16,4,5,'#fafffa');ell(c,-8,-16,2,2,'#16253e');ell(c,8,-16,2,2,'#16253e');
 }else if(w===4){ // swimming luminous jelly
  for(let j=-2;j<=2;j++){c.strokeStyle=j%2?'#d5eef4':'#65d0cc';c.lineWidth=4;c.beginPath();c.moveTo(j*9,-2);c.quadraticCurveTo(j*10+Math.sin(t*3+j)*8,22,j*11,29);c.stroke()}ell(c,0,-12,28,25,col[0]);ell(c,-9,-18,8,6,col[1]);ell(c,9,-18,8,6,col[1]);
 }else{
  for(let j=-1;j<=1;j+=2){c.fillStyle=col[0];c.beginPath();c.moveTo(j*15,-23);c.lineTo(j*24,-43);c.lineTo(j*7,-29);c.fill()}
  ell(c,0,-9,24,26,col[0]);ell(c,-6,-21,17,11,col[1]);ell(c,5,-7,19,13,col[1]);ell(c,-8,-17,6,7,'#f8fdf0');ell(c,8,-17,6,7,'#f8fdf0');ell(c,-8,-16,2.7,3.7,'#16202e');ell(c,8,-16,2.7,3.7,'#16202e');c.strokeStyle='#243b3b';c.lineWidth=2;c.beginPath();c.arc(0,-2,5,0,Math.PI);c.stroke();
  if(w===1){for(let j=-2;j<=2;j++){c.save();c.translate(j*10,-32-Math.abs(j)*3);c.rotate(j*.35);ell(c,0,-7,7,13,j%2?'#53976b':'#c0dc81');c.restore()}}
  if(w===3){for(let j=-1;j<=1;j++)ell(c,j*13,-28,5,7,'#d9f0ad');for(let side of [-1,1]){ell(c,side*26,6,12,7,'#69956a');ell(c,side*29,8,7,4,'#afcd8e')}}
  if(w===5){ell(c,0,-33,17,11,'#4c325f');drawSpark(c,0,-43,5,'#ffc3f4');for(let side of [-1,1]){c.fillStyle='#9777af';c.beginPath();c.moveTo(side*16,-4);c.lineTo(side*23,21);c.lineTo(side*4,12);c.fill()}}
 }
 if(e.elite){drawSpark(c,0,-51,8,'#fce4a3');c.strokeStyle='#ffebad';c.lineWidth=2;c.beginPath();c.arc(0,-13,30,0,TAU);c.stroke()}
 if(e.hp<e.maxHp){rounded(c,-24,-53,48,5,3,'#091926');rounded(c,-24,-53,48*Math.max(0,e.hp/e.maxHp),5,3,'#bff1ba')}
 c.restore()}
function drawBoss(c,g,t){if(!g.isBoss||g.bossDead)return;let x=1340,y=570,w=g.world,colors=['#4daaa4','#98ba64','#ac92dd','#90aa83','#6bd4d3','#d58ccf'];c.save();c.translate(x,y+Math.sin(t*1.5)*7);
 ell(c,0,30,93,29,'#091627a8');c.save();c.rotate(Math.sin(t*.8)*.07);
 // Every realm has a distinctive, layered guardian silhouette.
 if(w===0){for(let j=-2;j<=2;j++){c.save();c.translate(j*32,-67+Math.abs(j)*8);c.rotate(j*.2);rounded(c,-16,-44,32,65,10,j%2?'#6a8f8a':'#9db4a0');rounded(c,-10,-38,12,38,6,'#c0c9b8');c.restore()}}
 if(w===1){for(let side of [-1,1]){c.strokeStyle='#253d2f';c.lineWidth=22;c.lineCap='round';c.beginPath();c.moveTo(side*34,-28);c.bezierCurveTo(side*120,-46,side*108,-133,side*151,-146);c.stroke();for(let j=0;j<5;j++){let x=side*(88+j*13),y=-67-j*21;c.fillStyle=j%2?'#8abc6d':'#45794e';c.beginPath();c.moveTo(x,y);c.lineTo(x+side*16,y-24);c.lineTo(x+side*24,y+5);c.closePath();c.fill()}}}
 if(w===2){for(let j=-4;j<=4;j++){let xx=j*24,h=70+Math.abs(Math.sin(j*13))*75;drawCrystal(c,xx,-73,19+Math.abs(j%3)*6,h,j%2?'#b4b1fa':'#dcc9ff')}}
 if(w===3){for(let j=-1;j<=1;j++){let x=j*62;c.strokeStyle=j===0?'#477e68':'#6d9f7c';c.lineWidth=25;c.lineCap='round';c.beginPath();c.moveTo(j*30,15);c.bezierCurveTo(x*1.6,-5,x*1.1,-127,x,-147-Math.sin(t*1.5+j)*10);c.stroke();ell(c,x,-152-Math.sin(t*1.5+j)*10,27,22,'#669683');ell(c,x-10,-160-Math.sin(t*1.5+j)*10,6,6,'#fff7cb');ell(c,x+9,-160-Math.sin(t*1.5+j)*10,6,6,'#fff7cb');ell(c,x-10,-159-Math.sin(t*1.5+j)*10,3,3,'#242e3b');ell(c,x+9,-159-Math.sin(t*1.5+j)*10,3,3,'#242e3b')}}
 if(w===4){c.strokeStyle='#326a91';c.lineWidth=45;c.lineCap='round';c.beginPath();c.moveTo(0,24);c.bezierCurveTo(100,105,155,42,134,-30);c.bezierCurveTo(113,-115,193,-89,191,-143);c.stroke();for(let i=0;i<8;i++){let a=i*.8;ell(c,125+Math.sin(a)*28,-27-i*13,8,18,i%2?'#a8e5e2':'#76bac9',.3)}}
 if(w===5){for(let side of [-1,1]){c.fillStyle='#39274c';c.beginPath();c.moveTo(side*24,-67);c.bezierCurveTo(side*96,-172,side*130,-147,side*175,-202);c.lineTo(side*144,-105);c.lineTo(side*118,-88);c.lineTo(side*90,-61);c.closePath();c.fill();c.strokeStyle='#aa81c1';c.lineWidth=3;c.beginPath();c.moveTo(side*34,-58);c.lineTo(side*145,-149);c.stroke()}}
 // massive mantle and animated arms
 c.fillStyle='#1e2a42';c.beginPath();c.moveTo(-50,-76);c.quadraticCurveTo(-90,40,-67,74);c.lineTo(74,74);c.quadraticCurveTo(100,37,48,-77);c.closePath();c.fill();
 for(let j of [-1,1]){c.save();c.translate(j*55,-25);c.rotate(j*(.15+Math.sin(t*1.6)*.18));rounded(c,-19,-18,38,84,16,colors[w]);ell(c,0,58,25,14,'#253a48');drawCrystal(c,0,65,21,35,'#c7e6ec');c.restore()}
 ell(c,0,-30,56,68,colors[w]);ell(c,-14,-61,38,31,'#eff4fa39');rounded(c,-34,-83,68,26,12,'#253047');ell(c,0,-72,44,27,'#334354');
 // crown / horns unique by realm
 for(let k=-2;k<=2;k++){c.fillStyle=k%2?'#f3dfaf':colors[w];c.beginPath();c.moveTo(k*18-7,-86);c.lineTo(k*21,-127+Math.abs(k)*8);c.lineTo(k*18+7,-86);c.closePath();c.fill()}
 ell(c,-19,-51,10,7,'#fff0ca');ell(c,19,-51,10,7,'#fff0ca');ell(c,-19,-50,5,4,'#442942');ell(c,19,-50,5,4,'#442942');c.strokeStyle='#3c2b4b';c.lineWidth=4;c.beginPath();c.moveTo(-9,-25);c.quadraticCurveTo(0,-16,10,-25);c.stroke();
 drawCrystal(c,0,-6,23,46,worldData[w].accent);c.restore();
 c.shadowColor=worldData[w].accent;c.shadowBlur=18;c.strokeStyle=worldData[w].accent;c.lineWidth=4;c.beginPath();c.arc(0,-23,88+Math.sin(t*2)*3,0,TAU);c.stroke();c.shadowBlur=0;
 c.fillStyle='#fff4c8';c.font='bold 16px Georgia';c.textAlign='center';c.fillText(worldData[w].boss,0,-157);
 rounded(c,-67,-143,134,10,5,'#0c202d');rounded(c,-65,-141,130*g.bossHp/3,6,4,worldData[w].accent);c.restore()}
function drawPlayer(c,p,g,t){c.save();c.translate(p.x,p.y);let bob=Math.sin(p.walk*1.7)*2,ang=p.face;ell(c,0,19,27,10,'#071724a6');if(p.hurt>0&&Math.floor(t*13)%2===0)c.globalAlpha=.45;
 // boots move independently to suggest actual footfall
 const step=g.moveX||g.moveY?Math.sin(p.walk)*7:0;
 rounded(c,-15,7+step,11,20,5,'#2d333c');rounded(c,4,7-step,11,20,5,'#2d333c');rounded(c,-16,16+step,12,7,2,'#594a3f');rounded(c,4,16-step,12,7,2,'#594a3f');
 // cape and layered tunic
 c.fillStyle='#1a6b89';c.beginPath();c.moveTo(-19,-26);c.quadraticCurveTo(-34,12,-24,28+Math.sin(t*5)*4);c.quadraticCurveTo(0,37,25,27+Math.cos(t*5)*4);c.quadraticCurveTo(31,-2,17,-28);c.closePath();c.fill();
 c.strokeStyle='#92c0cb';c.lineWidth=2;c.beginPath();c.moveTo(-22,23);c.quadraticCurveTo(0,33,24,22);c.stroke();
 rounded(c,-22,-39,44,51,15,'#2b7380');rounded(c,-13,-35,26,34,8,'#477e87');
 rounded(c,-24,-27,10,32,5,'#b88b6d');rounded(c,14,-27,10,32,5,'#b88b6d');ell(c,-19,5,5,6,'#f1c09c');ell(c,19,5,5,6,'#f1c09c');
 // cross-body satchel and ornate buckle
 c.strokeStyle='#e5bd79';c.lineWidth=4;c.beginPath();c.moveTo(-14,-34);c.lineTo(15,0);c.stroke();rounded(c,-21,-5,42,10,3,'#493e33');rounded(c,-6,-7,12,14,2,'#efc879');rounded(c,-2,-4,4,8,1,'#685441');
 // warm face, textured hair and cape-hood
 ell(c,0,-51,20,23,'#edb78a');ell(c,-1,-66,23,13,'#403b40');ell(c,-16,-58,7,11,'#40333a');ell(c,17,-57,6,11,'#40333a');ell(c,-5,-68,10,6,'#655142');ell(c,-7+Math.cos(ang)*2,-49,2.5,2.5,'#272a36');ell(c,7+Math.cos(ang)*2,-49,2.5,2.5,'#272a36');ell(c,0,-39,5,2,'#c78768');
 // drawn, glimmering blade, right hand
 c.save();c.translate(23,-1);c.rotate(.25+Math.sin(p.attack/.29*Math.PI)*.85*(p.attack>0?1:0));rounded(c,-3,-12,6,28,2,'#8d573f');rounded(c,-13,-13,26,6,2,'#e8c68b');c.fillStyle='#dfedf2';c.beginPath();c.moveTo(-5,-15);c.lineTo(-4,-56);c.lineTo(0,-70);c.lineTo(5,-56);c.lineTo(6,-15);c.closePath();c.fill();c.fillStyle='#fbffff';c.beginPath();c.moveTo(-4,-16);c.lineTo(0,-65);c.lineTo(0,-16);c.fill();c.restore();
 if(p.shield>0){c.strokeStyle='#9ce4ff';c.lineWidth=5;c.shadowColor='#bcecff';c.shadowBlur=19;c.beginPath();c.ellipse(0,-24,36,60,0,0,TAU);c.stroke();c.shadowBlur=0}
 if(p.attack>0){let progress=1-p.attack/.29,reach=SWORD_REACH+save.attackTier*SWORD_UPGRADE_REACH;
 // Wide arc makes the extended physical reach readable from the overhead camera.
 c.strokeStyle='rgba(255,225,163,.3)';c.lineWidth=19;c.shadowColor='#ffe1a9';c.shadowBlur=18;c.beginPath();c.arc(0,0,reach-4,p.face-SWORD_ARC_HALF+progress*.5,p.face+SWORD_ARC_HALF+progress*.5);c.stroke();
 c.strokeStyle='#fff1bf';c.lineWidth=6;c.shadowBlur=12;c.beginPath();c.arc(0,0,reach-4,p.face-SWORD_ARC_HALF+progress*.5,p.face+SWORD_ARC_HALF+progress*.5);c.stroke();c.shadowBlur=0}
 c.restore()}
function drawWorld(){let g=game;if(!g)return;let c=ctx,t=g.elapsed;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=worldData[g.world].dark;c.fillRect(0,0,viewW,viewH);c.save();let shake=g.shake?Math.sin(t*60)*g.shake:0,offX=-g.camX+shake,offY=-g.camY+shake*.5;c.translate(offX,offY);c.drawImage(g.landscape,0,0);
 // Gentle, shifting lights across the map.
 for(let i=0;i<10;i++){let x=(i*287+120)%WORLD_W,y=(i*341+150)%WORLD_H,r=40+16*Math.sin(t+i);let glow=c.createRadialGradient(x,y,4,x,y,85);glow.addColorStop(0,worldData[g.world].accent+'31');glow.addColorStop(1,worldData[g.world].accent+'00');c.fillStyle=glow;c.beginPath();c.arc(x,y,r*2,0,TAU);c.fill()}
 // Draw entities with y-based painter's ordering.
 let entities=[];for(let p of g.props)entities.push({y:p.y,fn:()=>drawProp(c,p,g,t),x:p.x});for(let q of g.coins)if(!q.got)entities.push({y:q.y,fn:()=>drawCoin(c,q,t),x:q.x});for(let x of g.chests)if(!x.got)entities.push({y:x.y,fn:()=>drawChest(c,x,t),x:x.x});for(let i=0;i<g.runes.length;i++){let r=g.runes[i];entities.push({y:r.y,fn:()=>drawRune(c,r,i,g,t),x:r.x})}for(let e of g.enemies)if(e.alive)entities.push({y:e.y,fn:()=>drawEnemy(c,e,g,t),x:e.x});entities.push({y:608,x:1750,fn:()=>drawGate(c,g,t)});if(g.isBoss&&!g.bossDead)entities.push({y:570,x:1340,fn:()=>drawBoss(c,g,t)});entities.push({y:g.player.y,x:g.player.x,fn:()=>drawPlayer(c,g.player,g,t)});
 entities.sort((a,b)=>a.y-b.y);for(let item of entities){if(item.x<g.camX-170||item.x>g.camX+viewW+170||item.y<g.camY-210||item.y>g.camY+viewH+210)continue;item.fn()}
 // Magic projectiles: detailed glow and trailing sparks.
 for(let b of g.projectiles){c.save();c.shadowColor=b.enemy?'#f9a5dc':'#9df1ff';c.shadowBlur=22;ell(c,b.x,b.y,b.size,b.size,b.enemy?'#f39acd':'#d3f8f7');ell(c,b.x,b.y,b.size*.45,b.size*.45,'#fffdee');c.restore()}
 for(let e of g.effects){let progress=e.age/e.life,r=e.r*progress;c.save();c.globalAlpha=1-progress;c.strokeStyle=e.type==='spin'?'#ffe1a5':'#bde8fc';c.lineWidth=14*(1-progress)+2;c.shadowBlur=14;c.shadowColor=c.strokeStyle;c.beginPath();c.arc(e.x,e.y,r,0,TAU);c.stroke();c.restore()}
 for(let f of g.floaters){c.save();c.globalAlpha=Math.max(0,1-f.age/f.life);c.shadowColor='#041625';c.shadowBlur=5;c.font='bold 19px Trebuchet MS, Arial';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#092233';c.strokeText(f.label,f.x,f.y);c.fillStyle=f.color;c.fillText(f.label,f.x,f.y);c.restore()}
 if(save.settings.particles){for(let p of g.particles){c.globalAlpha=Math.max(0,1-p.age/p.life);c.shadowColor=p.color;c.shadowBlur=8;ell(c,p.x,p.y,p.size,p.size,p.color)}c.shadowBlur=0;c.globalAlpha=1;
  for(let i=0;i<42;i++){let px=(i*173.7+Math.sin(t*(.13+i%5*.05)+i)*65+WORLD_W)%WORLD_W,py=(i*197.7-t*(9+i%4*4)+WORLD_H*10)%WORLD_H;let alpha=.15+.18*Math.sin(t*1.8+i);c.globalAlpha=Math.max(0,alpha);ell(c,px,py,1.3+(i%4)*.33,2,worldData[g.world].accent)}c.globalAlpha=1}
 c.restore();

}
/* Screens, controls and offline initialization */
$('btnContinue').onclick=()=>{audioInit();if(save.stars.some(Boolean))showMap(Math.min(5,Math.floor((save.stars.findIndex(s=>s===0)===-1?29:save.stars.findIndex(s=>s===0))/5)));else startLevel(0)};
$('btnTitleMap').onclick=()=>showMap(0);
$('btnHow').onclick=showHow;$('btnJournalTitle').onclick=()=>showJournal(0);$('btnTitleSettings').onclick=showSettings;
$('mapBack').onclick=showTitle;$('btnPractice').onclick=()=>beginPractice(selectedWorld);$('btnShop').onclick=showShop;$('btnJournalMap').onclick=()=>showJournal(selectedWorld);
$('hudPause').onclick=showPause;$('hudJournal').onclick=()=>showJournal(game?game.world:0);$('hudSound').onclick=()=>{save.settings.sound=!save.settings.sound;persist();$('hudSound').textContent=save.settings.sound?'♫':'♪';if(save.settings.sound){audioInit();sfx('collect')}};
window.addEventListener('resize',resizeCanvas);window.addEventListener('blur',()=>{keys={};touchMove={x:0,y:0};resetStick()});
window.addEventListener('keydown',e=>{
 let tag=(document.activeElement?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'){if(e.key==='Escape'){document.activeElement.blur();if(!$('overlay').classList.contains('hidden'))modalClose()}return}
 let key=e.key.toLowerCase();if(currentScreen==='gameScreen'&&[' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
 if(key==='escape'){if(!$('overlay').classList.contains('hidden'))modalClose();else if(currentScreen==='gameScreen')showPause();return}
 if(!$('overlay').classList.contains('hidden')){
  if(activeQuestion && !e.repeat){
   const question=activeQuestion.problem;
   if(question.type==='choice' && /^[1-4]$/.test(key)){$('modal').querySelector(`[data-choice="${Number(key)-1}"]`)?.click();e.preventDefault()}
   if(question.type==='order' && /^[1-3]$/.test(key)){$('modal').querySelectorAll('[data-order]')[Number(key)-1]?.click();e.preventDefault()}
   if(question.type==='order' && key==='enter' && !$('checkOrder').disabled){$('checkOrder').click();e.preventDefault()}
  }
  return;
 }
 keys[key]=true;
 if(currentScreen==='gameScreen'&&game){if(key==='f')interact();if(key===' '){attack();e.preventDefault()}if(key==='e')castAbility();if(['1','2','3','4'].includes(key))selectAbility(+key-1)}
});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
canvas.addEventListener('pointermove',e=>{if(!game||game.blocked||e.pointerType==='touch')return;let rect=canvas.getBoundingClientRect();let x=e.clientX-rect.left+game.camX,y=e.clientY-rect.top+game.camY;game.player.mouseFace=Math.atan2(y-game.player.y,x-game.player.x)});
canvas.addEventListener('pointerdown',e=>{if(currentScreen!=='gameScreen'||!game||game.blocked||e.button===2)return;let rect=canvas.getBoundingClientRect();let x=e.clientX-rect.left+game.camX,y=e.clientY-rect.top+game.camY;attack(x,y)});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function updateStick(e){let el=$('stickBase'),r=el.getBoundingClientRect(),centerX=r.left+r.width/2,centerY=r.top+r.height/2,dx=e.clientX-centerX,dy=e.clientY-centerY,range=r.width*.37,mag=Math.hypot(dx,dy),px=mag>range?dx/mag*range:dx,py=mag>range?dy/mag*range:dy;touchMove.x=px/range;touchMove.y=py/range;$('stickKnob').style.transform=`translate(${px}px,${py}px)`}
function resetStick(){touchMove.x=0;touchMove.y=0;$('stickKnob').style.transform='translate(0,0)';stickPointer=null}
$('stickBase').addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;$('stickBase').setPointerCapture(e.pointerId);updateStick(e)});
$('stickBase').addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>$('stickBase').addEventListener(ev,e=>{if(stickPointer===e.pointerId)resetStick()}));
$('touchAttack').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();attack()});$('touchSpecial').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();castAbility()});$('touchInteract').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interact()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};touchMove.x=touchMove.y=0}});
$('hudSound').textContent=save.settings.sound?'♫':'♪';
showTitle();requestAnimationFrame(frame);
// Diagnostic interface is only enabled explicitly by ?qa=1 for offline browser validation.
if(location.search.includes('qa=1'))window.__RIFT_QA={get game(){return game},get save(){return save},get question(){return activeQuestion},makeQuestion,parseRational,R,eq,fmt,makeChoiceForValue,showMap,startLevel,interact,checkAnswer,completeLevel,finishQuestion,renderQuestion,startQuestion,renderMap};
})();
