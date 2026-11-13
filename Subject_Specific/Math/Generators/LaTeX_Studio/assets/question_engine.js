/* LaTeX Studio Assessment Engine — offline, deterministic checking, 2026 */
(function(global){'use strict';
const groups=[
['Number Sense',3,7,[['place-ones','Place value: ones'],['place-tens','Place value: tens'],['place-hundreds','Place value: hundreds'],['place-thousands','Place value: thousands'],['place-millions','Place value: millions'],['round-tens','Round to tens'],['round-hundreds','Round to hundreds'],['round-thousands','Round to thousands'],['compare','Compare whole numbers'],['order','Order whole numbers'],['prime','Prime or composite'],['factor','Greatest common factor'],['lcm','Least common multiple'],['absolute','Absolute value']]],
['Whole Number Operations',3,7,[['add','Multi-digit addition'],['subtract','Multi-digit subtraction'],['multiply','Multi-digit multiplication'],['divide','Whole-number division'],['remainder','Division with remainders'],['missing-add','Missing addend'],['missing-mult','Missing factor'],['estimate','Estimate by rounding'],['ops-mixed','Mixed operations']]],
['Fractions',4,9,[['frac-simplify','Simplify fractions'],['frac-equivalent','Equivalent fractions'],['frac-compare','Compare fractions'],['frac-add','Add fractions'],['frac-sub','Subtract fractions'],['frac-mult','Multiply fractions'],['frac-div','Divide fractions'],['frac-mixed','Convert mixed numbers'],['frac-improper','Convert improper fractions'],['frac-qty','Fraction of a quantity'],['frac-common','Common denominators'],['frac-order','Order fractions']]],
['Decimals',4,9,[['dec-add','Add decimals'],['dec-sub','Subtract decimals'],['dec-mult','Multiply decimals'],['dec-div','Divide decimals'],['dec-round','Round decimals'],['dec-compare','Compare decimals'],['dec-fraction','Decimal to fraction'],['dec-percent','Decimal to percent']]],
['Percent & Finance',5,11,[['percent-of','Percent of a quantity'],['percent-rate','Find the percentage'],['percent-whole','Find the whole'],['percent-increase','Percent increase'],['percent-decrease','Percent decrease'],['percent-discount','Sale discounts'],['percent-tax','Sales tax'],['percent-tip','Tips'],['percent-markup','Markup'],['percent-convert','Percent to decimal']]],
['Ratios & Rates',6,10,[['ratio-equivalent','Equivalent ratios'],['ratio-missing','Missing value in a ratio'],['ratio-unit','Unit rates'],['ratio-scale','Scale factor'],['ratio-part','Part-to-part ratios'],['ratio-total','Part-to-whole ratios'],['ratio-three','Three-part ratios'],['ratio-proportion','Solve proportions'],['ratio-speed','Distance, rate and time']]],
['Integers',6,9,[['int-add','Add integers'],['int-sub','Subtract integers'],['int-mult','Multiply integers'],['int-div','Divide integers'],['int-compare','Compare integers'],['int-order','Order integers'],['int-abs','Integer absolute value'],['int-ops','Order of operations with integers']]],
['Exponents & Roots',6,11,[['pow-eval','Evaluate positive powers'],['pow-product','Product of powers'],['pow-quotient','Quotient of powers'],['pow-power','Power of a power'],['pow-zero','Zero exponent'],['pow-negative','Negative exponents'],['pow-root','Square roots'],['pow-cube','Cube roots'],['pow-scientific','Scientific notation'],['pow-convert','Convert scientific notation']]],
['Algebraic Expressions',6,10,[['alg-eval','Evaluate expressions'],['alg-like','Combine like terms'],['alg-expand','Distributive property'],['alg-factor','Factor common terms'],['alg-sub','Substitution'],['alg-foil','Expand binomials'],['alg-addpoly','Add polynomials'],['alg-subpoly','Subtract polynomials']]],
['Equations & Inequalities',6,11,[['eq-add','One-step addition equations'],['eq-sub','One-step subtraction equations'],['eq-mult','One-step multiplication equations'],['eq-div','One-step division equations'],['eq-two','Two-step equations'],['eq-both','Variables on both sides'],['eq-bracket','Equations with brackets'],['eq-fraction','Equations with fractions'],['eq-ineq','Solve inequalities']]],
['Linear Relations',7,11,[['linear-value','Evaluate a linear rule'],['linear-slope','Slope from points'],['linear-yint','Y-intercept'],['linear-xint','X-intercept'],['linear-point','Points on a line'],['linear-table','Complete a function table'],['linear-write','Write a linear equation'],['linear-sequence','Arithmetic sequences']]],
['Geometry & Coordinates',5,11,[['geo-perimeter','Rectangle perimeter'],['geo-area','Rectangle area'],['geo-triangle','Triangle area'],['geo-angle','Supplementary angles'],['geo-complement','Complementary angles'],['geo-circle','Circle circumference'],['geo-midpoint','Midpoint'],['geo-distance','Distance on a coordinate plane'],['geo-pythag','Pythagorean theorem'],['geo-reflect','Reflect a point'],['geo-translate','Translate a point']]],
['Measurement',4,10,[['measure-length','Convert lengths'],['measure-mass','Convert masses'],['measure-time','Convert time'],['measure-volume','Rectangular prism volume'],['measure-prism','Prism surface area'],['measure-cylinder','Cylinder volume'],['measure-unitarea','Convert square units'],['measure-compound','Composite rectangle area']]],
['Statistics',6,11,[['stat-mean','Mean'],['stat-median','Median'],['stat-mode','Mode'],['stat-range','Range'],['stat-meanmissing','Missing value from a mean'],['stat-quartile','Lower quartile'],['stat-outlier','Identify an outlier'],['stat-frequency','Frequency tables']]],
['Probability',6,11,[['prob-coin','Coins'],['prob-die','Fair die'],['prob-spinner','Equal spinners'],['prob-complement','Complementary events'],['prob-union','Mutually exclusive events'],['prob-independent','Independent events'],['prob-dependent','Without replacement'],['prob-odds','Odds to probability']]],
['Advanced Mathematics',9,12,[['adv-quadratic','Quadratic substitution'],['adv-factor','Factor simple quadratics'],['adv-roots','Solve factored quadratics'],['adv-systems','Solve 2-variable systems'],['adv-trig','Right-triangle trigonometry'],['adv-log','Evaluate logarithms'],['adv-derivative','Differentiate powers'],['adv-integral','Integrate powers'],['adv-arithmetic','Arithmetic sequence nth term']]]
];
const catalog=groups.flatMap(([category,low,high,entries])=>entries.map(([id,name])=>({id,name,category,grades:[low,high],tags:[category,name,'Grade-band guidance only — use any skill at any grade']})));
const byId=Object.fromEntries(catalog.map(x=>[x.id,x]));
const pi=(a,b,rng)=>Math.floor(rng()*(b-a+1))+a;
const choose=(items,rng)=>items[pi(0,items.length-1,rng)];
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a||1};
const lcm=(a,b)=>Math.abs(a*b)/gcd(a,b);
const fmt=n=>Number.isInteger(n)?String(n):String(Number(n.toFixed(5)));
const frac=(a,b)=>b===1?String(a):`${typeof a==='number'&&a<0?'-':''}\\frac{${typeof a==='number'?Math.abs(a):a}}{${b}}`;
const rat=(a,b)=>{const sign=b<0?-1:1;let g=gcd(a,b);return [sign*a/g,sign*b/g]};
const fanswer=(a,b)=>{const [u,v]=rat(a,b);return frac(u,v)};
const verified=(q,a,steps,check,extra={})=>({q:String(q),a:String(a),steps:Array.isArray(steps)?steps.map(x=>({tex:String(x.tex||''),text:String(x.text||'')})):[{tex:String(steps||'')}],check:!!check, ...extra});
const step=(tex)=>({tex});
const plain=text=>({text});
const safePow=(a,b)=>a**b;
function hashSeed(n){let t=(Number(n)||1)>>>0;return function(){t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}};
function create(skillId,level=2,rng=Math.random){
const skill=byId[skillId];if(!skill)throw Error('Unknown skill '+skillId);
const s=skillId;level=Math.max(1,Math.min(3,Number(level)||2));
const M=level===1?9:level===2?25:70;
const n=()=>pi(2,M,rng), small=()=>pi(2,9,rng), sign=()=>choose([-1,1],rng), integer=()=>pi(-M,M,rng);
const R=(q,a,st,ok=true,extra={})=>verified(q,a,st,ok,{skillId:s,category:skill.category,...extra});
let a=n(),b=n(),c=n(),d=n(),v,answer,items,q;
/* Rich variants for formerly tiny/fixed pools. All versions keep exact worked answers. */
if(s==='absolute'||s==='int-abs'){const v=pi(-100,100,rng);return R(`\\left|${v}\\right|`,String(Math.abs(v)),[step(`\\left|${v}\\right|=${Math.abs(v)}`)])}
if(s==='dec-fraction'||s==='dec-percent'){const denominator=level===1?10:100,amount=pi(1,level===1?99:990,rng),decimal=amount/denominator;return s==='dec-fraction'?R(`\\text{Write }${fmt(decimal)}\\text{ as a fraction}`,fanswer(amount,denominator),[step(`${frac(amount,denominator)}=${fanswer(amount,denominator)}`)]):R(`\\text{Write }${fmt(decimal)}\\text{ as a percent}`,`${fmt(decimal*100)}\\%`,[step(`${fmt(decimal)}\\times100\\%=${fmt(decimal*100)}\\%`)])}
if(s==='ratio-scale'){const original=pi(2,100,rng),factor=pi(2,level===1?8:20,rng);return R(`\\text{Scale factor from }${original}\\text{ to }${original*factor}`,String(factor),[step(`${original*factor}\\div${original}=${factor}`)])}
if(s==='geo-circle'){const radius=pi(2,level===1?45:85,rng);return R(`\\text{Circumference with radius }${radius}`,`${2*radius}\\pi`,[step(`2\\pi r=2\\pi(${radius})=${2*radius}\\pi`)])}
if(['measure-length','measure-mass','measure-time','measure-prism','measure-unitarea'].includes(s)){const m=pi(2,level===1?90:level===2?130:220,rng),suffix={'measure-length':'km','measure-mass':'kg','measure-time':'min','measure-prism':'cube','measure-unitarea':'m^2'}[s];if(s==='measure-prism')return R(`\\text{Surface area of a cube, side }${m}`,String(6*m*m),[step(`6(${m})^2=${6*m*m}`)]);const factor=s==='measure-length'||s==='measure-mass'?1000:s==='measure-time'?60:10000;const unit={'measure-length':'m','measure-mass':'g','measure-time':'s','measure-unitarea':'cm^2'}[s];return R(`\\text{Convert }${m}\\text{ ${suffix} to ${unit}}`,`${m*factor}\\text{ ${unit}}`,[step(`${m}\\times${factor}=${m*factor}`)])}
if(s==='percent-convert'){const percent=pi(1,199,rng);return R(`${percent}\\%\\text{ as a decimal}`,fmt(percent/100),[step(`${frac(percent,100)}=${fmt(percent/100)}`)])}
if(s==='pow-eval'){const base=pi(2,level===1?9:14,rng),exp=pi(2,level===1?5:7,rng);return R(`${base}^{${exp}}`,String(base**exp),[step(`${base}^{${exp}}=${base**exp}`)])}
if(s==='pow-zero'){const base=pi(2,level===1?65:level===2?110:210,rng)*sign();return R(`(${base})^0`,'1',[step(`a^0=1\\quad(a\\ne 0)`)] )}
if(s==='pow-negative'){const base=pi(2,level===1?10:16,rng),exp=pi(1,level===1?6:9,rng);return R(`${base}^{-${exp}}`,frac(1,base**exp),[step(`${base}^{-${exp}}=\\frac{1}{${base}^{${exp}}}=${frac(1,base**exp)}`)])}
if(s==='pow-root'){const root=pi(2,level===1?40:level===2?80:120,rng);return R(`\\sqrt{${root*root}}`,String(root),[step(`\\sqrt{${root*root}}=${root}`)])}
if(s==='pow-cube'){const root=pi(2,level===1?40:level===2?80:120,rng);return R(`\\sqrt[3]{${root**3}}`,String(root),[step(`\\sqrt[3]{${root**3}}=${root}`)])}
if(s==='pow-convert'){const coeff=pi(11,level===1?99:999,rng)/10,power=pi(-7,7,rng),val=coeff*10**power;return R(`${coeff}\\times10^{${power}}\\text{ in standard notation}`,fmt(val),[step(`${coeff}\\times10^{${power}}=${fmt(val)}`)])}
if(s==='geo-pythag'){const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[12,35,37],[20,21,29],[11,60,61],[13,84,85],[28,45,53],[16,63,65]];const t=choose(triples,rng),scale=pi(1,level===1?8:level===2?12:18,rng);const [aa,bb,cc]=t.map(x=>x*scale);return R(`\\text{Right triangle: legs }${aa}\\text{ and }${bb}.\\text{ Find the hypotenuse.}`,String(cc),[step(`c=\\sqrt{${aa}^2+${bb}^2}=${cc}`)])}
if(s==='stat-outlier'){const start=pi(1,level===1?70:150,rng),off=pi(30,level===1?60:120,rng),far=start+off;const nums=[start,start+1,start+2,start+3,start+4,far];return R(`\\text{Identify the outlier in }${nums.join(',\\;')}`,String(far),[plain(`${far} is much farther from the rest of the values.`)])}
if(s==='prob-coin'){const n=pi(2,level===1?5:7,rng),k=pi(0,n,rng),atLeast=rng()<.5;let ways=0;const binom=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return Math.round(v)};for(let i=atLeast?k:k;i<=(atLeast?n:k);i++)ways+=binom(n,i);const ans=fanswer(ways,2**n);return R(`\\text{P(${atLeast?'at least':'exactly'} ${k} heads in ${n} fair coin flips)}`,ans,[step(`\\frac{${ways}}{2^{${n}}}=${ans}`)])}
if(s==='prob-die'){const faces=choose([4,6,8,10,12,20,24],rng),limit=pi(1,faces,rng),above=rng()<.5;const success=above?faces-limit:limit;return R(`\\text{Fair ${faces}-sided die: P(rolling ${above?'more than':'at most'} ${limit})}`,fanswer(success,faces),[step(`\\frac{${success}}{${faces}}=${fanswer(success,faces)}`)])}
if(s==='prob-spinner'){const total=pi(4,level===1?12:level===2?18:24,rng),shaded=pi(1,total-1,rng);return R(`\\text{Spinner: ${shaded} of ${total} equal sectors shaded. Find P(shaded).}`,fanswer(shaded,total),[step(`${frac(shaded,total)}=${fanswer(shaded,total)}`)])}
if(s==='prob-complement'){const den=choose([10,12,16,20,25,30,40,50,100],rng),top=pi(1,den-1,rng);return R(`\\text{If P(A)}=${frac(top,den)}\\text{, find P(not A)}`,fanswer(den-top,den),[step(`1-${frac(top,den)}=${fanswer(den-top,den)}`)])}
if(s==='prob-union'){const faces=choose([6,8,10,12,20,24],rng),low=pi(1,faces-2,rng),high=pi(1,faces-low-1,rng),success=low+high;return R(`\\text{Fair ${faces}-sided die: P(rolling at most ${low} or at least ${faces-high+1})}`,fanswer(success,faces),[step(`${frac(low,faces)}+${frac(high,faces)}=${fanswer(success,faces)}`)])}
if(s==='prob-independent'){const a=pi(1,level===1?6:12,rng),totA=pi(a+1,a+pi(1,10,rng),rng),b=pi(1,level===1?6:12,rng),totB=pi(b+1,b+pi(1,10,rng),rng);const ans=fanswer(a*b,totA*totB);return R(`\\text{Independent spinners: ${a}/${totA} red on A, ${b}/${totB} red on B. P(both red)?}`,ans,[step(`${frac(a,totA)}\\times${frac(b,totB)}=${ans}`)])}
if(s==='prob-dependent'){const good=pi(2,level===1?12:22,rng),bad=pi(2,level===1?12:22,rng),total=good+bad,ans=fanswer(good*(good-1),total*(total-1));return R(`\\text{Without replacement: ${good} red and ${bad} blue. P(two red)?}`,ans,[step(`${frac(good,total)}\\times${frac(good-1,total-1)}=${ans}`)])}
if(s==='prob-odds'){const favourable=pi(1,level===1?12:24,rng),unfavourable=pi(1,level===1?12:24,rng),ans=fanswer(favourable,favourable+unfavourable);return R(`\\text{Odds ${favourable}:${unfavourable} in favour. Find probability.}`,ans,[step(`${frac(favourable,favourable+unfavourable)}=${ans}`)])}
if(s==='adv-trig'){const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[12,35,37],[20,21,29]],t=choose(triples,rng),scale=pi(1,10,rng),[opp,adj,hyp]=t.map(x=>x*scale),kind=choose(['sin','cos','tan'],rng),num=kind==='cos'?adj:opp,den=kind==='tan'?adj:hyp;return R(`\\text{Right triangle: opposite ${opp}, adjacent ${adj}, hypotenuse ${hyp}. Find }\\${kind}\\theta`,fanswer(num,den),[step(`\\${kind}\\theta=${frac(num,den)}=${fanswer(num,den)}`)])}
if(s.startsWith('place-')){let pos={'place-ones':0,'place-tens':1,'place-hundreds':2,'place-thousands':3,'place-millions':6}[s];v=pi(1000000,8999999,rng);answer=Math.floor(v/(10**pos))%10;return R(`\\text{Digit in the ${['ones','tens','hundreds','thousands','','','millions'][pos]} place of } ${v.toLocaleString('en-US').replace(/,/g,'{,}')}`,String(answer),[step(`${v}\\div ${10**pos}\\Rightarrow ${answer}`)],answer>=0&&answer<10)}
if(s.startsWith('round-')){const base={'round-tens':10,'round-hundreds':100,'round-thousands':1000}[s];v=pi(base,base*75,rng);answer=Math.round(v/base)*base;return R(`\\text{Round } ${v} \\text{ to the nearest } ${base}`,String(answer),[step(`${v}\\approx ${answer}`)],answer%base===0)}
switch(s){
case'compare':case'int-compare':case'dec-compare':case'frac-compare':{let u=s==='int-compare'?integer():s==='dec-compare'?n()/10:s==='frac-compare'?a/b:a;let z=s==='int-compare'?integer():s==='dec-compare'?c/10:s==='frac-compare'?c/d:b;const lt=s==='frac-compare'?frac(a,b):fmt(u),rt=s==='frac-compare'?frac(c,d):fmt(z),op=u<z?' < ':u>z?' > ':' = ';return R(`${lt}\\;\\boxed{\\phantom{<}}\\;${rt}`,op.trim(),[step(`${lt}${op}${rt}`)],op===(u<z?' < ':u>z?' > ':' = '))}
case'order':case'int-order':case'frac-order':{items=s==='int-order'?Array.from({length:4},integer):s==='frac-order'?[[a,b],[c,d],[small(),small()]]:Array.from({length:4},n);let display=s==='frac-order'?items.map(([x,y])=>frac(x,y)):items.map(String);let sorted=s==='frac-order'?[...items].sort((x,y)=>x[0]/x[1]-y[0]/y[1]).map(([x,y])=>frac(x,y)):[...items].sort((x,y)=>x-y).map(String);return R(`\\text{Order least to greatest: } ${display.join(',\\;')}`,sorted.join(', '),[step(sorted.join('\\le '))],true)}
case'prime':{v=pi(10,level===3?149:75,rng);const prime=Array.from({length:Math.floor(Math.sqrt(v))-1},(_,i)=>i+2).every(x=>v%x!==0);return R(`\\text{Is }${v}\\text{ prime or composite?}`,prime?'Prime':'Composite',[plain(prime?'No positive divisors other than 1 and itself.':'It has a divisor other than 1 and itself.')],true)}
case'factor':case'lcm':{v=s==='factor'?gcd(a,b):lcm(a,b);return R(`\\operatorname{${s==='factor'?'GCF':'LCM'}}(${a},${b})`,String(v),[step(`\\operatorname{${s==='factor'?'GCF':'LCM'}}(${a},${b})=${v}`)],true)}
case'absolute':case'int-abs':{v=integer();return R(`\\left|${v}\\right|`,String(Math.abs(v)),[step(`|${v}|=${Math.abs(v)}`)],true)}
case'add':case'subtract':case'multiply':case'divide':case'remainder':case'missing-add':case'missing-mult':case'estimate':case'ops-mixed':{
if(s==='add')return R(`${a}+${b}`,String(a+b),[step(`${a}+${b}=${a+b}`)]);
if(s==='subtract'){v=a+b;return R(`${v}-${b}`,String(a),[step(`${v}-${b}=${a}`)])}
if(s==='multiply')return R(`${a}\\times ${b}`,String(a*b),[step(`${a}\\times${b}=${a*b}`)]);
if(s==='divide')return R(`${a*b}\\div ${a}`,String(b),[step(`${a*b}\\div${a}=${b}`)]);
if(s==='remainder'){v=a*b+c%a;return R(`${v}\\div ${a}`,`${b}\\text{ R }${c%a}`,[step(`${v}=${a}\\times${b}+${c%a}`)])}
if(s==='missing-add')return R(`${a}+\\square=${a+b}`,String(b),[step(`\\square=${a+b}-${a}=${b}`)]);
if(s==='missing-mult')return R(`${a}\\times\\square=${a*b}`,String(b),[step(`\\square=${a*b}\\div${a}=${b}`)]);
if(s==='estimate'){const x=pi(100,999,rng),y=pi(100,999,rng);return R(`\\text{Estimate }${x}+${y}\\text{ (nearest 100)}`,String(Math.round(x/100)*100+Math.round(y/100)*100),[step(`${Math.round(x/100)*100}+${Math.round(y/100)*100}=${Math.round(x/100)*100+Math.round(y/100)*100}`)])}
return R(`${a}+${b}\\times ${c}`,String(a+b*c),[step(`${a}+(${b}\\times${c})=${a+b*c}`)])}
case'frac-simplify':case'frac-equivalent':case'frac-compare':case'frac-add':case'frac-sub':case'frac-mult':case'frac-div':case'frac-mixed':case'frac-improper':case'frac-qty':case'frac-common':{
a=pi(1,level===1?8:18,rng);b=pi(2,level===1?10:24,rng);c=pi(1,level===1?8:18,rng);d=pi(2,level===1?10:24,rng);
if(s==='frac-simplify'){v=small();return R(`\\text{Simplify } ${frac(a*v,b*v)}`,fanswer(a,b),[step(`${frac(a*v,b*v)}=${fanswer(a,b)}`)])}
if(s==='frac-equivalent'){v=small();return R(`\\text{Find the scale factor: }${frac(a,b)}=${frac(a*v,b*v)}`,`\\text{Multiply by }${v}`, [step(`${frac(a,b)}\\times${frac(v,v)}=${frac(a*v,b*v)}`)])}
if(s==='frac-mixed'){const whole=small(),numer=pi(1,b-1,rng);return R(`${frac(whole*b+numer,b)}\\;\\text{ as a mixed number}`,`${whole}\\frac{${numer}}{${b}}`,[step(`${frac(whole*b+numer,b)}=${whole}\\frac{${numer}}{${b}}`)])}
if(s==='frac-improper'){const whole=small(),numer=pi(1,b-1,rng);return R(`${whole}\\frac{${numer}}{${b}}\\;\\text{ as an improper fraction}`,frac(whole*b+numer,b),[step(`${whole}\\times${b}+${numer}=${whole*b+numer}`)])}
if(s==='frac-qty'){v=b*small();return R(`${frac(a,b)}\\;\\text{of}\\;${v}`,String(a*v/b),[step(`${frac(a,b)}\\times${v}=${a*v/b}`)])}
if(s==='frac-common'){v=lcm(b,d);return R(`\\operatorname{LCD}\\left(${frac(a,b)},${frac(c,d)}\\right)`,String(v),[step(`\\operatorname{LCM}(${b},${d})=${v}`)])}
const op=s==='frac-add'?'+':s==='frac-sub'?'-':s==='frac-mult'?'\\times':'\\div';v=s==='frac-add'?a*d+c*b:s==='frac-sub'?a*d-c*b:s==='frac-mult'?a*c:a*d;const den=s==='frac-mult'?b*d:s==='frac-div'?b*c:b*d;
return R(`${frac(a,b)}${op}${frac(c,d)}`,fanswer(v,den),[step(`${frac(a,b)}${op}${frac(c,d)}=${s==='frac-add'||s==='frac-sub'?`${frac(a*d,b*d)}${op}${frac(c*b,b*d)}`:frac(v,den)}`),step(`${frac(v,den)}=${fanswer(v,den)}`)],rat(v,den)[1]>0)}
case'dec-add':case'dec-sub':case'dec-mult':case'dec-div':case'dec-round':case'dec-compare':case'dec-fraction':case'dec-percent':{
const denominator=level===1?10:100;const x=a/denominator,y=b/denominator;
if(s==='dec-add')return R(`${fmt(x)}+${fmt(y)}`,fmt(x+y),[step(`${fmt(x)}+${fmt(y)}=${fmt(x+y)}`)]);
if(s==='dec-sub')return R(`${fmt(x+y)}-${fmt(y)}`,fmt(x),[step(`${fmt(x+y)}-${fmt(y)}=${fmt(x)}`)]);
if(s==='dec-mult')return R(`${fmt(x)}\\times${fmt(y)}`,fmt(x*y),[step(`${fmt(x)}\\times${fmt(y)}=${fmt(x*y)}`)]);
if(s==='dec-div')return R(`${fmt(x*y)}\\div${fmt(y)}`,fmt(x),[step(`${fmt(x*y)}\\div${fmt(y)}=${fmt(x)}`)]);
if(s==='dec-round'){v=pi(110,999,rng)/100;return R(`\\text{Round }${v}\\text{ to 1 decimal place}`,fmt(Math.round(v*10)/10),[step(`${v}\\approx${fmt(Math.round(v*10)/10)}`)])}
if(s==='dec-fraction')return R(`\\text{Write }${fmt(x)}\\text{ as a fraction}`,fanswer(a,denominator),[step(`${frac(a,denominator)}=${fanswer(a,denominator)}`)]);
return R(`\\text{Write } ${fmt(x)}\\text{ as a percent}`,`${fmt(x*100)}\\%`,[step(`${fmt(x)}\\times100\\%=${fmt(x*100)}\\%`)])}
case'percent-of':case'percent-rate':case'percent-whole':case'percent-increase':case'percent-decrease':case'percent-discount':case'percent-tax':case'percent-tip':case'percent-markup':case'percent-convert':{
const rate=choose([5,10,15,20,25,30,40,50,75],rng),whole=pi(4,level===3?70:30,rng)*20,val=rate*whole/100;
if(s==='percent-convert')return R(`${rate}\\%\\;\\text{as a decimal}`,fmt(rate/100),[step(`${rate}\\div100=${fmt(rate/100)}`)]);
if(s==='percent-of')return R(`${rate}\\%\\;\\text{of }${whole}`,fmt(val),[step(`${frac(rate,100)}\\times${whole}=${fmt(val)}`)]);
if(s==='percent-rate')return R(`\\text{What percent of }${whole}\\text{ is }${fmt(val)}?`,`${rate}\\%`,[step(`${frac(val,whole)}\\times100\\%=${rate}\\%`)]);
if(s==='percent-whole')return R(`${fmt(val)}\\text{ is }${rate}\\%\\text{ of what number?}`,String(whole),[step(`${fmt(val)}\\div${fmt(rate/100)}=${whole}`)]);
const change=s==='percent-decrease'||s==='percent-discount'?-1:1;const value=whole+change*val;const lead=({'percent-increase':'Increase','percent-decrease':'Decrease','percent-discount':'Sale price after discount','percent-tax':'Total with tax','percent-tip':'Total including tip','percent-markup':'Marked-up price'})[s];return R(`\\text{${lead}: }${rate}\\%\\text{ of }${whole}`,fmt(value),[step(`${whole}${change<0?'-':'+'}${fmt(val)}=${fmt(value)}`)])}
case'ratio-equivalent':case'ratio-missing':case'ratio-unit':case'ratio-scale':case'ratio-part':case'ratio-total':case'ratio-three':case'ratio-proportion':case'ratio-speed':{
const factor=pi(2,level===1?4:9,rng);if(s==='ratio-equivalent')return R(`${a}:${b}=\\square:${b*factor}`,String(a*factor),[step(`${a}\\times${factor}=${a*factor}`)]);
if(s==='ratio-missing')return R(`${a}:${b}=${a*factor}:\\square`,String(b*factor),[step(`${b}\\times${factor}=${b*factor}`)]);
if(s==='ratio-unit')return R(`\\text{Unit price: } ${a*b}\\text{ dollars for }${a}\\text{ items}`,`${b}\\text{ dollars/item}`,[step(`${a*b}\\div ${a}=${b}`)]);
if(s==='ratio-scale')return R(`\\text{Scale factor from }${a}\\text{ to }${a*factor}`,String(factor),[step(`${a*factor}\\div${a}=${factor}`)]);
if(s==='ratio-part')return R(`\\text{Red:blue}=${a}:${b}\\text{. Write the part-to-part ratio}`,`${a}:${b}`,[step(`\\text{Red:blue}=${a}:${b}`)]);
if(s==='ratio-total')return R(`${a}:${b}\\;\\text{part-to-whole}`,`${a}:${a+b}`,[step(`${a}+${b}=${a+b}`)])
if(s==='ratio-three')return R(`${a}:${b}:${c}\\;\\text{ scaled by }${factor}`,`${a*factor}:${b*factor}:${c*factor}`,[step(`${a*factor}:${b*factor}:${c*factor}`)])
if(s==='ratio-speed')return R(`${a*b}\\text{ km in }${a}\\text{ h. Find km/h}`,`${b}\\text{ km/h}`,[step(`${a*b}\\div${a}=${b}`)])
return R(`${frac(a,b)}=${frac(a*factor,1)}\\div\\square`,String(b*factor),[step(`${a}\\times${factor}=${a*factor},\\quad${b}\\times${factor}=${b*factor}`)])}
case'int-add':case'int-sub':case'int-mult':case'int-div':case'int-ops':{
a=integer();b=integer();if(b===0)b=3;
if(s==='int-add')return R(`(${a})+(${b})`,String(a+b),[step(`${a}+(${b})=${a+b}`)]);
if(s==='int-sub')return R(`(${a})-(${b})`,String(a-b),[step(`${a}-(${b})=${a-b}`)]);
if(s==='int-mult')return R(`(${a})\\times(${b})`,String(a*b),[step(`${a}\\times${b}=${a*b}`)]);
if(s==='int-div')return R(`${a*b}\\div(${b})`,String(a),[step(`${a*b}\\div(${b})=${a}`)]);
return R(`(${a})+(${b})\\times ${c}`,String(a+b*c),[step(`${a}+${b*c}=${a+b*c}`)])}
case'pow-eval':case'pow-product':case'pow-quotient':case'pow-power':case'pow-zero':case'pow-negative':case'pow-root':case'pow-cube':case'pow-scientific':case'pow-convert':{
const base=pi(2,level===1?4:7,rng),e=pi(2,4,rng),f=pi(1,3,rng);
if(s==='pow-eval')return R(`${base}^{${e}}`,String(base**e),[step(`${base}^{${e}}=${base**e}`)]);
if(s==='pow-product')return R(`${base}^{${e}}\\cdot${base}^{${f}}`,`${base}^{${e+f}}`,[step(`${base}^{${e}}\\cdot${base}^{${f}}=${base}^{${e+f}}`)]);
if(s==='pow-quotient')return R(`${frac(base**(e+f),base**e)}`,`${base}^{${f}}`,[step(`${base}^{${e+f}}\\div${base}^{${e}}=${base}^{${f}}`)]);
if(s==='pow-power')return R(`(${base}^{${e}})^{${f}}`,`${base}^{${e*f}}`,[step(`${base}^{${e}\\times${f}}=${base}^{${e*f}}`)]);
if(s==='pow-zero')return R(`${base}^{0}`,'1',[step(`${base}^{0}=1`)])
if(s==='pow-negative')return R(`${base}^{-${e}}`,frac(1,base**e),[step(`${base}^{-${e}}=${frac(1,base**e)}`)])
if(s==='pow-root')return R(`\\sqrt{${base**2}}`,String(base),[step(`\\sqrt{${base**2}}=${base}`)])
if(s==='pow-cube')return R(`\\sqrt[3]{${base**3}}`,String(base),[step(`\\sqrt[3]{${base**3}}=${base}`)])
if(s==='pow-scientific'){const coefficient=pi(1,9,rng),exp=pi(2,5,rng);v=coefficient*10**exp;return R(`\\text{Write }${v}\\text{ in scientific notation}`,`${coefficient}\\times10^{${exp}}`,[step(`${v}=${coefficient}\\times10^{${exp}}`)])}
return R(`${base}\\times10^{${e}}`,String(base*10**e),[step(`${base}\\times10^{${e}}=${base*10**e}`)])}
case'alg-eval':case'alg-like':case'alg-expand':case'alg-factor':case'alg-sub':case'alg-foil':case'alg-addpoly':case'alg-subpoly':{
if(s==='alg-eval'||s==='alg-sub')return R(`${a}x+${b}\\;\\text{ when }x=${c}`,String(a*c+b),[step(`${a}(${c})+${b}=${a*c+b}`)])
if(s==='alg-like')return R(`${a}x+${b}x`,`${a+b}x`,[step(`(${a}+${b})x=${a+b}x`)])
if(s==='alg-expand')return R(`${a}(x+${b})`,`${a}x+${a*b}`,[step(`${a}(x+${b})=${a}x+${a*b}`)])
if(s==='alg-factor')return R(`${a}x+${a*b}`,`${a}(x+${b})`,[step(`${a}x+${a*b}=${a}(x+${b})`)])
if(s==='alg-foil')return R(`(x+${a})(x+${b})`,`x^{2}+${a+b}x+${a*b}`,[step(`x^2+(${a}+${b})x+${a*b}`)])
if(s==='alg-addpoly')return R(`(${a}x+${b})+(${c}x+${d})`,`${a+c}x+${b+d}`,[step(`(${a}+${c})x+(${b}+${d})`)])
return R(`(${a+c}x+${b+d})-(${c}x+${d})`,`${a}x+${b}`,[step(`${a+c-c}x+${b+d-d}`)])}
case'eq-add':case'eq-sub':case'eq-mult':case'eq-div':case'eq-two':case'eq-both':case'eq-bracket':case'eq-fraction':case'eq-ineq':{
const x=pi(-8,10,rng);a=small();b=small();c=small();
if(s==='eq-add')return R(`x+${a}=${x+a}`,`x=${x}`,[step(`x=${x+a}-${a}=${x}`)])
if(s==='eq-sub')return R(`x-${a}=${x-a}`,`x=${x}`,[step(`x=${x-a}+${a}=${x}`)])
if(s==='eq-mult')return R(`${a}x=${a*x}`,`x=${x}`,[step(`x=${a*x}\\div${a}=${x}`)])
if(s==='eq-div')return R(`${frac('x',a)}=${x}`,`x=${x*a}`,[step(`x=${x}\\times${a}=${x*a}`)])
if(s==='eq-two')return R(`${a}x+${b}=${a*x+b}`,`x=${x}`,[step(`${a}x=${a*x}`),step(`x=${x}`)])
if(s==='eq-both')return R(`${a+c}x+${b}=${c}x${a*x+b>=0?'+':''}${a*x+b}`,`x=${x}`,[step(`${a}x=${a*x}`),step(`x=${x}`)])
if(s==='eq-bracket')return R(`${a}(x+${b})=${a*(x+b)}`,`x=${x}`,[step(`x+${b}=${x+b}`),step(`x=${x}`)])
if(s==='eq-fraction')return R(`${frac('x',a)}+${b}=${x+b}`,`x=${a*x}`,[step(`${frac('x',a)}=${x}`),step(`x=${a*x}`)])
return R(`${a}x+${b}>${a*x+b}`,`x>${x}`,[step(`${a}x>${a*x}`),step(`x>${x}`)])}
case'linear-value':case'linear-slope':case'linear-yint':case'linear-xint':case'linear-point':case'linear-table':case'linear-write':case'linear-sequence':{
const slope=pi(-7,7,rng)||2,intercept=pi(-15,15,rng),x=pi(-5,5,rng),y=slope*x+intercept;
if(s==='linear-value')return R(`y=${slope}x${intercept<0?'':'+'}${intercept},\\;x=${x}`,`y=${y}`,[step(`y=${slope}(${x})+(${intercept})=${y}`)])
if(s==='linear-slope'){const x2=x+small(),y2=y+slope*(x2-x);return R(`\\text{Slope through }(${x},${y})\\text{ and }(${x2},${y2})`,String(slope),[step(`m=${frac(y2-y,x2-x)}=${slope}`)])}
if(s==='linear-yint')return R(`y=${slope}x${intercept<0?'':'+'}${intercept}\\text{. Find the y-intercept}`,String(intercept),[step(`x=0\\Rightarrow y=${intercept}`)])
if(s==='linear-xint')return R(`y=${slope}(x-${x})\\text{. Find the x-intercept}`,String(x),[step(`0=${slope}(x-${x})\\Rightarrow x=${x}`)])
if(s==='linear-point')return R(`\\text{Does }(${x},${y})\\text{ lie on }y=${slope}x+(${intercept})?`,'Yes',[step(`${slope}(${x})+(${intercept})=${y}`)])
if(s==='linear-table')return R(`f(x)=${slope}x+(${intercept}),\\;f(${x})=\\square`,String(y),[step(`f(${x})=${slope}(${x})+(${intercept})=${y}`)])
if(s==='linear-write')return R(`\\text{Slope }${slope},\\text{ y-intercept }${intercept}.\\text{ Write }y=mx+b`,`y=${slope}x${intercept<0?'':'+'}${intercept}`,[step(`m=${slope},\\;b=${intercept}`)])
return R(`${a},${a+b},${a+2*b},\\ldots\\text{ Find the 8th term}`,String(a+7*b),[step(`a_8=${a}+7(${b})=${a+7*b}`)])}
case'geo-perimeter':case'geo-area':case'geo-triangle':case'geo-angle':case'geo-complement':case'geo-circle':case'geo-midpoint':case'geo-distance':case'geo-pythag':case'geo-reflect':case'geo-translate':{
if(s==='geo-perimeter')return R(`\\text{Perimeter of rectangle }${a}\\times${b}`,String(2*(a+b)),[step(`2(${a}+${b})=${2*(a+b)}`)])
if(s==='geo-area')return R(`\\text{Area of rectangle }${a}\\times${b}`,String(a*b),[step(`${a}\\times${b}=${a*b}`)])
if(s==='geo-triangle')return R(`\\text{Triangle area: base }${a*2},\\;\\text{height }${b}`,String(a*b),[step(`${frac(1,2)}\\times${2*a}\\times${b}=${a*b}`)])
if(s==='geo-angle'){v=pi(15,165,rng);return R(`\\text{Supplement of }${v}^{\\circ}`,`${180-v}^{\\circ}`,[step(`180-${v}=${180-v}`)])}
if(s==='geo-complement'){v=pi(10,80,rng);return R(`\\text{Complement of }${v}^{\\circ}`,`${90-v}^{\\circ}`,[step(`90-${v}=${90-v}`)])}
if(s==='geo-circle')return R(`\\text{Circumference with radius }${a}`,`${2*a}\\pi`,[step(`2\\pi r=2\\pi(${a})=${2*a}\\pi`)])
if(s==='geo-midpoint')return R(`\\text{Midpoint of }(${a},${b})\\text{ and }(${a+2*c},${b+2*d})`,`(${a+c},${b+d})`,[step(`(${frac(2*a+2*c,2)},${frac(2*b+2*d,2)})=(${a+c},${b+d})`)])
if(s==='geo-distance')return R(`\\text{Horizontal distance }(${a},${b})\\text{ to }(${a+c},${b})`,String(c),[step(`|${a+c}-${a}|=${c}`)])
if(s==='geo-pythag'){v=choose([[3,4,5],[5,12,13],[8,15,17]],rng);return R(`\\text{Right triangle legs }${v[0]}\\text{ and }${v[1]}.\\text{ Hypotenuse?}`,String(v[2]),[step(`c=\\sqrt{${v[0]**2}+${v[1]**2}}=${v[2]}`)])}
if(s==='geo-reflect')return R(`\\text{Reflect }(${a},${b})\\text{ across the y-axis}`,`(-${a},${b})`,[step(`(x,y)\\mapsto(-x,y)`)])
return R(`\\text{Translate }(${a},${b})\\text{ by }(+${c},-${d})`,`(${a+c},${b-d})`,[step(`(${a}+${c},${b}-${d})=(${a+c},${b-d})`)])}
case'measure-length':case'measure-mass':case'measure-time':case'measure-volume':case'measure-prism':case'measure-cylinder':case'measure-unitarea':case'measure-compound':{
if(s==='measure-length')return R(`${a}\\text{ km to metres}`,`${a*1000}\\text{ m}`,[step(`${a}\\times1000=${a*1000}`)])
if(s==='measure-mass')return R(`${a}\\text{ kg to grams}`,`${a*1000}\\text{ g}`,[step(`${a}\\times1000=${a*1000}`)])
if(s==='measure-time')return R(`${a}\\text{ minutes to seconds}`,`${a*60}\\text{ s}`,[step(`${a}\\times60=${a*60}`)])
if(s==='measure-volume')return R(`\\text{Volume of }${a}\\times${b}\\times${c}\\text{ prism}`,String(a*b*c),[step(`${a}\\times${b}\\times${c}=${a*b*c}`)])
if(s==='measure-prism')return R(`\\text{Surface area of a cube, side }${a}`,String(6*a*a),[step(`6(${a})^2=${6*a*a}`)])
if(s==='measure-cylinder')return R(`\\text{Cylinder radius }${a},\\text{ height }${b};\\text{ volume}`,`${a*a*b}\\pi`,[step(`\\pi r^2h=\\pi(${a})^2(${b})=${a*a*b}\\pi`)])
if(s==='measure-unitarea')return R(`${a}\\text{ m}^2\\text{ to cm}^2`,`${a*10000}\\text{ cm}^2`,[step(`${a}\\times10000=${a*10000}`)])
return R(`\\text{Two non-overlapping rectangles: }${a}\\times${b}\\text{ and }${c}\\times${d}`,String(a*b+c*d),[step(`${a*b}+${c*d}=${a*b+c*d}`)])}
case'stat-mean':case'stat-median':case'stat-mode':case'stat-range':case'stat-meanmissing':case'stat-quartile':case'stat-outlier':case'stat-frequency':{
let nums=[a,b,c,d,small()].sort((x,y)=>x-y);const sum=nums.reduce((x,y)=>x+y,0);
if(s==='stat-mean')return R(`\\text{Mean of } ${nums.join(',')}`,fmt(sum/nums.length),[step(`${frac(sum,nums.length)}=${fmt(sum/nums.length)}`)])
if(s==='stat-median')return R(`\\text{Median of } ${nums.join(',')}`,String(nums[2]),[step(`\\text{Middle value}=${nums[2]}`)])
if(s==='stat-mode'){v=nums[0];return R(`\\text{Mode of }${[v,v,...nums].join(',')}`,String(v),[plain(`${v} appears most often.`)])}
if(s==='stat-range')return R(`\\text{Range of }${nums.join(',')}`,String(nums[4]-nums[0]),[step(`${nums[4]}-${nums[0]}=${nums[4]-nums[0]}`)])
if(s==='stat-meanmissing'){v=pi(3,15,rng);return R(`\\text{Mean of }${a},${b},${c},x\\text{ is }${fmt((a+b+c+v)/4)}.\\text{ Find }x`,String(v),[step(`4\\times${fmt((a+b+c+v)/4)}-(${a}+${b}+${c})=${v}`)])}
if(s==='stat-quartile')return R(`\\text{Lower quartile of }${nums.join(',')}`,fmt((nums[0]+nums[1])/2),[step(`${frac(nums[0]+nums[1],2)}=${fmt((nums[0]+nums[1])/2)}`)])
if(s==='stat-outlier'){v=100+M;return R(`\\text{Obvious outlier in }${[2,3,4,5,6,v].join(',')}`,String(v),[plain(`${v} is far from the other observations.`)])}
return R(`\\text{Frequency of }${a}\\text{ in }${[a,b,a,c,a].join(',')}`,'3',[plain(`${a} occurs three times.`)])}
case'prob-coin':case'prob-die':case'prob-spinner':case'prob-complement':case'prob-union':case'prob-independent':case'prob-dependent':case'prob-odds':{
if(s==='prob-coin')return R('\\text{P(heads) on a fair coin}',frac(1,2),[step('\\frac{1}{2}')])
if(s==='prob-die'){v=pi(1,6,rng);return R(`\\text{P(rolling }${v}\\text{ on a fair die)}`,frac(1,6),[step('\\frac{1}{6}')])}
if(s==='prob-spinner'){v=pi(1,5,rng);return R(`\\text{Spinner has }${v}\\text{ shaded of }${v+3}\\text{ sectors. P(shaded)?}`,fanswer(v,v+3),[step(frac(v,v+3))])}
if(s==='prob-complement'){v=pi(1,8,rng);return R(`\\text{If P(A)}=${frac(v,10)}\\text{, find P(not A)}`,fanswer(10-v,10),[step(`1-${frac(v,10)}=${fanswer(10-v,10)}`)])}
if(s==='prob-union')return R('\\text{P(rolling 1 or 2 on a fair die)}',frac(1,3),[step(`${frac(1,6)}+${frac(1,6)}=${frac(1,3)}`)])
if(s==='prob-independent')return R('\\text{P(heads and rolling a 6)}',frac(1,12),[step(`${frac(1,2)}\\times${frac(1,6)}=${frac(1,12)}`)])
if(s==='prob-dependent'){const good=pi(2,5,rng),bad=pi(2,5,rng),all=good+bad;return R(`\\text{P(two red marbles without replacement), }${good}\\text{ red and }${bad}\\text{ blue}`,fanswer(good*(good-1),all*(all-1)),[step(`${frac(good,all)}\\times${frac(good-1,all-1)}=${fanswer(good*(good-1),all*(all-1))}`)])}
return R('\\text{Odds 3:2 in favour. Find probability}',frac(3,5),[step(`${frac(3,3+2)}=${frac(3,5)}`)])}
case'adv-quadratic':case'adv-factor':case'adv-roots':case'adv-systems':case'adv-trig':case'adv-log':case'adv-derivative':case'adv-integral':case'adv-arithmetic':{
let u=pi(1,8,rng),w=pi(1,8,rng);
if(s==='adv-quadratic')return R(`f(x)=x^2+${u}x+${w},\\;f(${a})`,String(a*a+u*a+w),[step(`${a}^2+${u}(${a})+${w}=${a*a+u*a+w}`)])
if(s==='adv-factor')return R(`x^2+${u+w}x+${u*w}`,`(x+${u})(x+${w})`,[step(`x^2+(${u}+${w})x+${u*w}=(x+${u})(x+${w})`)])
if(s==='adv-roots')return R(`(x-${u})(x+${w})=0`,`x=${u}\\text{ or }x=-${w}`,[step(`x-${u}=0\\quad\\text{or}\\quad x+${w}=0`)])
if(s==='adv-systems'){const x=pi(-5,5,rng),y=pi(-5,5,rng);return R(`\\begin{cases}x+y=${x+y}\\\\ x-y=${x-y}\\end{cases}`,`x=${x},\\;y=${y}`,[step(`2x=${2*x}\\Rightarrow x=${x}`),step(`y=${x+y}-${x}=${y}`)])}
if(s==='adv-trig'){const [opp,adj,hyp]=choose([[3,4,5],[5,12,13],[8,15,17]],rng);return R(`\\text{Right triangle opposite }${opp},\\text{ hypotenuse }${hyp}.\\text{ Find }\\sin\\theta`,frac(opp,hyp),[step(`\\sin\\theta=${frac(opp,hyp)}`)])}
if(s==='adv-log')return R(`\\log_{${u+1}}(${(u+1)**w})`,String(w),[step(`${u+1}^{${w}}=${(u+1)**w}`)])
if(s==='adv-derivative')return R(`\\frac{d}{dx}(${u}x^{${w}})`,`${u*w}x^{${w-1}}`,[step(`\\frac{d}{dx}(ax^n)=anx^{n-1}`)])
if(s==='adv-integral')return R(`\\int ${u*(w+1)}x^{${w}}\\,dx`,`${u}x^{${w+1}}+C`,[step(`\\int ${u*(w+1)}x^{${w}}dx=${u}x^{${w+1}}+C`)])
return R(`a_1=${u},\\;d=${w}\\text{. Find }a_{10}`,String(u+9*w),[step(`${u}+9(${w})=${u+9*w}`)])}
}
throw Error(`Skill not implemented: ${s}`);
}
function validate(q){return !!q && !!q.check && typeof q.q==='string' && q.q.length>1 && typeof q.a==='string' && !!q.a.trim() && Array.isArray(q.steps) && q.steps.length>0 && q.steps.every(s=>typeof s.tex==='string'&&typeof s.text==='string');}
function generate(skillId,level=2,rng=Math.random,exclude=new Set()){for(let i=0;i<90;i++){const q=create(skillId,level,rng);if(validate(q)&&!exclude.has(q.q)){exclude.add(q.q);return {...q,id:'q'+Math.floor(rng()*1e9).toString(36),level,skillId}}}throw Error('Unable to produce enough unique questions for '+skillId)}
/* Independent numerical check for supported arithmetic. Advanced symbolic, geometry,
   statistics, and free-response problems are marked for manual review. No eval(). */
function verifyArithmetic(item){
 const allowed=new Set(['add','subtract','multiply','divide','remainder','ops-mixed','int-add','int-sub','int-mult','int-div','int-ops','dec-add','dec-sub','dec-mult','dec-div','frac-add','frac-sub','frac-mult','frac-div','pow-eval','pow-product','pow-quotient','pow-power','pow-zero','pow-negative','pow-root','pow-cube']);
 if(!allowed.has(item?.skillId))return {status:'review',note:'Review the solution for this skill.'};
 if(item.skillId==='remainder'||item.skillId==='pow-cube'||item.skillId==='pow-root')return {status:'review',note:'Review the nonstandard expression.'};
 function group(s,i){if(s[i]!=='{')throw Error('Expected a group');let depth=0;for(let j=i;j<s.length;j++){if(s[j]==='{')depth++;if(s[j]==='}'){depth--;if(depth===0)return [s.slice(i+1,j),j+1]}}throw Error('Unclosed group')}
 function fractionToArithmetic(s){let out='';for(let i=0;i<s.length;){if(s.startsWith('\\frac',i)){let [a,j]=group(s,i+5),[b,k]=group(s,j);out+='(('+fractionToArithmetic(a)+')/('+fractionToArithmetic(b)+'))';i=k}else{out+=s[i];i++}}return out}
 function numeric(source){let s=fractionToArithmetic(String(source||'')).replaceAll('\\cdot','*').replaceAll('\\times','*').replaceAll('\\div','/').replaceAll('\\;','').replaceAll('\\,','').replaceAll('{','(').replaceAll('}',')');if(/[^0-9.()+\-*/^\s]/.test(s))throw Error('Unsupported expression');const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/^]/g)||[];let i=0;
  const primary=()=>{const t=tokens[i++];if(t==='-')return -primary();if(t==='+')return primary();if(t==='('){const a=expr();if(tokens[i++]!==')')throw Error('Missing parenthesis');return a}if(t===undefined||!Number.isFinite(Number(t)))throw Error('Not numerical');return Number(t)};
  const power=()=>{let a=primary();if(tokens[i]==='^'){i++;a=Math.pow(a,power())}return a};
  const term=()=>{let a=power();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=power();a=op==='*'?a*b:a/b}return a};
  const expr=()=>{let a=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=term();a=op==='+'?a+b:a-b}return a};
  const result=expr();if(i!==tokens.length||!Number.isFinite(result))throw Error('Could not evaluate');return result}
 try{const lhs=numeric(item.q),rhs=numeric(item.a);const ok=Math.abs(lhs-rhs)<=1e-8*Math.max(1,Math.abs(lhs),Math.abs(rhs));return ok?{status:'verified',note:'Arithmetic answer independently checked.'}:{status:'mismatch',note:`Arithmetic check failed (${lhs} versus ${rhs}).`}}catch(e){return {status:'review',note:'This expression needs a manual solution check.'}}
}


/* Fixed, reproducible local question inventory for every skill and difficulty.
   Pools are generated lazily; counts are truthful.  We never promise an
   unlimited number of distinct variations for a small combinatorial skill. */
const POOL_TARGET=50, cache=new Map();
function pool(skillId,level=2){
  level=Number(level);if(![0,1,2,3].includes(level))level=2;
  if(level===0){const output=new Map();for(let l=1;l<=3;l++)for(const q of pool(skillId,l))if(!output.has(q.q))output.set(q.q,q);return Array.from(output.values())}
  const key=skillId+'|'+level;
  if(cache.has(key))return cache.get(key);
  if(!byId[skillId])throw Error('Unknown skill: '+skillId);
  const base=[...key].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)>>>0;
  const rng=hashSeed(base),seen=new Set(),list=[];
  for(let i=0;i<7000&&list.length<POOL_TARGET;i++){
    let q;try{q=create(skillId,level,rng)}catch{continue}
    if(!validate(q)||seen.has(q.q))continue;
    const check=verifyArithmetic(q);
    if(check.status==='mismatch')continue;
    seen.add(q.q);list.push({...q,skillId,level,id:`${skillId}-${level}-${list.length+1}`,verification:check.status});
  }
  cache.set(key,list);
  return list;
}
function capacity(skillId,level=2){return pool(skillId,level).length}
function draw(skillId,level,seen=new Set(),rng=Math.random){
  const available=pool(skillId,level).filter(q=>!seen.has(q.q));
  if(!available.length){const max=capacity(skillId,level);throw Error(`Maximum available for ${byId[skillId]?.name||skillId}: ${max} unique questions at this difficulty.`)}
  const pick=available[Math.floor(rng()*available.length)];seen.add(pick.q);
  return {...pick,steps:pick.steps.map(x=>({...x}))};
}

global.LSQuestionEngine={catalog,groups,byId,create,generate,validate,hashSeed,verifyArithmetic,pool,capacity,draw,POOL_TARGET};
})(window);
