/* Navigation, chapters, embers, intro/finale wiring. */
(function(){
'use strict';

const {$,clamp,Snd,reduce}=PV;
const W=PV.World,body=document.body,$$=s=>[].slice.call(document.querySelectorAll(s));
const GL=!!(W&&!W.noGL&&W.ready);
body.classList.add('lock');

/* ---------- embers ---------- */
const EMB=[['warmth','Village warmth'],['feast','Shared table'],['give','Diwali box'],['animals','Calm corner'],['pledge','Pledge']];
const got=new Set();
const hud=$$('#embers i'),emberList=$('#emberList');
const GO={warmth:'#village',feast:'#feast',give:'#boxCard',animals:'#roomCard',pledge:'#pledgeCard'};
EMB.forEach(e=>{const c=document.createElement('button');c.type='button';c.className='chip';c.id='ec-'+e[0];c.textContent='Light: '+e[1];c.title='Go to '+e[1];
  c.addEventListener('click',()=>{Snd.unlock();Snd.click();const t=document.querySelector(GO[e[0]]);if(t)t.scrollIntoView({behavior:reduce?'auto':'smooth',block:e[0]==='warmth'?'start':'center'});});emberList.appendChild(c);});
function ember(id){
  if(got.has(id))return;got.add(id);
  const i=EMB.findIndex(e=>e[0]===id);if(hud[got.size-1])hud[got.size-1].classList.add('lit');
  $('#ec-'+id).classList.add('on');$('#ec-'+id).textContent='✓ '+EMB[i][1];$('#ec-'+id).setAttribute('aria-pressed','true');
  $('#emberN').textContent=got.size+' / 5';$('#emberFill').style.width=(got.size*20)+'%';
  $('#sealBtn').disabled=got.size<5;
  Snd.ember();
  if(GL)W.caption('Ember lit · '+EMB[i][1],'ஒளி சுடர்',2.6);
  else{const t=$('#subText');t.textContent='Ember lit · '+EMB[i][1];$('#sub').classList.add('on');setTimeout(()=>$('#sub').classList.remove('on'),2400);}
  if(got.size===5){$('#finText').textContent='All five embers are lit. The gate is ready to close. Press the button and watch the street.';}
}
PV.Story={ember:ember,embers:got};
if(GL)W.on('ember',ember);

/* ---------- sound pill ---------- */
const sndBtn=$('#sndBtn'),sndTxt=$('#sndTxt');
function syncSnd(){const on=Snd.on();sndBtn.setAttribute('aria-pressed',on?'true':'false');sndTxt.textContent=on?'Sound on':'Sound off';}
Snd.onChange(syncSnd);sndBtn.addEventListener('click',()=>{Snd.toggle();syncSnd();});

/* ---------- menu ---------- */
const burger=$('#burger');
function menu(open){body.classList.toggle('menu-open',open);burger.setAttribute('aria-expanded',open?'true':'false');}
burger.addEventListener('click',()=>menu(!body.classList.contains('menu-open')));
$$('#drawer a').forEach(a=>a.addEventListener('click',()=>menu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false);});

/* ---------- intro overlay ---------- */
function start(withSound){
  if(withSound)Snd.unlock();syncSnd();
  $('#intro').classList.add('gone');setTimeout(()=>{$('#intro').style.display='none';},1000);
  body.classList.remove('lock');
  if(!GL||reduce){body.classList.remove('cine','playing');$('#titleCard').classList.add('on');if(GL)W.skipIntro();if(GL)W.autoBolt=false;return;}
  W.playIntro();
}
$('#beginSound').addEventListener('click',()=>start(true));
$('#beginSilent').addEventListener('click',()=>start(false));
$('#skipBtn').addEventListener('click',()=>{if(GL)W.skipIntro();});
$('#replayBtn').addEventListener('click',()=>{window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});if(GL&&!reduce)W.playIntro();});
$('#enterBtn').addEventListener('click',()=>{if(GL&&W.introRunning)W.skipIntro();$('#village').scrollIntoView({behavior:reduce?'auto':'smooth'});});

/* ---------- scroll spy + world chapters ---------- */
const secs=$$('[data-ch]'),links=$$('.nav a'),idMap={};
let cur='';
function spy(){
  const mid=innerHeight*.5;let name=secs[0].dataset.ch;
  for(const s of secs){const r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid){name=s.dataset.ch;break;}}
  if(name===cur)return;cur=name;
  links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+name));
  if(GL)W.setChapter(name);
}
let tick=false;addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(()=>{tick=false;spy();});}},{passive:true});
addEventListener('resize',spy);spy();

/* ---------- Village panel ---------- */
const locChips=$('#locChips');
function renderLoc(l){$('#vTitle').textContent=l.en;$('#vTa').textContent=l.ta;$('#vText').textContent=l.text;
  [].forEach.call(locChips.children,c=>c.setAttribute('aria-pressed',c.dataset.id===l.id?'true':'false'));}
const LOCS=GL?W.locs:[{id:'street',en:'The Street',ta:'தெரு',text:'An hour earlier. Everyone is out, and every doorway has a lamp waiting.'}];
LOCS.forEach(l=>{const b=document.createElement('button');b.className='chip';b.dataset.id=l.id;b.textContent=l.en;b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{Snd.click();if(GL)W.goLoc(l.id);else renderLoc(l);});locChips.appendChild(b);});
renderLoc(LOCS[0]);
if(GL)W.on('loc',renderLoc);
function showWarm(p){$('#warmN').textContent=Math.round(p)+'%';$('#warmFill').style.width=p+'%';}
if(GL){W.on('warm',showWarm);}
else{
  let w=0;$('#vHint').textContent='Your browser has WebGL switched off, so the 3D village is replaced by simple actions. Tap each to warm the village.';
  ['Light a diya','Finish the kolam','Share a cup of tea','Ring the temple bell','Join the kids','Greet the elder','Calm the dog'].forEach(t=>{
    const b=document.createElement('button');b.className='chip';b.textContent=t;b.addEventListener('click',()=>{if(b.dataset.d)return;b.dataset.d=1;b.classList.add('on');w=Math.min(100,w+15);showWarm(w);Snd.bell(0,880,.1);if(w>=70)ember('warmth');});locChips.appendChild(b);});
}

/* ---------- Upside panel ---------- */
const slider=$('#downSlider');
slider.addEventListener('input',()=>{const v=slider.value/100;if(GL){W.upVal=v;W.setDown(v);}
  $('#uTitle').textContent=v<.5?'The same street, an hour earlier.':'The gate does not break doors.';});
$('#boltBtn').addEventListener('click',()=>{Snd.unlock();if(GL)W.bolt();else Snd.thunder(0,.8);});
$('#uCount').textContent='Signs found 0 / 4';
if(GL)W.on('sign',s=>{$('#uCount').textContent='Signs found '+s.n+' / '+s.total;$('#uText').textContent=s.text+(s.n>=s.total?' The gate is weakest where people stay together. Go back and light the village.':'');});
else $('#uHint').textContent='3D is unavailable here. The story still works: the gate grows where people are alone, and shrinks where they stay together.';
document.addEventListener('pointerdown',e=>{
  if(!GL||e.target!==document.body&&e.target.id!=='world')return;
  if(W.ch==='upside')W.bolt();
  else if(W.ch==='village'||W.ch==='home'&&W.introDone){Snd.unlock();W.fireShell((e.clientX/innerWidth-.5)*34,Math.max(11,26-e.clientY/innerHeight*16));}
});

/* ---------- Finale ---------- */
function runFinale(){
  Snd.unlock();$('#finCard').style.display='none';
  if(GL)W.finale();
  const show=()=>{const f=$('#final');f.classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.add('show')));};
  if(GL){W.on('finaleDone',show);}else{body.classList.add('dawn-fallback');show();}
}
$('#sealBtn').addEventListener('click',()=>{if(!$('#sealBtn').disabled)runFinale();});
$('#sealAnyway').addEventListener('click',runFinale);
$('#againBtn').addEventListener('click',()=>{
  $('#final').classList.remove('on','show');$('#finCard').style.display='';
  if(GL)W.replayAll();window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});if(GL&&!reduce)W.playIntro();else if(GL)W.skipIntro();
});
$('#shareBtn').addEventListener('click',()=>{
  const txt='HAPPY DIWALI 2026!\nLet the darkness disappear. Let happiness illuminate every home.\nCelebrate together. Care for everyone. Spread happiness.\n— Kevin Lazarus (Pattasu Vedikkum · DigiDiwali 2026)';
  const b=$('#shareBtn');const ok=()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy the message',1800);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,()=>{b.textContent='Copy failed';});else b.textContent='Select and copy manually';
});
})();
