/* ArcadeWeaver — fifteen independent game-rule families with ten selectable gameplay modes each.
 * Mode variants change controls, objectives, hazards, tempo or lives and are intentionally
 * called variants, not independent programming engines. Fully offline and exportable. */
(()=>{'use strict'; const A=window.ArcadeWeaver; if(!A)return; const U=A.U;
const {rect,circle,line,text,clamp,ri,rnd,panel,bg,orb}=U;
const W=960,H=540;
const modes=[
 ['classic','Classic'],['turbo','Turbo'],['precision','Precision'],['survival','Survival'],
 ['reverse','Reverse'],['chaos','Chaos'],['marathon','Marathon'],['night','Night'],
 ['hardcore','Hardcore'],['zen','Zen']];
const defs=[
 ['orbit','Orbit Guardian','Steer a moon around its planet, harvest stars and dodge debris','orbit guardian|orbital game|orbit collector|space orbit','space'],
 ['laserguard','Laser Defense','Aim and blast incoming targets before the fortress is hit','laser defense|laser defender|turret aim|defend with laser','neon'],
 ['lanes','Lane Shift','Dodge highway hazards across five changing lanes','lane shift|lane dodger|traffic lane|lane switch','city'],
 ['stacktower','Tower Stack','Drop moving building pieces and build the tallest tower','tower stack|stack the tower|stacking tower|stack blocks timing','city'],
 ['missile','Missile Shield','Tap to intercept missiles with expanding defensive blasts','missile shield|missile command|missile interception|missile defender','space'],
 ['pipes','Pipeworks','Rotate pipes to connect water across the puzzle board','pipeworks|pipe puzzle|connect pipes|water pipe|plumber puzzle','ocean'],
 ['glider','Sky Glide','Tap and steer a glider through shifting flight gates','sky glide|glider gate|flappy glider|air corridor','space'],
 ['netcatch','Net Catch','Sweep a fishing net through schools of fish, avoid trash','net catch|fishing net|catch fish net|fish catcher','ocean'],
 ['whack','Whack Garden','Catch popping garden critters without striking bombs','whack garden|whack a mole|whack mole|tap critters','forest'],
 ['icepath','Ice Slide','Slide across icy tiles to retrieve crystals and reach the portal','ice slide|ice maze|ice sliding puzzle|slide on ice','pastel'],
 ['slingshot','Slingshot Siege','Launch stones at moving targets using gravity','slingshot siege|catapult target|sling shot|projectile physics','desert'],
 ['sumhunt','Sum Hunt','Find adjacent pairs adding to the target number','sum hunt|number pair|sum puzzle|add numbers pair','pastel'],
 ['pulsebeat','Pulse Rhythm','Hit four beat lanes when notes reach the pulse line','pulse rhythm|beat lanes|tap rhythm pulse|rhythm pulse','neon'],
 ['mirrors','Mirror Beam','Rotate reflectors to direct a beam toward the reactor','mirror beam|laser mirror|reflect light puzzle|mirror laser','neon'],
 ['treasure','Treasure Radar','Sweep the map with sonar and uncover hidden treasure','treasure radar|sonar treasure|treasure hunter radar|radar hunt','ocean']
];
const R=(x,y,w,h,c)=>rect(A.g.c,x,y,w,h,c);
const col=['#76e9d0','#ffd36c','#ff7897','#9b9afa','#80cbff'];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function settings(mode){return{mode,tempo:mode===1?1.65:mode===5?1.4:mode===8?1.4:mode===9?.72:1,
 lives:mode===8?1:mode===3?5:3,goal:mode===6?30:mode===9?18:12,duration:mode===6?110:mode===9?180:65,
 reverse:mode===4,chaos:mode===5,precision:mode===2,night:mode===7,zen:mode===9};}
function world(g,name,mode){let opts=settings(mode);g.data={opts,mode,name,clock:0,next:0,streak:0,points:0,seed:Math.random()*1e6,player:{x:480,y:370},things:[],hazards:[],lastMove:0,scene:0};g.lives=opts.lives;g.score=0;g.level=1;}
function increment(g,n=1){g.score+=n;g.data.points+=n;g.data.streak++;if(g.data.points>=g.data.opts.goal&&![0,1,2,4,5,6,7,10,12,13,14].includes(g.data.name))U.end(true,'Challenge cleared!');}
function hit(g,s='Collision!'){g.lives--;g.data.streak=0;U.particle(g.data.player.x,g.data.player.y,'#ff7a88',15);if(g.lives<=0)U.end(false,s);}
function horizon(g,c,type='arena'){bg(c,type);if(g.data.opts.night)R(0,0,W,H,'#020b22b5')}
function header(g,c,extra=''){panel(c,14,12,315,53,'#102541de');text(c,defs[g.data.name][1].toUpperCase()+' • '+modes[g.data.mode][1].toUpperCase(),30,32,17,'#e5f7ff');text(c,`Score ${Math.round(g.score)}   ♥ ${g.lives}   ${extra}`,30,53,13,'#8de8d6', 'left',600)}
const act=g=>U.action();
const axis=(g,dir)=>g.data.opts.reverse?-dir:dir;
function doMove(g,dx,dy,spd=220){g.data.player.x=clamp(g.data.player.x+axis(g,dx)*spd*g.dt,20,940);g.data.player.y=clamp(g.data.player.y+axis(g,dy)*spd*g.dt,70,500)}
function queue(g,t){g.data.things.push(t)}
function initFamily(g,family,mode){world(g,family,mode);let d=g.data;
 if(family===0){d.player.a=0;d.star={a:2};for(let j=0;j<3+(d.opts.chaos?4:0);j++)queue(g,{a:Math.random()*6.28,spd:rnd(.35,1.3)*(j%2?1:-1)})}
 if(family===1){d.player.x=480;d.player.y=482;}
 if(family===2){d.player.lane=2;d.player.x=480;d.lastMove=0;}
 if(family===3){d.width=160;d.offset=0;d.direction=1;d.height=0;}
 if(family===4){d.next=.2;d.cities=4;}
 if(family===5){setupPipePuzzle(d);}
 if(family===6){d.player.y=245;d.player.x=240;d.vel=0;}
 if(family===7){d.player.y=270;d.player.x=470;}
 if(family===8){d.holes=Array(9).fill(null);d.next=.3;}
 if(family===9){d.grid=Array.from({length:12},(_,y)=>Array.from({length:18},(_,x)=> (y===0||y===11||x===0||x===17||Math.random()<.1)?1:0)); d.player={x:2,y:2};d.grid[2][2]=0;d.gem={x:15,y:8};d.grid[8][15]=0;d.cool=0;}
 if(family===10){d.player={x:115,y:430};d.targets=Array.from({length:4},(_,i)=>({x:600+i*70,y:310-i*55,r:25}));d.balls=[];}
 if(family===11){d.board=Array.from({length:6},()=>Array.from({length:8},()=>ri(1,9)));d.target=10+mode%5;d.selected=null;}
 if(family===12){d.things=[];d.next=.2;d.combo=0;}
 if(family===13){setupMirrorPuzzle(d);}
 if(family===14){d.treasures=Array.from({length:8+(d.opts.chaos?5:0)},()=>({x:rnd(70,890),y:rnd(100,485),found:false}));d.player={x:480,y:275};d.scan=0;}
}
// Pipeworks: construct a guaranteed-connected route, then rotate it out of alignment.
// This yields different topologies rather than a permanently horizontal centre row.
const pipeSignaturesSeen=new Set();
function setupPipePuzzle(d){
 const width=7,height=6,route=[{x:0,y:2}];let y=2;
 const yTargets=[];
 for(let x=0;x<width;x++){
   let target=x===width-1?2:clamp(y+ri(-2,2),1,4);
   if(x===0&&target===2)target=ri(0,1)?3:1;
   yTargets.push(target);
   while(y!==target){y+=Math.sign(target-y);route.push({x,y})}
   if(x<width-1)route.push({x:x+1,y});
 }
 let signature=route.map(p=>p.x+','+p.y).join('|');
 // Repetition prevention: if this route recently appeared, resample next time.
 if(pipeSignaturesSeen.has(signature))return setupPipePuzzle(d);
 pipeSignaturesSeen.add(signature);if(pipeSignaturesSeen.size>120)pipeSignaturesSeen.clear();
 d.tiles=Array.from({length:width*height},()=>({kind:ri(0,1),rot:ri(0,3)}));
 d.pipeSolution=[];d.pipeRoute=route.map(p=>p.y*width+p.x);
 const direction=(from,to)=>to.x>from.x?1:to.x<from.x?3:to.y>from.y?2:0;
 for(let k=0;k<route.length;k++){
  const at=route[k],before=k===0?{x:-1,y:2}:route[k-1],after=k===route.length-1?{x:7,y:2}:route[k+1];
  let incoming=direction(at,before),outgoing=direction(at,after);
  const ports=[incoming,outgoing].sort((a,b)=>a-b);
  let kind,rot;
  if((incoming+2)%4===outgoing){kind=0;rot=ports.includes(0)?0:1}
  else{kind=1;rot=ports.find(dir=>ports.includes((dir+1)%4));}
  const idx=at.y*width+at.x;
  d.tiles[idx]={kind,rot:(rot+ri(1,3))%4};
  d.pipeSolution.push({idx,rot});
 }
 d.pipeLevel=(d.pipeLevel||0)+1;d.turns=0;d.solved=false;
}
function pipeEnds(t){if(t.kind===0)return t.rot%2===0?[0,2]:[1,3];return [t.rot,(t.rot+1)%4]}
function pipesConnected(d){const start=2*7,goal=2*7+6;if(!pipeEnds(d.tiles[start]).includes(3)||!pipeEnds(d.tiles[goal]).includes(1))return false;let seen=new Set([start]),stack=[start];const offs=[[-1,0],[0,1],[1,0],[0,-1]];while(stack.length){let at=stack.pop(),x=at%7,y=Math.floor(at/7);if(at===goal)return true;for(let dir of pipeEnds(d.tiles[at])){let nx=x+offs[dir][1],ny=y+offs[dir][0];if(nx<0||nx>=7||ny<0||ny>=6)continue;let next=ny*7+nx;if(!seen.has(next)&&pipeEnds(d.tiles[next]).includes((dir+2)%4)){seen.add(next);stack.push(next)}}}return false}
// Construct the desired beam path first; then derive orientations. Four turns are
// always sufficient to reach the reactor and no required mirrors share a segment.
let mirrorLayoutsSeen=new Set();let previousMirrorSignature='';
function setupMirrorPuzzle(d){
 let x1,y1,x2,y2,signature;
 for(let attempt=0;attempt<40;attempt++){
   x1=ri(190,350);x2=ri(520,700);
   y1=[140,180,225,365,410][ri(0,4)];
   y2=[120,155,245,350,400][ri(0,4)];
   signature=[x1,y1,x2,y2].join(':');
   if(y1!==y2&&y1!==300&&y2!==300&&signature!==previousMirrorSignature&&!mirrorLayoutsSeen.has(signature))break;
 }
 previousMirrorSignature=signature;mirrorLayoutsSeen.add(signature);
 if(mirrorLayoutsSeen.size>80)mirrorLayoutsSeen.clear();
 const m=[{x:x1,y:300},{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2}];
 const orient=[y1>300?0:1,y1>300?0:1,y2>y1?0:1,y2>y1?0:1];
 // Keep solution accessible for deterministic automated verification without showing it.
 d.mirrorSolution=orient.slice();
 d.mirrors=m.map((pos,i)=>({...pos,rot:1-orient[i]}));
 // Begin unsolved but with some correct mirrors, for a meaningful puzzle.
 for(let j=0;j<ri(0,2);j++){let ix=ri(0,3);d.mirrors[ix].rot=orient[ix]}
 d.target={x:845,y:y2};d.beam=false;d.rays=[];d.mirrorLevel=(d.mirrorLevel||0)+1;
 traceBeam(d);
}
function traceBeam(d){let x=65,y=300,dx=1,dy=0,segments=[];for(let step=0;step<9;step++){const aligned=d.mirrors.map((m,i)=>({...m,i,delta:dx? (m.x-x)*dx:(m.y-y)*dy})).filter(m=>m.delta>0.1&&(dx?Math.abs(m.y-y)<1:Math.abs(m.x-x)<1)).sort((a,b)=>a.delta-b.delta);let mirror=aligned[0];const distanceToTarget=dx?(d.target.x-x)*dx:(d.target.y-y)*dy;const targetAligned=dx?Math.abs(d.target.y-y)<1:Math.abs(d.target.x-x)<1;if(targetAligned&&distanceToTarget>0&&(mirror==null||distanceToTarget<mirror.delta)){segments.push([x,y,d.target.x,d.target.y]);d.rays=segments;return true}if(!mirror){segments.push([x,y,dx>0?950:10,dy>0?525:70]);break}segments.push([x,y,mirror.x,mirror.y]);x=mirror.x;y=mirror.y;const slash=mirror.rot===1;if(slash){const newx=-dy;dy=-dx;dx=newx}else{const newx=dy;dy=dx;dx=newx}}
d.rays=segments;return false}
function updateFamily(g,dt,f){const d=g.data,s=d.opts,tt=g.t;d.clock+=dt;if(!s.zen&&d.clock>s.duration){U.end(g.score>3,'Time expired');return}let speed=s.tempo;
if(f===0){d.player.a+=axis(g,(U.axis().x||0))*speed*dt*2.8;d.star.a+=.25*dt;for(const o of d.things)o.a+=o.spd*speed*dt;const pa=d.player.a;if(Math.abs(Math.atan2(Math.sin(pa-d.star.a),Math.cos(pa-d.star.a)))<.17){increment(g);d.star.a+=2.5}for(let o of d.things)if(Math.abs(Math.atan2(Math.sin(pa-o.a),Math.cos(pa-o.a)))<.085){o.a+=2;hit(g,'Orbital collision')};}
if(f===1){doMove(g,U.axis().x,0,370*speed);d.next-=dt;if(d.next<=0){queue(g,{x:rnd(35,925),y:50,vy:rnd(80,170)*speed,life:3,r:s.precision?11:17});d.next=s.chaos?.23:.52}for(const o of [...d.things]){o.y+=o.vy*dt;if(o.y>490){d.things.splice(d.things.indexOf(o),1);hit(g,'The fortress fell')}}}
if(f===2){let z=U.axis().x;if(z&&tt-d.lastMove>.13){d.player.lane=clamp(d.player.lane+axis(g,Math.sign(z)),0,4);d.lastMove=tt}d.player.x=210+d.player.lane*135;d.next-=dt;if(d.next<=0){queue(g,{lane:ri(0,4),y:-30,vy:rnd(140,230)*speed});d.next=s.chaos?.23:.51}for(const o of [...d.things]){let oldY=o.y;o.y+=o.vy*dt;if(Math.min(oldY,o.y)<=455&&Math.max(oldY,o.y)>=395&&o.lane===d.player.lane){d.things.splice(d.things.indexOf(o),1);hit(g,'Road collision')}else if(o.y>550){d.things.splice(d.things.indexOf(o),1);increment(g)}}}
if(f===3){d.offset+=d.direction*dt*310*speed;if(Math.abs(d.offset)>330)d.direction*=-1;}
if(f===4){d.next-=dt;if(d.next<=0){queue(g,{x:rnd(90,870),y:45,vy:rnd(46,105)*speed});d.next=s.chaos?.22:.48}for(const o of [...d.things]){o.y+=o.vy*dt;if(o.y>490){d.things.splice(d.things.indexOf(o),1);hit(g,'A missile hit the city')}}for(let e of [...d.hazards]){e.r+=dt*210;e.life-=dt;if(e.life<=0)d.hazards.splice(d.hazards.indexOf(e),1);else for(let o of [...d.things])if(dist(e,o)<e.r){d.things.splice(d.things.indexOf(o),1);increment(g)}}}
if(f===5){ if(d.turns>70)U.end(false,'Too many pipe rotations');}
if(f===6){d.vel+=dt*290; if(act(g))d.vel=-180*speed;d.player.y+=d.vel*dt;d.player.y=clamp(d.player.y,15,540);d.next-=dt;if(d.next<=0){queue(g,{x:1050,y:rnd(135,415),gap:s.precision?145:195});d.next=s.chaos?1.15:2.1}for(const o of [...d.things]){let oldX=o.x;o.x-=dt*220*speed;if(Math.min(oldX,o.x)<d.player.x+17&&Math.max(oldX,o.x)>d.player.x-18&&Math.abs(o.y-d.player.y)+17>o.gap/2){d.things.splice(d.things.indexOf(o),1);d.player.y=270;d.vel=0;hit(g,'Glider struck a gate')}else if(o.x<-50){d.things.splice(d.things.indexOf(o),1);increment(g)}}if(d.player.y<20||d.player.y>520){d.player.y=270;d.vel=0;hit(g,'Glider struck the edge')}}
if(f===7){doMove(g,U.axis().x,U.axis().y,240*speed);d.next-=dt;if(d.next<=0){queue(g,{x:rnd(70,900),y:rnd(90,465),r:rnd(14,23),bad:Math.random()<.22,life:6});d.next=s.chaos?.14:.31}for(const o of [...d.things]){o.life-=dt;if(o.life<=0)d.things.splice(d.things.indexOf(o),1);else if(dist(o,d.player)<27){d.things.splice(d.things.indexOf(o),1);o.bad?hit(g,'Trash caught!'):increment(g)}}}
if(f===8){d.next-=dt;if(d.next<=0){let at=ri(0,8);d.holes[at]={bad:Math.random()<(s.chaos?.34:.17),life:1.25};d.next=s.chaos?.25:.49}for(let k=0;k<9;k++)if(d.holes[k]){d.holes[k].life-=dt*speed;if(d.holes[k].life<=0)d.holes[k]=null}}
if(f===9){d.cool=Math.max(0,d.cool-dt);const a=U.axis();if(d.cool===0&&(a.x||a.y)){let dx=axis(g,a.x),dy=axis(g,a.y);if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;let x=d.player.x,y=d.player.y;while(d.grid[y+dy]?.[x+dx]===0){x+=dx;y+=dy}d.player={x,y};d.cool=.15;if(x===d.gem.x&&y===d.gem.y){increment(g);d.gem={x:ri(2,15),y:ri(2,9)};d.grid[d.gem.y][d.gem.x]=0}}}
if(f===10){for(const b of [...d.balls]){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=360*dt;for(const t of [...d.targets])if(Math.hypot(t.x-b.x,t.y-b.y)<t.r+8){d.targets.splice(d.targets.indexOf(t),1);d.balls.splice(d.balls.indexOf(b),1);increment(g);d.targets.push({x:rnd(570,890),y:rnd(185,400),r:s.precision?14:25});break}if(b.y>550)d.balls.splice(d.balls.indexOf(b),1)}}
if(f===11){} 
if(f===12){d.next-=dt;if(d.next<=0){queue(g,{lane:ri(0,3),y:-30,hit:false});d.next=s.chaos?.18:.37}for(let o of [...d.things]){o.y+=dt*240*speed;if(o.y>460){d.things.splice(d.things.indexOf(o),1);d.combo=0;hit(g,'Missed the beat')}}}
if(f===13){}
if(f===14){doMove(g,U.axis().x,U.axis().y,260*speed);d.scan=Math.max(0,d.scan-dt);for(let t of d.treasures)if(!t.found&&dist(t,d.player)<22){t.found=true;increment(g)}if(d.treasures.every(t=>t.found)){U.end(true,'All treasures discovered!')}}
}
function tapFamily(g,x,y,f){const d=g.data,s=d.opts;
if(f===1){for(const o of [...d.things])if(Math.hypot(o.x-x,o.y-y)<o.r+24){o.life--;if(o.life<=0){d.things.splice(d.things.indexOf(o),1);increment(g)}return}}
if(f===3){let overlap=d.width-Math.abs(d.offset);if(overlap<7){hit(g,'Tower collapsed!');d.width=160;d.height=0;d.offset=0}else{d.width=overlap;d.height++;d.offset=0;increment(g)}if(d.height>22)U.end(true,'Sky tower completed!')}
if(f===4){d.hazards.push({x,y,r:4,life:.46})}
if(f===5){let x0=230,y0=95,cx=Math.floor((x-x0)/70),cy=Math.floor((y-y0)/57);if(cx>=0&&cx<7&&cy>=0&&cy<6){let n=cy*7+cx;d.tiles[n].rot=(d.tiles[n].rot+1)%4;d.turns++;if(pipesConnected(d)){increment(g,5);if(d.pipeLevel>=Math.max(3,Math.min(15,Number(g.cfg.levelCount||3))))U.end(true,'All pipe puzzles connected!');else{setupPipePuzzle(d);d.clock=0;U.notify('New Pipeworks level '+d.pipeLevel,1.4)}}}}
if(f===8){let cx=Math.floor((x-267)/142),cy=Math.floor((y-112)/112);if(cx>=0&&cx<3&&cy>=0&&cy<3){let ix=cy*3+cx,h=d.holes[ix];if(h){h.bad?hit(g,'Oops, a bomb!'):increment(g);d.holes[ix]=null}}}
if(f===10){let dx=x-115,dy=y-430,len=Math.hypot(dx,dy)||1;d.balls.push({x:115,y:430,vx:dx/len*540,vy:dy/len*540});}
if(f===11){let cx=Math.floor((x-192)/72),cy=Math.floor((y-94)/60);if(cx>=0&&cx<8&&cy>=0&&cy<6){let z=d.board[cy][cx];if(d.selected){let [px,py]=d.selected;if(Math.abs(px-cx)+Math.abs(py-cy)===1&&d.board[py][px]+z===d.target){d.board[py][px]=ri(1,9);d.board[cy][cx]=ri(1,9);increment(g);d.target=10+ri(0,5)}d.selected=null}else d.selected=[cx,cy]}}
if(f===13){let v=d.mirrors.find(m=>Math.hypot(m.x-x,m.y-y)<37);if(v){v.rot=1-v.rot;d.beam=true;if(traceBeam(d)){increment(g,5);if(d.mirrorLevel>=Math.max(3,Math.min(15,Number(g.cfg.levelCount||3))))U.end(true,'All reactor puzzles solved!');else{setupMirrorPuzzle(d);U.notify('New mirror puzzle · level '+d.mirrorLevel,1.5)}}}}
if(f===14){d.scan=1.3}
}
function keyFamily(g,k,f){const d=g.data;if(f===12){let lane=['a','s','d','f'].indexOf(k);if(lane<0)return;let hitNote=d.things.find(o=>o.lane===lane&&Math.abs(o.y-444)<50);if(hitNote){d.things.splice(d.things.indexOf(hitNote),1);increment(g);d.combo++}else {d.combo=0;if(!d.opts.zen)hit(g,'Off beat')}}if(f===3&&[' ','enter'].includes(k))tapFamily(g,0,0,f);if(f===6&&k===' ')d.vel=-170*d.opts.tempo;}
function drawFamily(g,c,f){const d=g.data,s=d.opts;horizon(g,c,f===0||f===1||f===4||f===6||f===12||f===13?'space':f===7||f===14?'water':f===2||f===3?'city':'arena');
if(f===0){circle(c,480,292,115,'#355e8d');circle(c,480,292,94,'#2d446c');circle(c,480,292,42,'#54a8d6');for(let o of d.things)circle(c,480+115*Math.cos(o.a),292+115*Math.sin(o.a),12,'#fb759b');circle(c,480+115*Math.cos(d.star.a),292+115*Math.sin(d.star.a),11,'#ffe391');circle(c,480+115*Math.cos(d.player.a),292+115*Math.sin(d.player.a),17,'#7bead3');}
if(f===1){rect(c,0,493,960,47,'#335d77');rect(c,330,465,300,35,'#3578a1');circle(c,d.player.x,482,22,'#6ff4dd');for(let o of d.things){circle(c,o.x,o.y,o.r,'#ef718b');rect(c,o.x-4,o.y-7,8,13,'#ffcad8')}text(c,'Move left/right · Tap falling targets',480,92,20,'#b7e2ef','center')}
if(f===2){for(let i=0;i<5;i++){rect(c,145+i*135,85,125,440,i%2?'#233e59':'#2b4b62');line(c,275+i*135,85,275+i*135,540,'#ffffff55',3)}rect(c,d.player.x-30,402,60,65,'#70ebca',12);for(let o of d.things)rect(c,210+o.lane*135-29,o.y-23,58,48,'#ee6b8e',8)}
if(f===3){for(let i=0;i<d.height;i++)rect(c,480-(d.width+i*1.5)/2,505-i*16,d.width+i*1.5,16,col[i%5],2);rect(c,480+d.offset-d.width/2,505-d.height*16,d.width,16,'#fcd874',2);text(c,'Tap / Space to drop the moving block',480,99,19,'#e8ffff','center')}
if(f===4){for(let i=0;i<4;i++)rect(c,110+i*222,474,125,45,'#55abd1',9);for(let o of d.things){line(c,o.x,o.y,o.x-15,o.y-25,'#ffbf87',3);circle(c,o.x,o.y,8,'#ff6e8d')}for(let b of d.hazards){circle(c,b.x,b.y,b.r,'#8df4c147');circle(c,b.x,b.y,b.r*.6,'#8df4c199')}}
if(f===5){for(let y=0;y<6;y++)for(let x=0;x<7;x++){let t=d.tiles[y*7+x],xx=230+x*70,yy=95+y*57;rect(c,xx,yy,64,52,'#214e70',7);let cx=xx+32,cy=yy+26;circle(c,cx,cy,8,'#9ceaff');for(let dir of pipeEnds(t)){let vx=[0,1,0,-1][dir],vy=[-1,0,1,0][dir];line(c,cx,cy,cx+vx*24,cy+vy*23,'#83d9ee',12)}if(x===0&&y===2)circle(c,xx+3,cy,7,'#66eeac');if(x===6&&y===2)circle(c,xx+62,cy,7,'#ffe08d')}text(c,'PIPEWORKS LEVEL '+(d.pipeLevel||1)+' · rotate a connected route from green to gold',480,465,17,'#d6eef7','center')}
if(f===6){for(let o of d.things){rect(c,o.x-14,0,34,o.y-o.gap/2,'#9a607c');rect(c,o.x-14,o.y+o.gap/2,34,540-(o.y+o.gap/2),'#9a607c')}circle(c,d.player.x,d.player.y,17,'#7cead1');line(c,d.player.x-24,d.player.y,d.player.x+24,d.player.y,'#f8dc87',3)}
if(f===7){circle(c,d.player.x,d.player.y,24,'#75ddee');for(let o of d.things){circle(c,o.x,o.y,o.r,o.bad?'#f279a0':'#f5d37d');if(o.bad)line(c,o.x-7,o.y-7,o.x+7,o.y+7,'#32152f',3)}}
if(f===8){for(let i=0;i<9;i++){let x=267+(i%3)*142,y=112+Math.floor(i/3)*112;circle(c,x+54,y+48,47,'#14253f');circle(c,x+54,y+48,35,'#253d59');if(d.holes[i])circle(c,x+54,y+30,31,d.holes[i].bad?'#ed789e':'#78e0b6')}}
if(f===9){for(let y=0;y<12;y++)for(let x=0;x<18;x++){let px=138+x*38,py=56+y*38;rect(c,px,py,36,36,d.grid[y][x]?'#90d6e9':'#213a58',3)}rect(c,138+d.gem.x*38+8,56+d.gem.y*38+8,20,20,'#ffdf86',6);circle(c,138+d.player.x*38+18,56+d.player.y*38+18,15,'#7de8be')}
if(f===10){rect(c,0,468,960,72,'#a76c59');circle(c,115,430,30,'#88e4d4');for(const t of d.targets){circle(c,t.x,t.y,t.r,'#fa9a8b');circle(c,t.x,t.y,t.r*.4,'#ffe7a3')}for(const b of d.balls)circle(c,b.x,b.y,8,'#e5f8ff');line(c,115,430,d.player.x+10,405,'#eeeeffa6',2)}
if(f===11){for(let y=0;y<6;y++)for(let x=0;x<8;x++){let xx=192+x*72,yy=94+y*60;rect(c,xx,yy,65,54,d.selected&&d.selected[0]===x&&d.selected[1]===y?'#3e927c':'#203d59',9);text(c,d.board[y][x],xx+32,yy+28,24,'#ffe7a8','center')}text(c,'Find adjacent numbers totaling '+d.target,480,486,22,'#e3f6f7','center')}
if(f===12){for(let i=0;i<4;i++){rect(c,258+i*114,72,94,420,'#1c3851',9);line(c,260+i*114,446,352+i*114,446,'#7cece4',5);text(c,['A','S','D','F'][i],305+i*114,484,20,'#bdebee','center')}for(let n of d.things)rect(c,272+n.lane*114,n.y,65,23,col[n.lane],6);}
if(f===13){for(let seg of d.rays){line(c,seg[0],seg[1],seg[2],seg[3],'#ffe58d66',10);line(c,seg[0],seg[1],seg[2],seg[3],'#ffecaa',3)}for(let m of d.mirrors){circle(c,m.x,m.y,25,'#3f5574');line(c,m.x-18,m.y+(m.rot===1?18:-18),m.x+18,m.y+(m.rot===1?-18:18),'#e9fdff',6)}circle(c,d.target.x,d.target.y,24,'#85efc1');text(c,'LEVEL '+(d.mirrorLevel||1)+' · Rotate reflectors to hit the reactor',480,480,19,'#d9eeff','center')}
if(f===14){for(let j=0;j<20;j++){let x=(j*151)%960,y=(j*119)%540;circle(c,x,y,24,'#284b6a')}for(let t of d.treasures){if(t.found)circle(c,t.x,t.y,10,'#f2cf71');else if(d.scan>0&&dist(t,d.player)<210){circle(c,t.x,t.y,8,'#f7d883')}}circle(c,d.player.x,d.player.y,17,'#81edcf');if(d.scan>0){c.beginPath();c.arc(d.player.x,d.player.y,210*(1-d.scan/1.3),0,6.283);c.strokeStyle='#80e2ee99';c.lineWidth=3;c.stroke()}}
header(g,c,`Time ${Math.ceil(Math.max(0,s.duration-d.clock))}s`);if(f===3)text(c,'Height '+d.height,800,39,20,'#e7ecff','right');
}
for(let family=0;family<defs.length;family++){for(let mode=0;mode<10;mode++){
 const id=defs[family][0]+'-'+modes[mode][0];
 A.register(id,{controls:'Arrow keys / WASD • Space to act • Tap/click where appropriate • R restart',init:g=>initFamily(g,family,mode),update:(g,dt)=>updateFamily(g,dt,family),draw:(g,c)=>drawFamily(g,c,family),tap:(g,x,y)=>tapFamily(g,x,y,family),key:(g,k)=>keyFamily(g,k,family)});
}}
window.AW_V9_FAMILIES=defs.map(d=>({id:d[0],name:d[1],about:d[2],terms:d[3],theme:d[4]}));window.AW_V9_MODES=modes;
})();
