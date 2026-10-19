/* ArcadeWeaver — offline first-person raycasting game engine. No external dependencies. */
(()=>{'use strict';
const {register,U}=window.ArcadeWeaver;
const PI=Math.PI,TAU=PI*2,cl=U.clamp,rnd=U.rnd;
const weapons=[{name:'PULSE PISTOL',short:'PISTOL',rate:.31,damage:34,spread:.014,pellets:1,mag:12,reload:1.08,ammo:72,color:'#52deff',range:17},
 {name:'VANGUARD RIFLE',short:'RIFLE',rate:.115,damage:18,spread:.033,pellets:1,mag:36,reload:1.6,ammo:180,color:'#88f8c1',range:18},
 {name:'THUNDER SHOTGUN',short:'SHOTGUN',rate:.75,damage:14,spread:.145,pellets:9,mag:6,reload:1.85,ammo:36,color:'#ffba65',range:11},
 {name:'RAPID SMG',short:'SMG',rate:.072,damage:13,spread:.075,pellets:1,mag:45,reload:1.40,ammo:225,color:'#d4a9ff',range:13},
 {name:'RAIL MARKSMAN',short:'RAILGUN',rate:1.02,damage:155,spread:.004,pellets:1,mag:5,reload:2.20,ammo:25,color:'#ffe98a',range:28}];
const layouts=[
['1111111111111111111','1000001000001000001','1010101011101011101','1000100000100000101','1110101110101110101','1000001000001000001','1011101011101011101','1000100000100000001','1010111100111101101','1000100000000100001','1010101011100101101','1000001000000000101','1011101010111100101','1000100000100000001','1010111110101111101','1000000000001000001','1011110111101011101','1000000000000000001','1111111111111111111'],
['1111111111111111111','1000000000000000001','1011110101110101101','1000010100010100001','1110010101010111101','1000010001010000001','1011111101011101101','1000000000000000101','1011100110111110101','1000100000000000001','1010111100111101101','1000000100000100101','1011100101100100101','1000000000000000001','1011110101111101101','1000000100000000101','1011100111101010101','1000000000000010001','1111111111111111111'],
['1111111111111111111','1000000100000000001','1011100101110111101','1000100000000100001','1010101111100101101','1000000000000000101','1110100111110100101','1000100000000100001','1010111101101111101','1000000000000000001','1011101101110101101','1000000100000100001','1010110101100111101','1010000000100000101','1011101110101110101','1000000000000000101','1110110111101110101','1000000000000000001','1111111111111111111']];
const levels=layouts.map(rows=>rows.map(s=>[...s].map(ch=>Number(ch))));
const palettes={forest:{sky:['#101f39','#4b6780'],floor:['#2d3133','#1b222e'],wall:['#67957f','#203f44'],trim:'#b0edbc',light:'#b6f0c3'},neon:{sky:['#120b33','#331c69'],floor:['#201738','#0c112e'],wall:['#714ba5','#202447'],trim:'#f987ff',light:'#64f7ef'},space:{sky:['#050d23','#22375f'],floor:['#1b2944','#0a102a'],wall:['#47699c','#1c2e58'],trim:'#63b9ff',light:'#7bdaff'},desert:{sky:['#432937','#986452'],floor:['#503a38','#2e252a'],wall:['#b68465','#62464d'],trim:'#ffe3ae',light:'#ffe1a0'},city:{sky:['#142338','#314962'],floor:['#303949','#182336'],wall:['#657789','#2b445e'],trim:'#ffd389',light:'#c4e5ff'},ocean:{sky:['#0c2643','#126779'],floor:['#123e51','#071e38'],wall:['#468b94','#164c69'],trim:'#8dfcf1',light:'#c5ffff'},pastel:{sky:['#343359','#8172a0'],floor:['#544c6f','#2b2c52'],wall:['#a194b1','#574f85'],trim:'#ffe7ba',light:'#ffdaef'}};
// Surface-aligned materials: unlike the former screen-column trim, textures share world UVs.
const textureCache={};
function material(theme,variant=0){
 const key=theme+':'+variant;if(textureCache[key])return textureCache[key];
 const pal=palettes[theme]||palettes.neon,cv=document.createElement('canvas');cv.width=128;cv.height=128;
 const c=cv.getContext('2d');let seed=971+theme.length*819+variant*523;
 function r(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 c.fillStyle=pal.wall[variant%2];c.fillRect(0,0,128,128);
 if(variant%3===0){
  // Interlocking stone or metal blocks, joints follow the same surface coordinates on every ray.
  for(let j=0;j<4;j++)for(let i=-1;i<5;i++){
   const x=i*32+(j%2)*16,y=j*32;c.fillStyle=r()>.4?'#ffffff15':'#00000015';c.fillRect(x+2,y+2,28,28);
   c.strokeStyle='#07101e83';c.lineWidth=2;c.strokeRect(x+.7,y+.7,31,31);
   c.fillStyle='#ffffff11';c.fillRect(x+3,y+3,24,2);
  }
 }else if(variant%3===1){
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){
   const x=i*32,y=j*32;c.fillStyle=(i+j)%2?'#d5def412':'#040a211d';c.fillRect(x+2,y+2,28,28);
   c.strokeStyle='#02071477';c.lineWidth=2;c.strokeRect(x+1,y+1,30,30);
   for(let [xx,yy] of [[5,5],[26,5],[5,26],[26,26]]){c.fillStyle='#a6d7e444';c.fillRect(x+xx,y+yy,2,2)}
  }
 }else{
  for(let i=0;i<7;i++){c.fillStyle=i%2?'#ffffff0c':'#00000019';c.fillRect(i*19,0,9,128)}
  c.fillStyle='#ffffff1a';c.fillRect(0,15,128,2);c.fillRect(0,113,128,2);
  c.fillStyle=pal.trim+'4d';c.fillRect(0,100,128,4);
 }
 for(let i=0;i<260;i++){let k=Math.floor(r()*255);c.fillStyle=r()>.53?'#ffffff0d':'#00000010';c.fillRect(r()*128,r()*128,1+r()*2,1+r()*2)}
 textureCache[key]=cv;return cv;
}
function pickMaterial(x,y,side){return(Math.imul(x*17+y*31+(side?13:0),2654435761)>>>0)%3}
function proceduralMap(round,seedValue=0){
 let seed=(Math.imul(round+1,1103515245)+Math.imul(seedValue+31,69069))>>>0;
 const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const w=25,h=23,map=Array.from({length:h},()=>Array(w).fill(1));
 const rooms=[];for(let i=0;i<18;i++){
  const rw=3+Math.floor(r()*5),rh=3+Math.floor(r()*5),x=1+Math.floor(r()*(w-rw-2)),y=1+Math.floor(r()*(h-rh-2));
  for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++)map[yy][xx]=0;
  const center={x:x+(rw>>1),y:y+(rh>>1)};
  if(rooms.length){const old=rooms[rooms.length-1];let x0=old.x,y0=old.y;
   const carveX=()=>{while(x0!==center.x){map[y0][x0]=0;x0+=Math.sign(center.x-x0)}};
   const carveY=()=>{while(y0!==center.y){map[y0][x0]=0;y0+=Math.sign(center.y-y0)}};
   if(r()>.5){carveX();carveY()}else{carveY();carveX()}
  }rooms.push(center);
 }
 // Start is always a clear 3x3 room connected to the remainder of the level.
 for(let y=1;y<=3;y++)for(let x=1;x<=3;x++)map[y][x]=0;
 let x=2,y=2;while(x!==rooms[0].x){map[y][x]=0;x+=Math.sign(rooms[0].x-x)}
 while(y!==rooms[0].y){map[y][x]=0;y+=Math.sign(rooms[0].y-y)}
 return map;
}
function world(g){return g.data.fp};
function cell(s,x,y){let xi=Math.floor(x),yi=Math.floor(y);return yi<0||xi<0||yi>=s.map.length||xi>=s.map[0].length?1:s.map[yi][xi]}
function free(s,x,y,r=.20){return !cell(s,x-r,y-r)&&!cell(s,x+r,y-r)&&!cell(s,x-r,y+r)&&!cell(s,x+r,y+r)}
function slide(s,obj,dx,dy,r=.19){if(free(s,obj.x+dx,obj.y,r))obj.x+=dx;if(free(s,obj.x,obj.y+dy,r))obj.y+=dy}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function walkRay(s,x,y,angle,maxRange=22){const dx=Math.cos(angle),dy=Math.sin(angle);let mx=Math.floor(x),my=Math.floor(y),ddx=Math.abs(1/(dx||1e-12)),ddy=Math.abs(1/(dy||1e-12));let stepX=dx<0?-1:1,stepY=dy<0?-1:1,sideX=(dx<0?x-mx:mx+1-x)*ddx,sideY=(dy<0?y-my:my+1-y)*ddy;let side=0,dist=0;for(let i=0;i<64;i++){if(sideX<sideY){mx+=stepX;dist=sideX;sideX+=ddx;side=0}else{my+=stepY;dist=sideY;sideY+=ddy;side=1}if(dist>maxRange)return {d:maxRange,side,tex:0,hit:false,x:x+dx*maxRange,y:y+dy*maxRange};if(cell(s,mx,my)){let hit=side===0?y+dist*dy:x+dist*dx;hit-=Math.floor(hit);if((side===0&&dx>0)||(side===1&&dy<0))hit=1-hit;return {d:Math.max(.01,dist),side,tex:hit,hit:true,x:x+dx*dist,y:y+dy*dist}}}return {d:maxRange,side,tex:0,hit:false}}
function path(s,tx,ty,x,y){let a=Math.floor(x),b=Math.floor(y),goalX=Math.floor(tx),goalY=Math.floor(ty),w=s.map[0].length,h=s.map.length;if(a===goalX&&b===goalY)return null;const nodes=[b*w+a],prev=new Int16Array(w*h).fill(-1),start=b*w+a;prev[start]=start;let end=goalY*w+goalX;for(let qi=0;qi<nodes.length&&qi<w*h;qi++){let p=nodes[qi];if(p===end)break;let yy=(p/w)|0,xx=p%w;for(let [u,v] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=xx+u,ny=yy+v,idx=ny*w+nx;if(nx>0&&ny>0&&nx<w-1&&ny<h-1&&!cell(s,nx,ny)&&prev[idx]===-1){prev[idx]=p;nodes.push(idx)}}}if(prev[end]<0)return null;let cur=end;while(prev[cur]!==start&&prev[cur]!==cur)cur=prev[cur];return{x:(cur%w)+.5,y:Math.floor(cur/w)+.5}}
function enemy(s,x,y,type=0){let boss=type===2,fast=type===1,ranged=type===3;return{x:x+.5,y:y+.5,type,hp:(boss?320:fast?65:ranged?75:96)*s.tough,maxhp:(boss?320:fast?65:ranged?75:96)*s.tough,speed:(boss?0.70:fast?1.19:ranged?.65:0.84)*s.enemySpeed,attack:1+Math.random(),hit:0,flash:0,path:0,next:null,alive:true,phase:Math.random()*6.28,shot:0}}
function build(g,round=1,retain=false){let s=world(g),index=(round-1)%levels.length;s.map=g.cfg.proceduralMaps===false?levels[index].map(r=>r.slice()):proceduralMap(round,Number(g.cfg.mapSeed)||0);s.floor=index;s.round=round;let cells=[];for(let y=1;y<s.map.length-1;y++)for(let x=1;x<s.map[y].length-1;x++)if(!s.map[y][x])cells.push({x,y});s.x=g.cfg.proceduralMaps===false?1.5:2.5;s.y=g.cfg.proceduralMaps===false?1.5:2.5;s.a=index===1?0:.3;s.pitch=0;s.z=0;let maxDist=-1,safe=[];for(let p of cells){let d=Math.hypot(p.x-s.x,p.y-s.y);if(d>maxDist){maxDist=d;s.exit={x:p.x+.5,y:p.y+.5}}if(d>5)safe.push(p)}s.pickups=[];s.hasKey=false;s.killCombo=0;s.comboUntil=0;s.visited=new Set();s.visited.add(Math.floor(s.x)+','+Math.floor(s.y));let pick=(t,k)=>{for(let j=0;j<40;j++){let p=safe[Math.floor(Math.random()*safe.length)];if(p&&Math.hypot(p.x-s.exit.x,p.y-s.exit.y)>1.2&&!s.pickups.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<1)){s.pickups.push({x:p.x+.5,y:p.y+.5,type:t,power:k,phase:Math.random()*6.28});break}}};for(let i=0;i<5;i++)pick('ammo',20);for(let i=0;i<3;i++)pick('health',28);for(let i=0;i<3;i++)pick('armor',25);pick('keycard',1);pick('grenade',1);s.enemies=[];let count=cl(Math.round((Number(g.cfg.enemyCount)||6)+(round-1)*1.4),2,27);for(let i=0;i<count;i++){let p=safe[Math.floor(Math.random()*safe.length)];if(!p)continue;let x=p.x+.5,y=p.y+.5;if(Math.hypot(x-s.x,y-s.y)<5||Math.hypot(x-s.exit.x,y-s.exit.y)<2)continue;if(s.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<.9))continue;s.enemies.push(enemy(s,p.x,p.y,(round%cl(+g.cfg.bossEvery||3,1,12)===0&&i===count-1)?2:i%7===0?3:i%4===0?1:0))}if(round%cl(+g.cfg.bossEvery||3,1,12)===0&&!s.enemies.some(e=>e.type===2)){let p=safe.find(p=>Math.hypot(p.x-s.x,p.y-s.y)>7);if(p)s.enemies.push(enemy(s,p.x,p.y,2))}s.bullets=[];s.grenadeObjects=[];s.sparks=[];s.shake=0;s.muzzle=0;s.damageFlash=0;s.exitOpen=false;s.portalTime=0;s.waveMessage=(s.mode==='arena'?'WAVE ':'SECTOR ')+round+' · ELIMINATE HOSTILES';s.waveUntil=g.t+3;s.levelStart=g.t;s.kills=0;s.exitDelay=0;if(!retain){s.credits=0;s.grenades=cl(Number.isFinite(+g.cfg.grenadeCount)?+g.cfg.grenadeCount:3,0,30);s.damageBoost=1;s.speedBoost=1;s.upgradeLevels={};s.stamina=100;s.hp=cl(+g.cfg.initialHealth||100,25,250);s.maxHp=s.hp;s.armor=0;s.active=cl(+g.cfg.startWeapon||0,0,2);s.ammo=weapons.map(w=>w.mag);s.reserve=weapons.map(w=>w.ammo);s.weaponUnlocked=weapons.map((w,i)=>i===0||i===s.active||s.unlockAll);s.score=0}g.level=round;g.score=s.score}
function sound(s,freq=220,length=.13,shape='square',gain=.028,sweep=1){try{if(!s.audio){s.audio=new (window.AudioContext||window.webkitAudioContext)()}let a=s.audio;if(a.state==='suspended')a.resume();let o=a.createOscillator(),vol=a.createGain();o.type=shape;o.frequency.setValueAtTime(freq,a.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*sweep),a.currentTime+length);vol.gain.setValueAtTime(gain,a.currentTime);vol.gain.exponentialRampToValueAtTime(.0001,a.currentTime+length);o.connect(vol);vol.connect(a.destination);o.start();o.stop(a.currentTime+length)}catch{}}
function hurt(g,n){let s=world(g);if(s.invulnerable)return;let shield=Math.min(s.armor,n*.55);s.armor-=shield;s.hp-=n-shield;s.damageFlash=.45;s.shake=.22;sound(s,100,.22,'sawtooth',.05,.35);if(s.hp<=0){s.hp=0;U.end(false,'The sector has fallen. Try again.')}}
function reload(s){const w=weapons[s.active];if(s.reload>0||s.ammo[s.active]>=w.mag||s.reserve[s.active]<=0)return;s.reload=w.reload;sound(s,300,.12,'triangle',.025,.6)}
function fire(g){let s=world(g);if(!s||g.done||s.paused||s.showShop||s.reload>0||s.fireCooldown>0)return;const wi=s.active,w=weapons[wi];if(s.ammo[wi]<=0){reload(s);return}s.ammo[wi]--;s.fireCooldown=w.rate;s.muzzle=.13;s.shake=.065;s.recoil=cl(s.recoil+.65,0,1.8);sound(s,wi===2?125:wi===1?180:240,wi===2?.21:.11,'sawtooth',.04,.24);let hit=false;for(let q=0;q<w.pellets;q++){let angle=s.a+rnd(-w.spread,w.spread);let wall=walkRay(s,s.x,s.y,angle,w.range).d;let target=null,td=wall;for(let e of s.enemies){if(!e.alive)continue;let dist=distance(e,s),ang=Math.atan2(e.y-s.y,e.x-s.x)-angle;ang=Math.atan2(Math.sin(ang),Math.cos(ang));if(dist<td&&Math.abs(ang)<(.20/(dist+.15)+.025)){target=e;td=dist}}if(target){let damage=w.damage*(wi===2?1:1+(Math.random()-.5)*.16);target.hp-=damage*s.damageBoost;target.hit=.18;s.hitmarker=.2;hit=true;if(target.hp<=0){target.alive=false;s.kills++;s.killCombo=(s.comboUntil>s.t?s.killCombo+1:1);s.comboUntil=s.t+5;s.credits+=target.type===2?180:target.type===3?75:target.type===1?55:45;s.score+=target.type===2?400:target.type===3?175:target.type===1?120:90;g.score=s.score;sound(s,520,.18,'triangle',.04,.6);for(let i=0;i<13;i++)s.sparks.push({x:target.x,y:target.y,vx:rnd(-2,2),vy:rnd(-2,2),life:rnd(.18,.7)})}}}if(hit)s.hitflash=.2;else s.hitflash=0}
function update(g,dt){let s=world(g);if(!s||s.paused||s.showShop)return;s.t+=dt;s.fireCooldown=Math.max(0,s.fireCooldown-dt);let wasReloading=s.reload>0;s.reload=Math.max(0,s.reload-dt);s.muzzle=Math.max(0,s.muzzle-dt);s.shake=Math.max(0,s.shake-dt);s.damageFlash=Math.max(0,s.damageFlash-dt);s.hitmarker=Math.max(0,s.hitmarker-dt);s.hitflash=Math.max(0,s.hitflash-dt);s.recoil=Math.max(0,s.recoil-dt*2.6);if(wasReloading&&s.reload===0){let w=weapons[s.active],n=Math.min(w.mag-s.ammo[s.active],s.reserve[s.active]);s.ammo[s.active]+=n;s.reserve[s.active]-=n;sound(s,460,.10,'triangle',.02,1.2)}
let turn=(g.keys.arrowright?1:0)-(g.keys.arrowleft?1:0);s.a+=turn*dt*2.4;let v=(g.keys.w||g.keys.arrowup?1:0)-(g.keys.s||g.keys.arrowdown?1:0),h=(g.keys.d?1:0)-(g.keys.a?1:0);v+=(g.touch.y<0?1:0)-(g.touch.y>0?1:0);h+=g.touch.x;let m=Math.hypot(v,h)||1;let pace=Number(g.cfg.speed)||1;let running=g.keys.shift&&s.stamina>1&&(v||h);if(running)s.stamina=Math.max(0,s.stamina-26*dt);let spd=(running?4.65:3.02)*pace*(s.speedBoost||1)*dt;slide(s,s,(Math.cos(s.a)*v-Math.sin(s.a)*h)*spd/m,(Math.sin(s.a)*v+Math.cos(s.a)*h)*spd/m,.18);s.walk+=(Math.abs(v)+Math.abs(h)>0?dt*10:0);s.stamina=Math.min(100,s.stamina+dt*((Math.abs(v)+Math.abs(h))&&g.keys.shift?0:18));s.visited.add(Math.floor(s.x)+','+Math.floor(s.y));if((g.keys[' ']||g.touch.a||g.pointer.down)&&s.t>s.ignoreFire)fire(g);
for(let p of s.pickups.slice()){if(distance(p,s)<.55){s.pickups.splice(s.pickups.indexOf(p),1);if(p.type==='health')s.hp=Math.min(s.maxHp,s.hp+p.power);if(p.type==='armor')s.armor=Math.min(100,s.armor+p.power);if(p.type==='ammo')for(let i=0;i<weapons.length;i++)s.reserve[i]+=Math.round(p.power*(i===1||i===3?2:i===2?.6:1));if(p.type==='keycard')s.hasKey=true;if(p.type==='grenade')s.grenades+=p.power;s.score+=25;g.score=s.score;U.notify((p.type==='health'?'MEDKIT':p.type==='armor'?'ARMOR':p.type==='keycard'?'ACCESS KEYCARD':p.type==='grenade'?'GRENADES':'AMMUNITION')+' ACQUIRED',1.4);sound(s,690,.18,'sine',.04,1.5)}}
let playerCellX=Math.floor(s.x),playerCellY=Math.floor(s.y);for(let e of s.enemies){if(!e.alive)continue;e.phase+=dt*3;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;e.path-=dt;let dist=distance(e,s);if(dist<11&&dist>.60){if(e.path<=0){e.next=path(s,s.x,s.y,e.x,e.y);e.path=.6+rnd(0,.25)}let goal=e.next||s;if(e.next&&Math.hypot(e.x-goal.x,e.y-goal.y)<.19)goal=s;let dir=Math.atan2(goal.y-e.y,goal.x-e.x),rate=e.speed*dt;slide(s,e,Math.cos(dir)*rate,Math.sin(dir)*rate,.21)}if(dist<.82&&e.attack<=0){e.attack=e.type===2?1.2:1.05;hurt(g,(e.type===2?21:e.type===1?10:14)*s.tough)}else if((e.type===2||e.type===3)&&dist<(e.type===3?10:8)&&e.attack<=0&&walkRay(s,e.x,e.y,Math.atan2(s.y-e.y,s.x-e.x),dist+.1).d>=dist-.2){e.attack=e.type===3?2.0:1.5;s.bullets.push({x:e.x,y:e.y,vx:(s.x-e.x)/dist*3.3,vy:(s.y-e.y)/dist*3.3,life:3})}}
for(let b of s.bullets.slice()){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(cell(s,b.x,b.y)||b.life<0){s.bullets.splice(s.bullets.indexOf(b),1);continue}if(distance(b,s)<.4){hurt(g,19*s.tough);s.bullets.splice(s.bullets.indexOf(b),1)}}
if(!s.enemies.some(e=>e.alive)&&!s.exitOpen){s.exitOpen=true;U.notify(s.mode==='arena'?'WAVE CLEARED · PREPARE FOR NEXT WAVE':'SECTOR CLEARED · RETRIEVE KEYCARD AND EXTRACT',3);sound(s,880,.6,'sine',.05,1.2);if(s.mode==='arena')s.portalTime=g.t+2.3}if(s.mode==='arena'&&s.exitOpen&&g.t>=s.portalTime){let oldhp=s.hp,oldarm=s.armor,oldammo=s.ammo.slice(),oldreserve=s.reserve.slice(),oldunlock=s.weaponUnlocked.slice();build(g,s.round+1,true);s.hp=Math.min(s.maxHp,oldhp+18);s.armor=Math.min(100,oldarm+12);s.reserve=oldreserve.map((v,i)=>v+(i===1?32:14));s.ammo=oldammo;s.weaponUnlocked=oldunlock;if(s.round===2)s.weaponUnlocked[1]=true;if(s.round===3)s.weaponUnlocked[2]=true;if(s.round===4)s.weaponUnlocked[3]=true;if(s.round===5)s.weaponUnlocked[4]=true;U.notify('WAVE '+s.round+' · SURVIVE',3)}if(s.mode!=='arena'&&s.exitOpen&&s.hasKey&&Math.hypot(s.x-s.exit.x,s.y-s.exit.y)<.67){if(s.round>=cl(+g.cfg.levelCount||3,1,20)){U.end(true,'All '+s.round+' sectors secured!');return}let oldhp=s.hp,oldarm=s.armor,oldammo=s.ammo.slice(),oldreserve=s.reserve.slice(),oldunlock=s.weaponUnlocked.slice();build(g,s.round+1,true);s.hp=Math.min(s.maxHp,oldhp+22);s.armor=Math.min(100,oldarm+18);s.reserve=oldreserve.map((v,i)=>v+(i===1?36:14));s.ammo=oldammo;s.weaponUnlocked=oldunlock;if(s.round===2)s.weaponUnlocked[1]=true;if(s.round===3)s.weaponUnlocked[2]=true;if(s.round===4)s.weaponUnlocked[3]=true;if(s.round===5)s.weaponUnlocked[4]=true;U.notify('SECTOR '+s.round+' · SUPPLIES REPLENISHED',3)}
for(let n of s.grenadeObjects){n.life-=dt;n.x+=n.vx*dt;n.y+=n.vy*dt;if(cell(s,n.x,n.y)){n.life=0}if(n.life<=0){for(let e of s.enemies){if(!e.alive)continue;let d=Math.hypot(e.x-n.x,e.y-n.y);if(d<3.1){e.hp-=Math.max(0,180-d*45)*s.damageBoost;e.hit=.18;if(e.hp<=0){e.alive=false;s.kills++;s.credits+=60;s.score+=110;g.score=s.score}}}s.shake=.35;for(let j=0;j<38;j++)s.sparks.push({x:n.x,y:n.y,vx:rnd(-4,4),vy:rnd(-4,4),life:rnd(.15,.9)});sound(s,75,.5,'sawtooth',.08,.25)}}s.grenadeObjects=s.grenadeObjects.filter(n=>n.life>0);if(s.reload===0&&s.ammo[s.active]===0&&s.reserve[s.active]>0)reload(s);for(let p of s.sparks)p.life-=dt;s.sparks=s.sparks.filter(p=>p.life>0);
}
function ellipse(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
function text(c,t,x,y,size=18,color='#fff',align='left'){U.text(c,t,x,y,size,color,align)}
function drawEnemy(c,e,x,y,ww,hh,dist,s){const art=window.ArcadeWeaver?.g?.libraryImages?.enemies;if(art?.complete&&art.naturalWidth){c.save();c.globalAlpha=cl(1-dist/29,.30,1);const width=Math.max(20,ww*.70),height=Math.max(24,hh*.68);c.drawImage(art,x-width/2,y-height*.61,width,height);c.restore();if(e.hp<e.maxhp){let bar=Math.max(14,ww*.65);U.rect(c,x-bar/2,y-hh*.54-13,bar,5,'#050b1e');U.rect(c,x-bar/2,y-hh*.54-13,bar*cl(e.hp/e.maxhp,0,1),5,e.type===2?'#ff816e':'#d99cff')}return;}c.save();c.translate(x,y);let k=ww/90;c.scale(k,k);let float=Math.sin(e.phase)*2;let kind=s.enemySkin||'monster';let bright=e.hit>0?'#fff6da':e.type===2?'#ff876f':e.type===3?'#64f5e6':kind==='zombie'?'#a8dfa3':kind==='robot'?'#9fddff':kind==='alien'?'#ad92fe':e.type===1?'#ffa06a':'#ce96ff';c.shadowColor=bright;c.shadowBlur=18;c.globalAlpha=cl(1-dist/29,.28,1);ellipse(c,0,44,36,11,'#0008');c.fillStyle='#12172e';c.beginPath();c.moveTo(-20,10);c.lineTo(-30,38);c.lineTo(-18,49);c.lineTo(-6,34);c.lineTo(8,34);c.lineTo(16,49);c.lineTo(30,38);c.lineTo(20,10);c.fill();c.shadowBlur=16;ellipse(c,0,float,25,32,bright);c.shadowBlur=0;ellipse(c,0,-3+float,20,25,e.type===2?'#8c2d47':kind==='zombie'?'#4f7355':kind==='robot'?'#35596b':e.type===1?'#9c482f':'#4e3b8a');if(kind==='robot'){U.rect(c,-23,-22+float,46,27,'#758ca1',7);U.rect(c,-16,-13+float,32,10,'#24394e',3);U.rect(c,-12,-10+float,24,4,'#8fedff',2);U.rect(c,-6,12+float,12,10,'#e4f3ff',3)}if(kind==='zombie'){U.line(c,-13,-8+float,-4,-2+float,'#7da678',4);U.line(c,8,2+float,16,-4+float,'#7da678',4)}ellipse(c,-9,-8+float,6,7,'#fff1c9');ellipse(c,9,-8+float,6,7,'#fff1c9');ellipse(c,-8,-8+float,3.5,5,'#181733');ellipse(c,10,-8+float,3.5,5,'#181733');for(let i=0;i<4;i++){c.fillStyle='#fff4db';c.beginPath();c.moveTo(-12+i*8,10+float);c.lineTo(-8+i*8,18+float);c.lineTo(-4+i*8,10+float);c.fill()}c.fillStyle=bright;for(let p of [-1,1]){c.beginPath();c.moveTo(p*12,-25+float);c.lineTo(p*27,-49+float);c.lineTo(p*25,-14+float);c.fill()}if(e.hit>0){c.globalAlpha=.45;c.fillStyle='#fff';c.fillRect(-31,-38,62,75)}c.restore();if(e.hp<e.maxhp){let bar=Math.max(14,ww*.65);U.rect(c,x-bar/2,y-hh*.54-13,bar,5,'#050b1e');U.rect(c,x-bar/2,y-hh*.54-13,bar*cl(e.hp/e.maxhp,0,1),5,e.type===2?'#ff816e':'#d99cff')}}
function pickupSprite(c,o,x,y,size,s){let yb=y+Math.sin(s.t*3+o.phase)*size*.07;let col=o.type==='health'?'#ff7e87':o.type==='armor'?'#73b9ff':o.type==='keycard'?'#73ffc2':o.type==='grenade'?'#fc9a60':'#ffd073';c.save();c.shadowBlur=size*.3;c.shadowColor=col;ellipse(c,x,yb,size*.36,size*.34,col);c.shadowBlur=0;U.rect(c,x-size*.21,yb-size*.06,size*.42,size*.13,'#fff9d1');if(o.type==='health')U.rect(c,x-size*.055,yb-size*.20,size*.11,size*.4,'#fff9d1');if(o.type==='keycard'){U.rect(c,x-size*.17,yb-size*.11,size*.34,size*.22,'#10304c',3);U.rect(c,x-size*.08,yb-size*.07,size*.2,size*.04,'#96ffcf',2)}if(o.type==='grenade'){U.circle(c,x,yb,size*.12,'#143346')}if(o.type==='armor'){U.line(c,x-size*.18,yb-size*.2,x,yb+size*.23,'#f2f8ff',3);U.line(c,x,yb+size*.23,x+size*.18,yb-size*.2,'#f2f8ff',3)}c.restore()}
function drawGun(c,s){let w=weapons[s.active],x=480+Math.sin(s.walk)*3,y=515+Math.abs(Math.cos(s.walk))*3+s.recoil*32;let col=w.color;c.save();c.translate(x,y);c.scale(1.1,1.1);let shift=s.active===2?1.2:s.active===1?.92:.83;c.scale(shift,shift);c.shadowColor='#000c';c.shadowBlur=24;U.rect(c,-62,-84,124,110,'#15263e',22);U.rect(c,-52,-99,104,59,'#34455a',17);U.rect(c,-35,-108,70,65,'#18233b',13);U.rect(c,-18,-155,36,77,'#44546a',9);U.rect(c,-12,-164,24,79,'#111d32',7);U.rect(c,-40,-88,80,9,col,3);U.rect(c,-41,-65,82,7,'#a9bcd9',3);U.rect(c,-51,-16,102,33,'#20314b',9);U.rect(c,-45,4,90,27,'#172238',6);U.rect(c,-8,-189,16,35,'#0b1627',4);U.rect(c,-3,-193,6,26,col,3);for(let sign of [-1,1]){U.rect(c,sign*38-(sign===-1?17:0),-52,17,31,'#4b6481',5)}if(s.active===2){U.rect(c,-25,-184,50,18,'#333e4a',7);for(let i=0;i<5;i++)U.circle(c,-20+i*10,-175,3,'#f0aa65')}if(s.muzzle>0){let flash=s.muzzle/.13;c.globalAlpha=flash;c.shadowBlur=40;c.shadowColor='#ffe997';c.fillStyle='#ffeaa4';c.beginPath();c.moveTo(0,-220);c.lineTo(-22,-188);c.lineTo(-10,-174);c.lineTo(0,-184);c.lineTo(14,-172);c.lineTo(25,-193);c.fill()}c.restore()}
function draw(g,c){let s=world(g);if(!s)return;const w=960,h=540,p=palettes[g.cfg.theme]||palettes.neon;c.save();let jit=(Math.random()-.5)*s.shake*23,cx=480+jit;let sky=c.createLinearGradient(0,0,0,290);sky.addColorStop(0,p.sky[0]);sky.addColorStop(1,p.sky[1]);U.rect(c,0,0,960,285,sky);let floor=c.createLinearGradient(0,250,0,540);floor.addColorStop(0,p.floor[0]);floor.addColorStop(1,p.floor[1]);U.rect(c,0,270,960,270,floor);const hz=270+cl(s.pitch,-90,90)+(g.cfg.headBob===false?0:Math.sin(s.walk)*1.35);
// Perspective floor grid and horizon haze
for(let i=1;i<18;i++){let d=i*.48;let yy=hz+300/(d+.6);if(yy>540||yy<270)continue;let alpha=cl(.18-i*.008,.02,.2);U.line(c,0,yy,960,yy,'rgba(197,227,248,'+alpha+')',1)}
const cols=480,step=w/cols,depth=new Float32Array(cols),fov=cl(Number(g.cfg.fov)||75,50,105)*PI/180,dirX=Math.cos(s.a),dirY=Math.sin(s.a),planeX=-dirY*Math.tan(fov/2),planeY=dirX*Math.tan(fov/2);let walltop=new Float32Array(cols);for(let i=0;i<cols;i++){let camera=2*(i+.5)/cols-1,ray=Math.atan2(dirY+planeY*camera,dirX+planeX*camera),hit=walkRay(s,s.x,s.y,ray,24),perp=hit.d*Math.cos(ray-s.a),d=cl(perp,.06,40);depth[i]=d;let ht=Math.min(2400,560/d),y=hz-ht*.5,tex=hit.tex;walltop[i]=y;let shade=cl(1/(1+d*.105),.18,.96)*(hit.side?.78:1);let base=p.wall[hit.side?1:0];const r=parseInt(base.slice(1,3),16),gg=parseInt(base.slice(3,5),16),b=parseInt(base.slice(5,7),16);const channel=n=>Math.round(n*shade);c.fillStyle=`rgb(${channel(r)},${channel(gg)},${channel(b)})`;c.fillRect(i*step-1,y,step+1,ht);
 const tx=material(g.cfg.theme||'neon',pickMaterial(Math.floor(hit.x),Math.floor(hit.y),hit.side));
 c.globalAlpha=cl(1-d/31,.20,.89);
 c.drawImage(tx,Math.min(127,Math.floor(tex*127)),0,1,128,i*step-1,y,step+1,ht);
 c.globalAlpha=1;
 c.fillStyle=`rgba(0,0,0,${cl((d-2)/29,0,.50)+(hit.side?.12:0)})`;c.fillRect(i*step-1,y,step+1,ht);

if(tex<.018||tex>.982){c.fillStyle='rgba(0,0,0,.16)';c.fillRect(i*step,y,step+1,ht)}if(ht<500){let shadow=c.createLinearGradient(0,y+ht,0,y+ht+18);shadow.addColorStop(0,'#01071065');shadow.addColorStop(1,'#01071000');c.fillStyle=shadow;c.fillRect(i*step,y+ht,step+1,18)}}
// Billboards depth-tested against the actual wall z buffer
let objects=[...s.enemies.filter(e=>e.alive).map(e=>({kind:'enemy',e,x:e.x,y:e.y})),...s.pickups.map(o=>({kind:'pickup',o,x:o.x,y:o.y})),...s.bullets.map(o=>({kind:'bullet',o,x:o.x,y:o.y})),...s.grenadeObjects.map(o=>({kind:'grenade',o,x:o.x,y:o.y})),...(s.exitOpen&&s.mode!=='arena'?[{kind:'exit',x:s.exit.x,y:s.exit.y}]:[])].map(o=>({...o,dist:Math.hypot(o.x-s.x,o.y-s.y)})).sort((a,b)=>b.dist-a.dist);for(let o of objects){let dx=o.x-s.x,dy=o.y-s.y,transformX=(dirX*dy-dirY*dx)/Math.tan(fov/2),transformY=dirX*dx+dirY*dy;if(transformY<.15)continue;let screen=480*(1+transformX/transformY),sz=cl(410/transformY,3,980),height=o.kind==='enemy'?sz*1.4:o.kind==='exit'?sz*1.2:sz*.5,y=hz+(o.kind==='enemy'?-sz*.03:o.kind==='exit'?0:sz*.2);let l=cl(Math.floor((screen-sz*.48)/step),0,cols-1),r=cl(Math.ceil((screen+sz*.48)/step),0,cols-1);if(l>r)continue;let visible=false;for(let i=l;i<=r;i+=Math.max(1,Math.floor((r-l)/6))){if(depth[i]+.1>transformY){visible=true;break}}if(!visible)continue;c.save();c.beginPath();for(let i=l;i<=r;i++){if(depth[i]+.1>transformY)c.rect(i*step,0,step+.2,540)}c.clip();if(o.kind==='enemy')drawEnemy(c,o.e,screen,y,sz,height,transformY,s);else if(o.kind==='pickup')pickupSprite(c,o.o,screen,y,sz,s);else if(o.kind==='grenade'){c.save();c.shadowColor='#ffad51';c.shadowBlur=18;U.circle(c,screen,y,Math.max(7,sz*.08),'#ffb14f');c.restore()}else if(o.kind==='bullet'){c.shadowBlur=24;c.shadowColor='#ff7e6e';U.circle(c,screen,y,Math.max(3,sz*.08),'#ff9372');c.shadowBlur=0}else{c.save();c.shadowBlur=35;c.shadowColor=p.light;U.rect(c,screen-sz*.23,y-sz*.65,sz*.46,sz*1.2,'#45e8c047',8);U.rect(c,screen-sz*.13,y-sz*.55,sz*.26,sz,'#d8ffb7a6',5);c.restore()}c.restore()}
// cinematic edge lighting and game interface
let vignette=c.createRadialGradient(480,255,90,480,270,610);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#000b');U.rect(c,0,0,960,540,vignette);if(s.damageFlash>0)U.rect(c,0,0,960,540,`rgba(255,32,54,${s.damageFlash*.34})`);
let crosscol=s.hitmarker>0?'#ffeb8a':'#eefcff';let spread=8+s.recoil*8;if(g.cfg.showCrosshair!==false){U.line(c,480-spread-11,270,480-spread,270,crosscol,2);U.line(c,480+spread,270,480+spread+11,270,crosscol,2);U.line(c,480,270-spread-11,480,270-spread,crosscol,2);U.line(c,480,270+spread,480,270+spread+11,crosscol,2);}if(s.hitmarker>0){for(let ax of [-1,1])for(let ay of [-1,1])U.line(c,480+ax*12,270+ay*12,480+ax*20,270+ay*20,'#ffdc81',3)}drawGun(c,s);
// HUD
U.panel(c,18,16,225,76,'#071627d9');text(c,'VITALS',31,33,11,'#91b1c8');text(c,String(Math.ceil(s.hp)).padStart(3,'0'),32,64,28,s.hp<25?'#ff8c9e':'#e4f7ff');text(c,'HEALTH',92,60,10,'#a5d4e6');U.rect(c,94,70,119,7,'#39445c',4);U.rect(c,94,70,119*s.hp/s.maxHp,7,s.hp<25?'#ff607c':'#69edb6',4);text(c,'SHIELD '+Math.floor(s.armor)+'  ·  STAMINA '+Math.floor(s.stamina),31,85,10,'#8bcbff');U.panel(c,668,16,273,77,'#071627d9');text(c,(s.mode==='arena'?'WAVE '+s.round:'SECTOR '+s.round+' / '+cl(+g.cfg.levelCount||3,1,20)),682,34,13,'#b7d7e8');text(c,'HOSTILES '+s.enemies.filter(e=>e.alive).length,682,55,16,s.exitOpen?'#7fffc4':'#fff1be');text(c,'SCORE '+s.score+'  ·  $'+s.credits,930,80,12,'#c7f7ed','right');
U.panel(c,680,440,260,82,'#061528e0');text(c,weapons[s.active].name,696,457,13,weapons[s.active].color);text(c,s.reload>0?'RELOADING':String(s.ammo[s.active]).padStart(2,'0')+' / '+s.reserve[s.active],698,492,24,'#fff');text(c,'G · '+s.grenades+' GRENADES    U · UPGRADES',925,512,11,'#97b6c9','right');
// minimap
if(s.showMap){let mapSize=6.2,xx=18,yy=110;U.panel(c,xx-7,yy-7,s.map[0].length*mapSize+14,s.map.length*mapSize+28,'#07172ce7');for(let row=0;row<s.map.length;row++)for(let co=0;co<s.map[row].length;co++){let revealed=!g.cfg.fogMap||s.visited.has(co+','+row)||Math.abs(co-Math.floor(s.x))+Math.abs(row-Math.floor(s.y))<3;U.rect(c,xx+co*mapSize,yy+row*mapSize,mapSize-.5,mapSize-.5,revealed?(s.map[row][co]?'#52667e':'#142a42'):'#071322')}for(let e of s.enemies.filter(e=>e.alive))U.circle(c,xx+e.x*mapSize,yy+e.y*mapSize,2.8,e.type===2?'#ffdd7b':'#f78b93');for(let p1 of s.pickups)U.circle(c,xx+p1.x*mapSize,yy+p1.y*mapSize,2,'#b4fbdc');if(s.exitOpen)U.circle(c,xx+s.exit.x*mapSize,yy+s.exit.y*mapSize,4,'#4fffb5');U.circle(c,xx+s.x*mapSize,yy+s.y*mapSize,4,'#eaffff');U.line(c,xx+s.x*mapSize,yy+s.y*mapSize,xx+(s.x+Math.cos(s.a)*1.4)*mapSize,yy+(s.y+Math.sin(s.a)*1.4)*mapSize,'#ffffff',2);text(c,'M · MAP',xx+5,yy+s.map.length*mapSize+9,10,'#b5d0eb')}
text(c,s.mode==='arena'?'SURVIVE · ELIMINATE WAVE':!s.exitOpen?'OBJECTIVE · ELIMINATE HOSTILES':!s.hasKey?'OBJECTIVE · FIND ACCESS KEYCARD':'OBJECTIVE · REACH EXTRACTION',480,22,13,'#a4f7df','center');if(g.t<s.waveUntil){U.panel(c,276,104,408,66,'#051933df');text(c,s.waveMessage,480,134,21,'#c1f7ff','center')}
if(s.showShop){U.rect(c,0,0,960,540,'#02091ed6');U.panel(c,216,63,528,412,'#0b1c35fa');text(c,'FIELD UPGRADE TERMINAL',480,106,24,'#adf6ff','center');text(c,'Credits: '+s.credits+'   •   U to close',480,144,17,'#c5ddeb','center');for(let i=0;i<upgrades.length;i++){let z=upgrades[i],cost=z[2]+(s.upgradeLevels[z[0]]||0)*70,yy=188+i*42;U.rect(c,244,yy-13,474,35,i%2?'#122b42':'#17334b',7);text(c,(i+1)+'. '+z[1],259,yy+5,16,'#f2f7ff');text(c,cost+' CR',691,yy+5,14,cost>s.credits?'#ffa7a1':'#aaf7c7','right')}}
if(s.paused){U.rect(c,0,0,960,540,'#010513b9');U.panel(c,307,167,346,185,'#071d36');text(c,'PAUSED',480,220,35,'#c9f8ff','center');text(c,'P to resume',480,265,16,'#c9d9e7','center');text(c,'Mouse: look / click: fire',480,304,15,'#c9d9e7','center')}
text(c,'WASD move · Mouse look · Shoot · Shift sprint · R reload · 1–5 weapons · G grenade · U upgrades · M map · P pause',480,528,10,'#daeeff','center',500);
c.restore()}
function throwGrenade(g){const s=world(g);if(!s||s.paused||s.grenades<=0)return;s.grenades--;s.grenadeObjects.push({x:s.x+Math.cos(s.a)*.5,y:s.y+Math.sin(s.a)*.5,vx:Math.cos(s.a)*3.7,vy:Math.sin(s.a)*3.7,life:1.25});sound(s,250,.12,'triangle',.04,.45);U.notify('GRENADE OUT',.8)}
const upgrades=[['health','Reinforced armor',110],['heal','Emergency medkit',70],['ammo','Ammunition cache',85],['power','Weapon damage +15%',170],['speed','Mobility upgrade',150],['grenade','Grenade bundle',80]];
function shop(g,index){const s=world(g),item=upgrades[index];if(!item)return;const [id,name,base]=item,level=s.upgradeLevels[id]||0,cost=base+level*70;if(s.credits<cost){U.notify('NEED '+cost+' CREDITS',1.4);return}s.credits-=cost;s.upgradeLevels[id]=level+1;
 if(id==='health'){s.maxHp+=20;s.hp=Math.min(s.maxHp,s.hp+20);s.armor=Math.min(150,s.armor+30)}
 if(id==='heal')s.hp=Math.min(s.maxHp,s.hp+65);
 if(id==='ammo')for(let i=0;i<weapons.length;i++)s.reserve[i]+=weapons[i].mag*2;
 if(id==='power')s.damageBoost=Math.min(3,s.damageBoost+.15);
 if(id==='speed')s.speedBoost=Math.min(1.8,s.speedBoost+.1);
 if(id==='grenade')s.grenades+=3;
 sound(s,640,.15,'sine',.04,1.7);U.notify('UPGRADED: '+name,2)}
function key(g,k){let s=world(g);if(!s)return;if(k==='r'){reload(s);return}if(k==='g'){throwGrenade(g);return}if(k==='u'){s.showShop=!s.showShop;return}if(s.showShop&&/^[1-6]$/.test(k)){shop(g,Number(k)-1);return}if(k==='m'){s.showMap=!s.showMap;return}if(k==='p'||k==='escape'){s.paused=!s.paused;return}if(k==='q'){for(let n=1;n<=weapons.length;n++){let i=(s.active+n)%weapons.length;if(s.weaponUnlocked[i]){s.active=i;s.reload=0;break}}return}if(['1','2','3','4','5'].includes(k)){let i=+k-1;if(s.weaponUnlocked[i]&&i!==s.active){s.active=i;s.reload=0;s.fireCooldown=.15;sound(s,420,.1,'triangle',.02)}}}
function tap(g,x,y){let s=world(g);if(!s)return;if(s.paused){s.paused=false;return}if('ontouchstart'in window||navigator.maxTouchPoints>0){if(x<85&&y<88){s.showMap=!s.showMap;return}}fire(g)}
function init(g){
  const s={map:[],x:1.5,y:1.5,a:0,pitch:0,round:1,t:0,fireCooldown:0,reload:0,muzzle:0,damageFlash:0,shake:0,walk:0,recoil:0,hitmarker:0,hitflash:0,paused:false,showShop:false,grenadeObjects:[],grenades:3,credits:0,upgradeLevels:{},damageBoost:1,speedBoost:1,stamina:100,hasKey:false,visited:new Set(),mode:g.cfg.fpsMode||'campaign',enemySkin:g.cfg.enemySkin||'monster',showMap:g.cfg.showMap!==false,ignoreFire:.28,active:0,maxHp:100,hp:100,armor:0,ammo:[],reserve:[],weaponUnlocked:[],enemySpeed:cl(+g.cfg.enemySpeed||1,.35,3),tough:cl(+g.cfg.difficulty||1,.5,3.5),unlockAll:/all|unlimited|every weapon/i.test(g.cfg.weaponOption||''),invulnerable:!!g.cfg.invulnerable,bullets:[],sparks:[],pickups:[],enemies:[],score:0,exitOpen:false,waveUntil:0};
  g.data.fp=s;
  build(g,1);
  const canvas=document.getElementById('game');
  canvas.style.cursor='crosshair';
  if(!window.__AW_FPS_LISTENERS){
    window.__AW_FPS_LISTENERS=true;
    document.addEventListener('mousemove',e=>{
      const st=window.ArcadeWeaver.g.data.fp;
      if(!st||st.paused)return;
      if(document.pointerLockElement===canvas){
        st.a+=e.movementX*.0025;
        st.pitch=cl(st.pitch+e.movementY*.12,-90,90);
      }
    });
    canvas.addEventListener('click',()=>{
      if(!('ontouchstart' in window)&&!document.pointerLockElement&&canvas.requestPointerLock){
        canvas.requestPointerLock().catch(()=>{});
      }
    });
    let touching=null;
    canvas.addEventListener('touchstart',e=>{
      for(const t of e.changedTouches){
        if(t.clientX>innerWidth*.35)touching={id:t.identifier,x:t.clientX,y:t.clientY};
      }
    },{passive:true});
    canvas.addEventListener('touchmove',e=>{
      const st=window.ArcadeWeaver.g.data.fp;
      if(!st||!touching)return;
      for(const t of e.changedTouches){
        if(t.identifier!==touching.id)continue;
        st.a+=(t.clientX-touching.x)*.008;
        st.pitch=cl(st.pitch+(t.clientY-touching.y)*.23,-90,90);
        touching.x=t.clientX;
        touching.y=t.clientY;
      }
    },{passive:true});
    canvas.addEventListener('touchend',e=>{
      for(const t of e.changedTouches){
        if(t.identifier===touching?.id)touching=null;
      }
    },{passive:true});
  }
}
register('fps',{name:'First-Person Shooter',controls:'',init,update,draw,key,tap});
})();
