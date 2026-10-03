(()=>{
'use strict';
const $=s=>document.querySelector(s);
const els={
  quality:$('#quality'),qualityOut:$('#qualityOut'),resizeMode:$('#resizeMode'),customSizeWrap:$('#customSizeWrap'),
  maxWidth:$('#maxWidth'),maxHeight:$('#maxHeight'),preserveMeta:$('#preserveMeta'),dropZone:$('#dropZone'),
  chooseFiles:$('#chooseFiles'),chooseFolder:$('#chooseFolder'),fileInput:$('#fileInput'),folderInput:$('#folderInput'),
  fileCount:$('#fileCount'),totalSize:$('#totalSize'),clearBtn:$('#clearBtn'),convertBtn:$('#convertBtn'),
  progressText:$('#progressText'),progressPct:$('#progressPct'),progressBar:$('#progressBar'),downloadZipBtn:$('#downloadZipBtn'),
  fileList:$('#fileList'),statusSummary:$('#statusSummary'),themeBtn:$('#themeBtn'),decoderStatus:$('#decoderStatus')
};

let items=[];
let busy=false;
let zip=null;
let decoderPromise=null;
const MODULE_SOURCES=[
  {url:'https://cdn.jsdelivr.net/npm/libheif-js@1.23.2/libheif-wasm/libheif-bundle.mjs',label:'jsDelivr / libheif 1.23.2'},
  {url:'https://unpkg.com/libheif-js@1.23.2/libheif-wasm/libheif-bundle.mjs',label:'unpkg / libheif 1.23.2'}
];
const SCRIPT_SOURCES=[
  {url:'https://cdn.jsdelivr.net/npm/libheif-js@1.23.2/libheif-wasm/libheif-bundle.js',label:'jsDelivr classic / libheif 1.23.2'},
  {url:'https://unpkg.com/libheif-js@1.23.2/libheif-wasm/libheif-bundle.js',label:'unpkg classic / libheif 1.23.2'}
];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fmtBytes=n=>{const u=['B','KB','MB','GB'];let i=0,x=n||0;while(x>=1024&&i<u.length-1){x/=1024;i++}return `${x.toFixed(i?1:0)} ${u[i]}`};
const valid=f=>/\.(heic|heif)$/i.test(f.name)||['image/heic','image/heif'].includes((f.type||'').toLowerCase());
const baseName=n=>n.replace(/\.(heic|heif)$/i,'');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=s=>({queued:'Queued',working:'Converting…',done:'✓ Done',error:'Failed'}[s]||s);

function uniqueOutName(name,used){
  const b=baseName(name)||'image'; let candidate=`${b}.jpg`,i=2;
  while(used.has(candidate.toLowerCase()))candidate=`${b}_${i++}.jpg`;
  used.add(candidate.toLowerCase()); return candidate;
}

function render(){
  const used=new Set();
  items.forEach(it=>{if(!it.outName)it.outName=uniqueOutName(it.file.name,used);else used.add(it.outName.toLowerCase())});
  els.fileCount.textContent=`${items.length} file${items.length===1?'':'s'}`;
  els.totalSize.textContent=fmtBytes(items.reduce((a,b)=>a+b.file.size,0));
  els.clearBtn.disabled=!items.length||busy; els.convertBtn.disabled=!items.length||busy;
  els.chooseFiles.disabled=busy; els.chooseFolder.disabled=busy;
  const done=items.filter(x=>x.status==='done').length,err=items.filter(x=>x.status==='error').length;
  els.statusSummary.textContent=items.length?`${done} converted${err?` • ${err} failed`:''}`:'';
  if(!items.length){els.fileList.innerHTML='<div class="empty">No HEIC/HEIF files selected yet.</div>';return}
  els.fileList.innerHTML=items.map((it,i)=>`<div class="file-row">
    <div class="file-name"><strong title="${esc(it.file.name)}">${esc(it.file.name)}</strong>
    <small>${fmtBytes(it.file.size)} → ${esc(it.outName)}${it.dimensions?` • ${it.dimensions}`:''}</small>${it.error?`<small class="err-msg">${esc(it.error)}</small>`:''}</div>
    <span class="status ${it.status}">${label(it.status)}</span>
    ${it.blob?`<button class="download-one" data-i="${i}" type="button">Download JPG</button>`:''}
  </div>`).join('');
  document.querySelectorAll('.download-one').forEach(b=>b.onclick=()=>downloadOne(items[+b.dataset.i]));
}

function addFiles(files){
  const incoming=[...files].filter(valid);
  const sig=new Set(items.map(x=>`${x.file.name}|${x.file.size}|${x.file.lastModified}|${x.file.webkitRelativePath||''}`));
  for(const f of incoming){
    const k=`${f.name}|${f.size}|${f.lastModified}|${f.webkitRelativePath||''}`;
    if(!sig.has(k)){items.push({file:f,status:'queued',blob:null,outName:null,error:null,dimensions:null});sig.add(k)}
  }
  zip=null; els.downloadZipBtn.disabled=true; render();
}

async function instantiateLibheif(candidate){
  // Current libheif-wasm browser bundles export an Emscripten factory function.
  // Calling the factory is the crucial step older builds of this app missed.
  if(candidate && typeof candidate==='object' && 'default' in candidate)candidate=candidate.default;
  if(typeof candidate==='function' && typeof candidate.HeifDecoder!=='function')candidate=candidate();
  candidate=await Promise.resolve(candidate);
  if(candidate && typeof candidate==='object' && 'default' in candidate && !candidate.HeifDecoder){
    candidate=candidate.default;
    if(typeof candidate==='function')candidate=await Promise.resolve(candidate());
  }
  if(candidate?.ready && typeof candidate.ready.then==='function'){
    try{await candidate.ready}catch(_){}
  }
  if(!candidate || typeof candidate.HeifDecoder!=='function')throw new Error('decoder module loaded, but its factory did not produce HeifDecoder');
  return candidate;
}

async function importDecoderModule(url){
  const mod=await import(/* webpackIgnore: true */ url);
  return instantiateLibheif(mod);
}

function loadClassicScript(url){
  return new Promise((resolve,reject)=>{
    const old=document.querySelector(`script[data-libheif-url="${CSS.escape(url)}"]`);
    if(old)old.remove();
    const s=document.createElement('script');s.src=url;s.async=true;s.crossOrigin='anonymous';s.dataset.libheifUrl=url;
    s.onload=()=>resolve();s.onerror=()=>{s.remove();reject(new Error(`could not load ${new URL(url).hostname}`))};
    document.head.appendChild(s);
  });
}

async function getClassicGlobal(){
  let value;
  try{value=globalThis.libheif}catch(_){}
  if(!value){try{value=(0,eval)('typeof libheif!=="undefined" ? libheif : undefined')}catch(_){}}
  if(!value)throw new Error('script loaded, but no libheif factory/global was exposed');
  return instantiateLibheif(value);
}

async function ensureDecoder(){
  if(decoderPromise)return decoderPromise;
  decoderPromise=(async()=>{
    const failures=[];
    for(const source of MODULE_SOURCES){
      try{
        els.decoderStatus.textContent=`Loading HEIC decoder (${source.label})…`;
        els.decoderStatus.className='decoder-neutral';
        const lib=await importDecoderModule(source.url);
        els.decoderStatus.textContent=`HEIC decoder ready (${source.label})`;
        els.decoderStatus.className='decoder-ok';
        return lib;
      }catch(e){failures.push(`${source.label}: ${e?.message||e}`)}
    }
    for(const source of SCRIPT_SOURCES){
      try{
        els.decoderStatus.textContent=`Loading HEIC decoder (${source.label})…`;
        els.decoderStatus.className='decoder-neutral';
        try{delete globalThis.libheif}catch(_){}
        await loadClassicScript(source.url);
        const lib=await getClassicGlobal();
        els.decoderStatus.textContent=`HEIC decoder ready (${source.label})`;
        els.decoderStatus.className='decoder-ok';
        return lib;
      }catch(e){failures.push(`${source.label}: ${e?.message||e}`)}
    }
    els.decoderStatus.textContent='HEIC decoder unavailable';
    els.decoderStatus.className='decoder-bad';
    throw new Error('Could not initialize libheif 1.23.2. '+failures.join(' | '));
  })();
  try{return await decoderPromise}catch(e){decoderPromise=null;throw e}
}

async function tryNativeDecode(file){
  try{
    const bmp=await createImageBitmap(file);
    const canvas=document.createElement('canvas'); canvas.width=bmp.width; canvas.height=bmp.height;
    const ctx=canvas.getContext('2d',{alpha:false}); ctx.drawImage(bmp,0,0); bmp.close?.();
    return {canvas,width:canvas.width,height:canvas.height,source:'native'};
  }catch(_){return null}
}

async function decodeWithLibHeif(file){
  const lib=await ensureDecoder();
  const bytes=new Uint8Array(await file.arrayBuffer());
  let decoder=null,images=null,image=null,canvas=null;
  try{
    decoder=new lib.HeifDecoder();
    images=decoder.decode(bytes);
    if(!images?.length)throw new Error('No image was found inside this HEIC/HEIF file.');
    image=images.reduce((best,img)=>{
      const area=(img.get_width?.()||0)*(img.get_height?.()||0);
      const bestArea=best?(best.get_width?.()||0)*(best.get_height?.()||0):-1;
      return area>bestArea?img:best;
    },null);
    const width=image.get_width(),height=image.get_height();
    if(!width||!height)throw new Error('The decoder returned invalid image dimensions.');
    canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});
    const imageData=ctx.createImageData(width,height);
    await new Promise((resolve,reject)=>{
      let settled=false;
      try{
        image.display(imageData,displayData=>{
          if(settled)return;settled=true;
          if(!displayData)return reject(new Error('libheif could not render this image.'));
          try{ctx.putImageData(displayData.data?displayData:imageData,0,0);resolve()}catch(err){reject(err)}
        });
      }catch(err){reject(err)}
    });
    return {canvas,width,height,source:'libheif'};
  }finally{
    try{images?.forEach?.(img=>img?.free?.())}catch(_){}
    try{decoder?.decoder?.delete?.()}catch(_){}
    try{decoder?.free?.()}catch(_){}
  }
}

function targetDimensions(w,h){
  const mode=els.resizeMode.value;
  if(mode==='100')return [w,h];
  let scale=1;
  if(mode==='75'||mode==='50')scale=+mode/100;
  else{
    const mw=Math.max(1,+els.maxWidth.value||1),mh=Math.max(1,+els.maxHeight.value||1);
    scale=Math.min(1,mw/w,mh/h);
  }
  return [Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))];
}

async function canvasToJpeg(source,w,h){
  const [tw,th]=targetDimensions(w,h);let out=source;
  if(tw!==w||th!==h){
    out=document.createElement('canvas');out.width=tw;out.height=th;
    const ctx=out.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,tw,th);
  }
  const blob=await new Promise((res,rej)=>out.toBlob(b=>b?res(b):rej(new Error('The browser could not encode the JPEG.')),'image/jpeg',+els.quality.value/100));
  if(out!==source){out.width=1;out.height=1}
  return {blob,width:tw,height:th};
}

async function decode(file){
  const native=await tryNativeDecode(file);
  if(native)return native;
  return decodeWithLibHeif(file);
}

async function convertAll(){
  if(busy||!items.length)return;
  busy=true;zip=new JSZip();els.downloadZipBtn.disabled=true;render();
  let completed=0;const total=items.length;
  for(let i=0;i<items.length;i++){
    const it=items[i];it.status='working';it.error=null;it.blob=null;it.dimensions=null;render();
    updateProgress(completed,total,`Converting ${i+1} of ${total}: ${it.file.name}`);
    let decoded=null;
    try{
      decoded=await decode(it.file);
      const converted=await canvasToJpeg(decoded.canvas,decoded.width,decoded.height);
      it.blob=converted.blob;it.dimensions=`${converted.width}×${converted.height}`;it.status='done';
      zip.file(it.outName,it.blob,{binary:true});
    }catch(e){it.status='error';it.error=e?.message||String(e)}
    finally{if(decoded?.canvas){decoded.canvas.width=1;decoded.canvas.height=1}}
    completed++;updateProgress(completed,total,completed===total?'Conversion complete':`Converted ${completed} of ${total}`);render();
    await sleep(40);
  }
  busy=false;render();els.downloadZipBtn.disabled=!items.some(x=>x.status==='done');
}

function updateProgress(done,total,text){const p=total?Math.round(done/total*100):0;els.progressBar.value=p;els.progressPct.textContent=`${p}%`;els.progressText.textContent=text}
function downloadBlob(blob,name){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function downloadOne(it){if(it.blob)downloadBlob(it.blob,it.outName)}
async function downloadZip(){
  if(!zip)return;els.downloadZipBtn.disabled=true;els.downloadZipBtn.textContent='Building ZIP…';
  try{
    const b=await zip.generateAsync({type:'blob',compression:'STORE',streamFiles:true},m=>{els.progressText.textContent=`Building ZIP: ${Math.round(m.percent)}%`});
    downloadBlob(b,'HEIC_to_JPG_converted.zip');els.progressText.textContent='ZIP ready';
  }finally{els.downloadZipBtn.disabled=false;els.downloadZipBtn.textContent='Download All as ZIP'}
}
function clearAll(){items.forEach(x=>x.blob=null);items=[];zip=null;updateProgress(0,0,'Ready');els.downloadZipBtn.disabled=true;render()}

function readEntry(entry){
  return new Promise(resolve=>{
    if(entry.isFile){entry.file(f=>resolve([f]),()=>resolve([]));return}
    if(!entry.isDirectory){resolve([]);return}
    const reader=entry.createReader(),out=[];
    const next=()=>reader.readEntries(async entries=>{
      if(!entries.length){resolve(out);return}
      for(const child of entries)out.push(...await readEntry(child));
      next();
    },()=>resolve(out));
    next();
  });
}
async function filesFromDrop(dt){
  const entries=[...(dt.items||[])].map(i=>i.webkitGetAsEntry?.()).filter(Boolean);
  if(entries.length){const out=[];for(const e of entries)out.push(...await readEntry(e));return out}
  return [...(dt.files||[])];
}
function setupDnD(){
  ['dragenter','dragover'].forEach(ev=>els.dropZone.addEventListener(ev,e=>{e.preventDefault();els.dropZone.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>els.dropZone.addEventListener(ev,e=>{e.preventDefault();els.dropZone.classList.remove('drag')}));
  els.dropZone.addEventListener('drop',async e=>addFiles(await filesFromDrop(e.dataTransfer)));
  els.dropZone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.fileInput.click()}});
}

els.quality.oninput=()=>els.qualityOut.textContent=`${els.quality.value}%`;
els.resizeMode.onchange=()=>els.customSizeWrap.classList.toggle('hidden',els.resizeMode.value!=='custom');
els.chooseFiles.onclick=()=>els.fileInput.click();els.chooseFolder.onclick=()=>els.folderInput.click();
els.fileInput.onchange=e=>{addFiles(e.target.files);e.target.value=''};els.folderInput.onchange=e=>{addFiles(e.target.files);e.target.value=''};
els.clearBtn.onclick=clearAll;els.convertBtn.onclick=convertAll;els.downloadZipBtn.onclick=downloadZip;
els.themeBtn.onclick=()=>{const root=document.documentElement;const dark=root.dataset.theme==='dark'||(!root.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);root.dataset.theme=dark?'light':'dark';localStorage.setItem('heic-theme',root.dataset.theme)};
const saved=localStorage.getItem('heic-theme');if(saved)document.documentElement.dataset.theme=saved;
setupDnD();render();

// Expose only a tiny diagnostic surface for automated acceptance testing.
Object.defineProperty(globalThis,'__HEIC_APP_TEST__',{value:{instantiateLibheif},enumerable:false});
})();
