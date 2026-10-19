/* ArcadeWeaver — Falling Ball: independent survival game with swept collision. */
(()=>{'use strict';
const {register,U}=window.ArcadeWeaver;const {clamp,rnd,rect,circle,line,text,panel,shadow,particle}=U;
const HEIGHT=540,WIDTH=960,LEFT=132,RIGHT=828,BALL_Y=212;
const lerp=(a,b,t)=>a+(b-a)*t;
function newGate(s,y){const width=clamp(218-s.elapsed*1.0,122,218),maxShift=clamp(146+s.elapsed*.65,146,195);
const next=clamp(s.lastGap+rnd(-maxShift,maxShift),LEFT+width*.5+25,RIGHT-width*.5-25);
s.lastGap=next;return{y,prevY:y,gapX:next,gapW:width,thick:22,style:Math.floor(Math.random()*4),col:Math.random()>.5?'#40d9dd':'#a67cff',scored:false};}
function init(g){const s={x:WIDTH/2,prevX:WIDTH/2,vx:0,r:18,elapsed:0,fallDistance:0,travelSpeed:128,gates:[],lastGap:WIDTH/2,spawnY:580,gatesPassed:0,phase:Math.random()*6,flash:0,smoke:[],best:0};
try{s.best=Number(localStorage.getItem('arcadeweaver.falling.best')||0)||0}catch(_){};
for(let y=575;y<1900;y+=190){s.gates.push(newGate(s,y));s.spawnY=y+190}g.data.falling=s;g.score=0;}
function circleRect(cx,cy,r,x,y,w,h){const tx=clamp(cx,x,x+w),ty=clamp(cy,y,y+h);return (cx-tx)**2+(cy-ty)**2<r*r;}
function collideSweep(s,gate){const top=gate.y,bottom=top+gate.thick,oldTop=gate.prevY;
// If the wall traveled across the ball's vertical span, check both sides of the opening.
if(Math.min(oldTop,top)>BALL_Y+s.r||Math.max(oldTop+gate.thick,bottom)<BALL_Y-s.r)return false;
const lx=LEFT,rx=gate.gapX-gate.gapW/2,r2=gate.gapX+gate.gapW/2;
// Interpolate the ball's movement during the same time step to avoid tunnelling.
for(let n=0;n<=4;n++){let x=lerp(s.prevX,s.x,n/4),y=lerp(oldTop,top,n/4);
if(circleRect(x,BALL_Y,s.r,lx,y,Math.max(0,rx-lx),gate.thick)||circleRect(x,BALL_Y,s.r,r2,y,Math.max(0,RIGHT-r2),gate.thick))return true;}
return false;}
function hit(g,s,msg){U.particle(s.x,BALL_Y,'#ffd17e',36);try{localStorage.setItem('arcadeweaver.falling.best',String(Math.max(s.best,s.elapsed)))}catch(_){}U.end(false,msg||`You lasted ${s.elapsed.toFixed(1)} seconds`)}
function update(g,dt){const s=g.data.falling;if(!s||g.done)return;
const speedFactor=clamp(g.cfg?.speed||1,.55,2.8),difficulty=clamp(g.cfg?.difficulty||1,.55,3.5);
s.elapsed+=dt;const target=(130+s.elapsed*2.35+Math.max(0,difficulty-1)*42)*speedFactor;
s.travelSpeed=clamp(target,120,405);
let ix=U.axis().x;const keyVelocity=(s.x-(s.prevX||s.x))/Math.max(dt,.001);
// Acceleration and damping make it feel like steering an object, not teleporting.
s.vx+=ix*1850*dt;s.vx*=Math.pow(ix?0.80:0.20,dt*9);s.vx=clamp(s.vx,-430,430);
s.prevX=s.x;s.x=clamp(s.x+s.vx*dt,LEFT+s.r+3,RIGHT-s.r-3);
s.fallDistance+=s.travelSpeed*dt;
for(let bar of s.gates){bar.prevY=bar.y;bar.y-=s.travelSpeed*dt;if(!bar.scored&&bar.y+bar.thick<BALL_Y-s.r){bar.scored=true;s.gatesPassed++;g.score=s.gatesPassed*100+Math.round(s.elapsed*10);U.particle(s.x,BALL_Y+42,'#73ffda',5);}}
if(s.gates.some(bar=>collideSweep(s,bar))){hit(g,s);return}
s.gates=s.gates.filter(bar=>bar.y>-65);
let highest=Math.max(600,...s.gates.map(a=>a.y));while(highest<HEIGHT+230){const spacing=clamp(195-s.elapsed*.45,152,195);highest+=spacing;s.gates.push(newGate(s,highest));}
if(s.elapsed>s.best&&Math.floor(s.elapsed)>(Math.floor(s.elapsed-dt)))s.best=s.elapsed;
s.phase+=dt*6;
if(Math.random()<dt*18)s.smoke.push({x:s.x+rnd(-9,9),y:BALL_Y-20,life:.5,w:rnd(2,6)});
s.smoke=s.smoke.filter(p=>{p.life-=dt;p.y-=s.travelSpeed*.32*dt;return p.life>0});}
function draw(g,c){const s=g.data.falling||{};const time=s.elapsed||0;
let sky=c.createLinearGradient(0,0,0,HEIGHT);sky.addColorStop(0,'#081625');sky.addColorStop(.52,'#122b4a');sky.addColorStop(1,'#0b152b');rect(c,0,0,WIDTH,HEIGHT,sky);
// Parallax shaft walls, drifting particles, and a sense of falling through space.
for(let i=0;i<13;i++){const x= (i%2===0?0:828)+((i%2===0)? 24:0), y=(i*126 - s.fallDistance*.18)%720-100;rect(c,x,y,104,14,'#8bd7ec15',4);}
rect(c,LEFT-11,0,16,HEIGHT,'#2d6589');rect(c,RIGHT-5,0,16,HEIGHT,'#2d6589');
for(let i=0;i<45;i++){let x=LEFT+16+((i*73)%((RIGHT-LEFT)-30)), y=((i*137-s.fallDistance*(.17+i%4*.07))%620+620)%620-40;circle(c,x,y,1+i%3*.5,'#88d9ff24');}
for(let y=0;y<HEIGHT;y+=30){let yy=(y-(s.fallDistance*.58)%30+30)%HEIGHT;line(c,LEFT-4,yy,LEFT+6,yy,'#59b5e52b',2);line(c,RIGHT-6,yy,RIGHT+4,yy,'#59b5e52b',2)}
for(let gate of s.gates||[]){let y=gate.y;if(y<-50||y>HEIGHT+50)continue;
const gl=gate.gapX-gate.gapW*.5,gr=gate.gapX+gate.gapW*.5;
for(let [x,w] of [[LEFT,gl-LEFT],[gr,RIGHT-gr]]){if(w<=0)continue;shadow(c,10,gate.col);rect(c,x,y,w,gate.thick,'#2c4367',4);c.shadowBlur=0;rect(c,x+1,y+1,w-2,4,gate.col,2);rect(c,x+1,y+7,w-2,7,'#091e38',1);for(let n=x+14;n<x+w-10;n+=37)rect(c,n,y+11,8,3,'#8bb2d755',2);}
rect(c,gl-6,y-4,6,gate.thick+8,gate.col,2);rect(c,gr,y-4,6,gate.thick+8,gate.col,2);
}
for(let p of s.smoke||[])circle(c,p.x,p.y,p.w*p.life,'#8bdfff55');
// Ball is fixed in camera space; rising obstacles and motion streaks show downward travel.
for(let i=0;i<5;i++){let len=12+i*10;line(c,s.x+(i-2)*5,BALL_Y-26-len,s.x+(i-2)*5,BALL_Y-25,'#7ad3ff'+['08','10','15','20','24'][i],1.5)}
shadow(c,23,'#4bcdff');circle(c,s.x,BALL_Y,s.r+4,'#3ca2d7');c.shadowBlur=0;
let grad=c.createRadialGradient(s.x-7,BALL_Y-9,1,s.x,BALL_Y,s.r);grad.addColorStop(0,'#efffff');grad.addColorStop(.4,'#9bdcff');grad.addColorStop(1,'#3272d6');circle(c,s.x,BALL_Y,s.r,grad);
circle(c,s.x-7,BALL_Y-8,4,'#ffffffbb');
panel(c,18,14,305,91,'#07192dde');text(c,'FREEFALL · SURVIVE',34,41,20,'#c3fbff');text(c,`${time.toFixed(1)}s`,35,83,34,'#ffffff');text(c,`GATES ${s.gatesPassed||0}`,186,70,15,'#bbd2df');
panel(c,719,14,224,68,'#07192dde');text(c,`BEST ${(s.best||0).toFixed(1)}s`,734,42,17,'#ffe19b');text(c,'A / D or ◀ ▶ to steer',735,65,12,'#afc8e0');
}
register('falling',{name:'Freefall · Endless Ball',controls:'Move ◀ ▶ or A/D • Survive gaps • R restarts',init,update,draw});
})();
