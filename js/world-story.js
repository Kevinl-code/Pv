/* Story logic: chapters, locations, hotspots, opening film, finale. */
(function(){
'use strict';
const W=PV.World;if(!W||W.noGL){return;}
const {$,rand,clamp,pick,Snd}=PV;
const E=W.E,S=W.S,Tg=W.Tg,pp=W.pp;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const body=document.body;
const RATE0=Object.assign({},W.rate);

/* ---------- captions ---------- */
let subT=0;
W.caption=function(en,ta,sec){
  const el=$('#sub'),t=$('#subText');clearTimeout(subT);
  if(!en){el.classList.remove('on');return;}
  t.innerHTML=en+(ta?'<span>'+ta+'</span>':'');el.classList.add('on');
  if(sec)subT=setTimeout(()=>el.classList.remove('on'),sec*1000);
};

/* ---------- locations ---------- */
W.locs=[
 {id:'street',en:'The Street',ta:'தெரு',pose:'street',text:'An hour earlier. Everyone is out. Elders sit on the thinnai, kids race down the middle, and every doorway has a lamp waiting.'},
 {id:'kolam',en:'Kolam Lane',ta:'கோலம் வீதி',pose:'kolam',text:'She draws the kolam fresh every morning and again for festivals. Rice flour feeds the ants. Nothing here is wasted.'},
 {id:'tea',en:'Tea Shop',ta:'டீ கடை',pose:'tea',text:'The tea gets pulled high between two tumblers. Neighbours who argued all year stand here shoulder to shoulder tonight.'},
 {id:'kids',en:"Kids' Corner",ta:'குழந்தைகள் மூலை',pose:'kids',text:'A tyre, a stick and three kids with no phones. The best part of Deepavali costs nothing.'},
 {id:'temple',en:'The Temple',ta:'கோவில்',pose:'temple',text:'The gopuram at the end of the street. Everyone walks here at dawn after the oil bath. Ring the bell and listen.'}
];
W.goLoc=function(id){const l=W.locs.find(x=>x.id===id)||W.locs[0];W.loc=l.id;W.pose(l.pose,1.9);W.emit('loc',l);};

/* ---------- state helpers ---------- */
function setRates(fast){Object.assign(W.rate,fast?{down:1.3,gate:1.3,vines:1.2,dread:1.6,night:1,calm:1.6,dawn:.6}:RATE0);}
E.diyas.forEach(d=>{d.auto=!d.story;});
const storyDiyas=[];E.houses.forEach(h=>{if(h.diyas[0].story)storyDiyas.push(h.diyas[0]);});
const hotKolam=E.houses[1].kol;

W.resetPeople=function(){
  W.people.forEach(p=>{p.root.position.copy(p.hom);p.yaw=p.yaw0;p.root.rotation.y=p.yaw;p.pi=0;p.dir=1;p.set(p.mode0);p.sparklerOn=false;});
  E.dogs.forEach(d=>{d.g.visible=true;d.g.position.set(d.x0,0,d.z0);d.g.rotation.y=d.ry;d.state='sleep';d.t=0;});
  E.birds.forEach(b=>{b.g.visible=true;b.g.position.copy(b.home);b.state='perch';});
};
W.villageState=function(){
  setRates(false);W.resetPeople();
  Object.assign(Tg,{night:.78,down:0,gate:0,vines:0,dread:0,dawn:0,calm:1});
  E.kolams.forEach(k=>{if(k===hotKolam&&!hotKolam.dn){k.reveal=null;k.material.opacity=0;}else{k.reveal=1;k.material.opacity=.95;}});
  E.diyas.forEach(d=>{if(d.story){E.light(d,!!d.byUser);d.force=false;}});
  W.villageReady=true;W.upReady=false;
};
W.upsideState=function(v){
  setRates(true);
  const d=v==null?1:v;
  Object.assign(Tg,{night:.75+.25*d,down:d,gate:d,vines:d,dread:.8*d,dawn:0,calm:1-d});
  if(d>=.5){W.people.forEach(p=>p.set('hidden'));E.dogs[2].state='bark';E.dogs[0].state='alert';E.dogs[1].state='alert';E.birds.forEach(b=>{if(b.state!=='gone'){b.g.visible=false;b.state='gone';}});E.diyas.forEach(x=>{E.light(x,true);});}
  else{W.resetPeople();}
  W.villageReady=false;W.upReady=true;
};
W.setDown=function(v){
  const wasUp=W.S.down>=.5||W.Tg.down>=.5;const nowUp=v>=.5;
  setRates(true);
  Object.assign(Tg,{night:.75+.25*v,down:v,gate:v,vines:v,dread:.8*v,calm:1-v});
  if(nowUp!==wasUp||!W.sliderInit){W.sliderInit=true;
    if(nowUp){W.people.forEach(p=>p.set('hidden'));E.dogs[2].state='bark';}else{W.resetPeople();}}
};

/* ---------- chapters ---------- */
W.setChapter=function(name){
  W.ch=name;
  const active=name==='home'||name==='village'||name==='upside'||name==='finale';
  W.setActive(active);
  if(!active){Snd.setMood({crowd:0,dread:0,night:.4});return;}
  if(W.introRunning&&name!=='home')W.skipIntro();
  if(name==='home'){
    if(!W.introStarted){W.pose('open',.6);Object.assign(Tg,{night:.05,down:0,gate:0,vines:0,dread:0,calm:1});}
    else if(W.introDone&&!W.finaleDone){W.pose('gateWide',.8);}
  }else if(name==='village'){
    if(!W.villageReady||W.finaleDone)W.villageState();W.goLoc(W.loc||'street');
  }else if(name==='upside'){
    W.upsideState(W.upVal==null?1:W.upVal);W.pose('gateWide',1.2);
  }else if(name==='finale'){
    if(!W.finaleDone){if(!W.upReady||Tg.down<.9)W.upsideState(1);W.pose('fin',1.0);}else W.pose('dawnWide',1.0);
  }
  W.emit('chapter',name);
};

/* ---------- warmth ---------- */
W.addWarm=function(n){W.warm=Math.min(100,W.warm+n);W.emit('warm',W.warm);if(W.warm>=70&&!W.warmEmber){W.warmEmber=true;W.emit('ember','warmth');}};

/* ---------- hotspots ---------- */
const hotEl=$('#hot'),pv=V3(0,0,0);
function addHot(o){
  const b=document.createElement('button');b.className='hs hide'+(o.dark?' dark':'');b.dataset.l=o.label;b.setAttribute('aria-label',o.label);b.type='button';hotEl.appendChild(b);
  const h=Object.assign({el:b,done:false},o);
  b.addEventListener('click',function(e){e.stopPropagation();Snd.unlock();if(h.done)return;h.done=true;b.classList.add('done');Snd.click();h.fn(h);});
  b.addEventListener('pointerdown',e=>e.stopPropagation());
  W.hot.push(h);return h;
}
const vil=(label,pos,fn,extra)=>addHot(Object.assign({label:label,pos:pos,ch:'village',fn:fn},extra||{}));
storyDiyas.forEach(function(d,i){vil('Light the diya',d.pos.clone().add(V3(0,.2,0)),function(){E.light(d,true);d.byUser=true;Snd.bell(0,1046,.12);W.addWarm(10);W.sparkHere(d.pos);});});
vil('Finish the kolam',V3(2.2,.3,2),function(h){hotKolam.reveal=0;hotKolam.dn=true;Snd.bell(0,880,.1);W.addWarm(10);});
vil('Share a cup of tea',E.anchors.kettle.clone().add(V3(0,.3,0)),function(){Snd.pour(0,2);Snd.clink(2.1);Snd.clink(2.5);pp.c1.o.sip=1;W.addWarm(10);for(let i=0;i<24;i++)W.bits.emit(E.anchors.kettle.x,E.anchors.kettle.y,E.anchors.kettle.z,rand(-.3,.3),rand(.5,1.4),rand(-.3,.3),.9,.9,.95,rand(1,2),.28,-.2,.8,0);});
vil('Ring the temple bell',E.anchors.bell.clone(),function(){W.bellSwing=3.4;Snd.bell(0,330,.4);Snd.bell(.9,330,.25);W.addWarm(10);});
vil('Join the game',V3(0,1.4,-6),function(){[pp.k1,pp.k2,pp.k3].forEach(k=>{k.speed*=1.4;});Snd.applause(0,2.2);W.addWarm(10);});
vil('Calm the dog',V3(6.2,.7,-12),function(){E.dogs[0].state='happy';E.dogs[0].t=0;W.after(4,()=>{if(W.ch==='village')E.dogs[0].state='sleep';});W.addWarm(10);});
vil('Greet the elder',V3(-3.7,1.2,3.1),function(){pp.elder.o.stoop=1;Snd.bell(0,660,.1);W.addWarm(10);});

const SIGNS=[
 {label:'The kettle',pos:V3(8,1.4,-13),text:'The tea shop is cold. The steam turned into drifting spores. Nobody stayed for a second cup.'},
 {label:'The streetlight',pos:V3(-2.4,4.6,-15),text:'The light stutters where nobody looks up. The gate feeds on quiet streets and rushed celebrations.'},
 {label:'The dog',pos:V3(-6.5,.8,-27),text:'The animals knew first. Be gentle with them tonight. They cannot ask for quiet.'},
 {label:'The gate',pos:V3(0,27,-66),text:'It is not an invader. It is built from every festival spent alone, wasted, or loud without care.'}
];
W.signs=0;
SIGNS.forEach(function(s){addHot({label:s.label,pos:s.pos,ch:'upside',dark:true,fn:function(){W.signs++;W.emit('sign',{n:W.signs,text:s.text,total:SIGNS.length});Snd.whisper(0,1.4,0,.12);}});});
W.sparkHere=function(p){for(let i=0;i<14;i++)W.st.sparks.emit(p.x,p.y+.1,p.z,rand(-1,1),rand(.5,2),rand(-1,1),1,.8,.4,rand(.3,.7),.06,2,1.2,.5);};

const _v=V3(0,0,0);
W.on('frame',function(){
  const show=W.ch&&!W.introRunning&&W.st.visible;
  W.hot.forEach(function(h){
    let vis=show&&h.ch===W.ch&&(h.ch!=='upside'||W.S.down>.5)&&(h.ch!=='village'||W.S.down<.4);
    if(vis){_v.copy(h.pos).project(W.st.camera);
      if(_v.z>1||Math.abs(_v.x)>1.02||Math.abs(_v.y)>1.02)vis=false;
      else{h.el.style.left=((_v.x*.5+.5)*innerWidth)+'px';h.el.style.top=((-_v.y*.5+.5)*innerHeight)+'px';}}
    h.el.classList.toggle('hide',!vis);
  });
});

/* ---------- the opening film ---------- */
W.tok=0;
function stageReset(){W.villageState();Object.assign(W.S,{night:.0,down:0,gate:0,vines:0,dread:0,dawn:0,calm:1});Object.assign(Tg,{night:0,down:0,gate:0,vines:0,dread:0,dawn:0,calm:1});
  E.diyas.forEach(d=>{E.light(d,false);d.force=false;});E.kolams.forEach(k=>{k.reveal=null;k.material.opacity=0;});W.snapPose('open');}
W.playIntro=function(){
  const tok=++W.tok;W.introStarted=true;W.introRunning=true;W.introDone=false;W.finaleDone=false;
  body.classList.add('cine','playing');$('#titleCard').classList.remove('on');
  stageReset();W.autoBolt=false;Object.assign(W.rate,RATE0);W.rate.night=.085;
  const at=(s,fn)=>W.after(s,()=>{if(W.tok===tok)fn();});
  const cap=(en,ta,sec)=>{if(W.ch==='home')W.caption(en,ta,sec);};
  const pose=(n,k)=>{if(W.ch==='home')W.pose(n,k);};
  W.pose('open',.3);
  cap('Evening. The day before Deepavali.','தீபாவளிக்கு முந்தைய மாலை.',5);
  E.kolams.forEach((k,i)=>at(1+i*.7,()=>{k.reveal=0;}));
  Snd.setMood({crowd:1,night:0,dread:0});
  at(5.5,()=>{pose('streetLow',.28);cap('Lights go up. Children cannot sit still.','விளக்குகள் ஏறுகின்றன. குழந்தைகள் ஓடி விளையாடுகின்றன.',5);Tg.night=.9;});
  at(11,()=>{cap('Elders light the first diyas.','பெரியவர்கள் முதல் விளக்கை ஏற்றுகிறார்கள்.',5);E.diyas.forEach((d,i)=>at(i*.17,()=>{E.light(d,true);d.force=true;}));Snd.bell(0,262,.25);});
  at(16,()=>{pose('tea',.3);cap('The whole street is together. This is Deepavali.','முழு தெருவும் ஒன்றாக. இதுதான் தீபாவளி.',4.5);});
  /* disturbance */
  at(21,()=>{cap('','');Tg.dread=.55;Snd.buzz(0,1.3,.2);Snd.whisper(0,3.5,-.6,.14);E.dogs[0].state='alert';E.dogs[1].state='alert';at(.5,()=>{E.dogs.forEach(d=>{d.state='bark';d.t=0;});Snd.bark(0,.6,1);Snd.bark(.4,-.5,1.25);Snd.bark(.9,0,.85);});pose('streetLow',.5);});
  at(23.2,()=>{E.scatterBirds();Snd.flock(0,3.6);Snd.thunder(.3,.6);Tg.down=.3;Tg.night=1;Tg.dread=.75;W.rate.down=.15;});
  at(25,()=>{cap('Something is wrong with the sky.','வானம் ஏதோ வித்தியாசமாக இருக்கிறது.',4);pose('gate',.4);Tg.gate=1;W.rate.gate=.13;Snd.gateOpen(0,7);});
  at(28,()=>{Tg.vines=1;W.rate.vines=.075;Tg.down=.9;W.rate.down=.22;W.bolt(null,true);Snd.thunder(.2,.9);
    W.people.forEach((p,i)=>{if(p.mode==='hidden')return;p.o.delay=i*.1;p.door=(function(){const dd=E.doors.reduce((b,d)=>{const q=Math.abs(d.x-p.root.position.x)*.5+Math.abs(d.z-p.root.position.z);return q<b.q?{q:q,d:d}:b;},{q:1e9}).d;return V3(dd.x,0,dd.z);})();p.set('panic');});
    for(let i=0;i<9;i++)Snd.heartbeat(i*1.1,.45);});
  at(29,()=>cap('Everyone inside! Inside!','எல்லோரும் உள்ளே! உள்ளே!',3.6));
  at(31.2,()=>{W.bolt();});at(32.4,()=>{W.bolt();});at(34,()=>{W.bolt();pose('gateWide',.35);});
  at(37,()=>{cap('','');Tg.dread=1;Tg.down=1;Snd.sting(0);body.classList.remove('cine');$('#titleCard').classList.add('on');});
  at(41,()=>{W.introRunning=false;W.introDone=true;W.autoBolt=true;body.classList.remove('playing');W.emit('introDone');});
};
W.skipIntro=function(){
  W.tok++;W.caption('');W.introRunning=false;W.introStarted=true;W.introDone=true;W.autoBolt=true;
  body.classList.remove('cine','playing');$('#titleCard').classList.add('on');
  W.upsideState(1);E.scatterBirds();Object.assign(W.S,{night:1,down:1,gate:1,vines:1,dread:1,calm:0});
  E.kolams.forEach(k=>{k.reveal=1;});if(W.ch==='home')W.pose('gateWide',.8);
  W.emit('introDone');
};

/* ---------- finale ---------- */
W.finale=function(){
  const tok=++W.tok;W.finaleRunning=true;body.classList.add('cine');W.autoBolt=false;
  const at=(s,fn)=>W.after(s,()=>{if(W.tok===tok)fn();});
  setRates(false);W.rate.gate=.4;W.rate.vines=.22;W.rate.down=.28;W.rate.dawn=.17;W.rate.night=.25;
  W.pose('fin',.5);W.caption('Light gathers.','ஒளி சேர்கிறது.',3.4);
  Tg.dread=.3;Snd.gateClose(0,3.6);Tg.gate=0;Tg.vines=0;
  at(.6,()=>W.bolt(null,true));at(1.3,()=>W.bolt(null,true));at(2.2,()=>W.bolt(null,true));
  at(3.6,()=>{Tg.down=0;Tg.dread=0;Tg.night=.8;Tg.calm=1;W.caption('The darkness is leaving.','இருள் விலகுகிறது.',3.5);});
  at(7,()=>{Tg.dawn=1;Tg.night=.05;W.pose('dawnWide',.45);Snd.dawn(0);E.returnBirds();W.caption('Dawn.','விடியல்.',3);});
  at(9.5,()=>{
    W.resetPeople();E.dogs.forEach(d=>{d.state='happy';});
    W.people.forEach((p,i)=>{p.face=V3(0,0,24);if(p.o.age==='elder'){p.set('talk');}else if(p.mode0==='play'||p.o.sex==='f'||p.o.age==='teen'){p.set('celebrate');}else p.set('talk');p.sparklerOn=(p.id==='k1'||p.id==='k2'||p.id==='k3');});
    E.diyas.forEach(d=>{E.light(d,true);d.force=true;});E.kolams.forEach(k=>{k.reveal=1;});
    Snd.applause(0,4.5);Snd.chirps(0,8,.06);
    [-8,0,8].forEach((x,i)=>at(.6+i*.7,()=>{W.fireShell(x,rand(15,22),pick(['peony','willow','ring']));}));
  });
  at(13,()=>{W.finaleRunning=false;W.finaleDone=true;body.classList.remove('cine');W.caption('');W.emit('finaleDone');});
};
W.replayAll=function(){W.finaleDone=false;W.villageReady=false;W.warm=0;W.warmEmber=false;W.signs=0;W.hot.forEach(h=>{h.done=false;h.el.classList.remove('done');});storyDiyas.forEach(d=>{d.byUser=false;});hotKolam.dn=false;};
})();
