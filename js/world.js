/* The village world: stage, lighting, people, animals, camera, per-frame state. */
(function(){
'use strict';
const {$,rand,clamp,pick,Snd,Sparks,mobile,reduce}=PV;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const W={ready:false,ch:'home',loc:'street',S:{night:0,down:0,gate:0,vines:0,dawn:0,dread:0,flk:1,flash:0,calm:1},Tg:{night:0,down:0,gate:0,vines:0,dawn:0,dread:0,calm:1},rate:{night:.12,down:.25,gate:.14,vines:.08,dawn:.22,dread:.4,calm:.5},
  clock:0,people:[],hot:[],ev:{},events:[],warm:0,sched:[]};
W.on=function(n,f){(W.ev[n]=W.ev[n]||[]).push(f);};W.emit=function(n,a){(W.ev[n]||[]).forEach(f=>f(a));};
W.after=function(sec,fn){W.sched.push({t:W.clock+sec,fn});};
PV.World=W;

const canvas=$('#world');
const st=PV.makeStage(canvas,52,mobile?3500:6500,true,true);
if(!st){document.body.classList.add('nogl-world');W.ready=false;W.noGL=true;
  ['setChapter','goLoc','fireShell','bolt','playIntro','skipIntro','finale','reset','setDown'].forEach(n=>{W[n]=function(){};});
  W.hotspots=[];W.locs=[];return;}
W.st=st;const {scene,camera,sparks,renderer}=st;
st.bits=new PV.Sparks(scene,700,false);st.resize();W.bits=st.bits;
if(!mobile){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
scene.fog=new THREE.FogExp2(0x2a1a2a,.014);

/* lights */
const hemi=new THREE.HemisphereLight(0xffa070,0x201418,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffa860,.7);sun.position.set(-14,16,10);scene.add(sun);scene.add(sun.target);
if(!mobile){sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);const c=sun.shadow.camera;c.left=-28;c.right=28;c.top=24;c.bottom=-24;c.near=1;c.far=80;sun.shadow.bias=-.0006;}
const warm=new THREE.PointLight(0xffa860,0,34,1.6);scene.add(warm);
const redL=new THREE.PointLight(0xff2a1a,0,160,1.3);redL.position.set(0,24,-58);scene.add(redL);
const flashL=new THREE.PointLight(0xff6a5a,0,120,1.5);flashL.position.set(0,14,-30);scene.add(flashL);

const E=PV.Env.extend(PV.Env.build(scene));W.E=E;
E.root.traverse(o=>{if(o.isMesh&&o.castShadow&&!mobile)o.receiveShadow=true;});

/* ---------- people ---------- */
const P=PV.People.make,SK=PV.People.SKIN;
function addP(o){const p=P(o);E.root.add(p.root);W.people.push(p);if(p.stream)E.root.add(p.stream);if(p.o.tyre){p.tyre=new THREE.Mesh(new THREE.TorusGeometry(.26,.06,8,20),new THREE.MeshStandardMaterial({color:0x151515,roughness:.9}));E.root.add(p.tyre);}return p;}
const nearestDoor=(x,z)=>{let b=null,bd=1e9;E.doors.forEach(d=>{const dd=Math.abs(d.x-x)*.5+Math.abs(d.z-z);if(dd<bd){bd=dd;b=d;}});return V3(b.x,0,b.z);};
const camFacing=V3(0,0,30);
const people={};
function def(id,o){o.home=o.home||V3(0,0,0);const p=addP(o);p.id=id;p.hom=p.home.clone();p.mode0=o.mode;p.yaw0=o.yaw||0;people[id]=p;return p;}
def('elder',{sex:'m',age:'elder',scale:.94,top:0xf2efe6,lower:0xf4f1ea,flare:.2,hem:.84,border:0xb83228,hair:0xd8d8d8,moustache:1,stoop:1,stick:1,towel:0xc23a2a,mode:'diya',home:V3(-3.7,0,3.1),yaw:-Math.PI/2,skin:SK[2]});
def('kolamW',{sex:'f',top:0x7a1f3d,sari:0x1f6a4a,sari2:0x1f6a4a,lower:0x1f6a4a,jasmine:1,mode:'kolam',home:V3(2.2,0,3.6),yaw:Math.PI,skin:SK[1]});
def('w1',{sex:'f',top:0x23467a,lower:0xc43a52,sari2:0xc43a52,sari:0xc43a52,jasmine:1,mode:'talk',home:V3(2.6,0,-9),yaw:Math.PI/2,face:V3(3.6,0,-9),skin:SK[3]});
def('w2',{sex:'f',top:0xe8b030,lower:0x2a6a8a,sari2:0x2a6a8a,sari:0x2a6a8a,jasmine:1,mode:'talk',home:V3(3.6,0,-9),yaw:-Math.PI/2,face:V3(2.6,0,-9),skin:SK[0]});
def('hanger',{sex:'m',top:0x3a6aa0,lower:0xf0ece0,flare:.21,mode:'hang',home:V3(-3.8,0,-8),yaw:-Math.PI/2,lift:.46,moustache:1,skin:SK[4]});
def('k1',{sex:'m',age:'kid',scale:.66,top:0xd8402a,legs:0x2a3a6a,shorts:1,mode:'play',home:V3(2.2,0,-6),center:V3(0,0,-6),rad:2.4,speed:3.1,tyre:1,skin:SK[3]});
def('k2',{sex:'f',age:'kid',scale:.62,top:0xf0c030,frock:0xd83a6a,mode:'play',home:V3(-2.2,0,-6),center:V3(0,0,-6),rad:2.4,speed:3.4,jasmine:1,skin:SK[1]});
def('k3',{sex:'m',age:'kid',scale:.7,top:0x2a9a6a,legs:0x2a2a3a,shorts:1,mode:'play',home:V3(0,0,-8.4),center:V3(0,0,-6),rad:2.4,speed:3.7,skin:SK[5]});
def('tea',{sex:'m',top:0xefe8d8,lower:0x2a3a8a,flare:.22,border:0xe8e0d0,mode:'pour',home:V3(8.55,0,-14.5),yaw:-Math.PI/2,face:V3(5,0,-14.5),moustache:1,towel:0xc23a2a,glass:2,pourStream:1,skin:SK[2]});
def('c1',{sex:'m',top:0x8a3a2a,lower:0xf2efe6,flare:.22,mode:'sit',sip:1,glass:1,home:V3(6.1,0,-15.3),yaw:Math.PI/2,face:V3(8,0,-15.3),moustache:1,skin:SK[0]});
def('c2',{sex:'m',top:0x3a7a5a,lower:0x2a2a30,flare:.2,mode:'sit',sip:1,glass:1,home:V3(6.1,0,-16.1),yaw:Math.PI/2,face:V3(8,0,-16.1),skin:SK[4]});
def('mom',{sex:'f',top:0xe8b030,lower:0x8a1a4a,sari2:0x8a1a4a,sari:0x8a1a4a,jasmine:1,tray:1,mode:'walk',home:V3(1.6,0,3),speed:.95,yaw:Math.PI,path:[V3(1.6,0,-4),V3(1.8,0,-17),V3(1.6,0,-30),V3(1.8,0,-17),V3(1.6,0,-4),V3(1.6,0,3)],skin:SK[1]});
def('t1',{sex:'m',age:'teen',scale:.95,top:0x2a2a30,legs:0x2a4a7a,hair:0x120c08,phone:1,mode:'selfie',home:V3(-1.1,0,-20),yaw:0,skin:SK[3]});
def('t2',{sex:'f',age:'teen',scale:.9,top:0xe8e0d0,legs:0x20202a,hair:0x120c08,mode:'selfie',home:V3(0,0,-20.2),yaw:0,face:V3(-1.1,0,-18),skin:SK[0]});
def('gran',{sex:'f',age:'elder',scale:.92,top:0xe8e8e8,lower:0xd8d8d0,sari:0xd8d8d0,sari2:0xd8d8d0,hair:0xdcdcdc,mode:'sit',work:1,home:V3(5.2,-.05,2.6),yaw:-Math.PI/2,face:V3(3,0,2.6),stoop:1,skin:SK[2]});
def('m1',{sex:'m',top:0x3a5a8a,lower:0xf0ece0,flare:.2,mode:'talk',home:V3(3.6,0,-12.4),yaw:-Math.PI/2,face:V3(3.0,0,-12.4),moustache:1,skin:SK[5]});
def('m2',{sex:'m',top:0xc8a040,lower:0x2a2a34,flare:.18,mode:'talk',home:V3(2.4,0,-12.4),yaw:Math.PI/2,face:V3(3.6,0,-12.4),skin:SK[1]});
/* stool for the man hanging lights */
(function(){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.45,.5),new THREE.MeshStandardMaterial({color:0x4a2e1a}));m.position.set(-3.8,.22,-8);E.root.add(m);})();
W.people=W.people;W.pp=people;

/* ---------- camera ---------- */
const POSES={
  open:{p:[0,7.5,16],l:[0,5,-30]},street:{p:[0,1.7,9.5],l:[0,2.6,-20]},streetLow:{p:[-1,1.3,5.5],l:[2,1.8,-14]},
  tea:{p:[2.4,1.7,-5.5],l:[8.4,1.4,-14.5]},temple:{p:[0,2.1,-28],l:[0,6.5,-54]},
  kolam:{p:[-.4,1.7,8.2],l:[2.2,.6,3.2]},kids:{p:[-3.2,1.5,0],l:[.4,1.0,-8]},
  gate:{p:[0,2.4,-12],l:[0,24,-66]},gateWide:{p:[0,2.2,10],l:[0,16,-60]},up:{p:[0,1.8,-2],l:[0,20,-66]},
  fin:{p:[0,2.6,8],l:[0,9,-60]},dawnWide:{p:[0,3.2,12],l:[0,7,-60]}
};
const cam={p:V3(0,7.5,16),l:V3(0,5,-30),gp:V3(0,7.5,16),gl:V3(0,5,-30),k:1.6};
let px=0,py=0;
W.pose=function(n,k){const o=POSES[n];if(!o)return;cam.gp.set(...o.p);cam.gl.set(...o.l);cam.k=k||1.6;};
W.snapPose=function(n){W.pose(n);cam.p.copy(cam.gp);cam.l.copy(cam.gl);};
W.poses=POSES;
window.addEventListener('pointermove',e=>{px=(e.clientX/innerWidth-.5)*2;py=(e.clientY/innerHeight-.5)*2;},{passive:true});

/* ---------- world colour script ---------- */
const KEY={dusk:{t:[.09,.11,.3],m:[.52,.26,.34],h:[1,.52,.22]},night:{t:[.015,.025,.085],m:[.05,.06,.15],h:[.17,.1,.18]},dawn:{t:[.22,.36,.62],m:[.95,.55,.45],h:[1,.76,.35]},down:{t:[.04,0,.02],m:[.32,.02,.05],h:[.72,.1,.05]}};
const _c=[new THREE.Color(),new THREE.Color(),new THREE.Color()];
function lerp3(a,b,k,o){o.setRGB(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k);}
function mixKey(k1,k2,k,out){['t','m','h'].forEach((n,i)=>{const a=k1[n],b=k2[n];out[i].setRGB(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k);});}
function applyColours(t){
  const S=W.S,u=E.skyU;
  const base={t:[0,0,0],m:[0,0,0],h:[0,0,0]};
  ['t','m','h'].forEach(n=>{for(let i=0;i<3;i++){let v=KEY.dusk[n][i]+(KEY.night[n][i]-KEY.dusk[n][i])*S.night;v=v+(KEY.dawn[n][i]-v)*S.dawn;v=v+(KEY.down[n][i]-v)*S.down;base[n][i]=v;}});
  u.uTop.value.setRGB(...base.t);u.uMid.value.setRGB(...base.m);u.uHor.value.setRGB(...base.h);
  u.uTime.value=t;u.uDown.value=S.down;u.uStars.value=S.night*(1-S.dawn)*(1-S.down*.5);u.uFlash.value=S.flash;
  scene.fog.color.setRGB(base.h[0]*.35+.02,base.h[1]*.3+.01,base.h[2]*.3+.02);
  scene.fog.density=.013+.016*S.down-.004*S.dawn;
  const day=(1-S.night)*(1-S.down)+S.dawn;
  hemi.color.setRGB(base.m[0]*1.5+.1,base.m[1]*1.4+.1,base.m[2]*1.6+.12);hemi.groundColor.setRGB(.08,.06,.07);hemi.intensity=.55+.5*clamp(day,0,1)+S.flash*.5;
  sun.color.setRGB(1-.5*S.night*(1-S.dawn),.66+.1*S.night-.1*S.down,.4+.55*S.night*(1-S.dawn)+.1*S.dawn);sun.intensity=.7-.35*S.night*(1-S.dawn)+.4*S.dawn;
  warm.intensity=(.5+1.4*S.night)*(1-S.down*.6)*S.flk+S.dawn*.8;
  redL.intensity=3*S.down*S.gate;flashL.intensity=S.flash*60;
  const wl=(.25+1.0*S.night+.5*S.dawn)*(1-.65*S.down)*S.flk;
  E.windowMats.forEach(m=>m.emissiveIntensity=wl);
  E.lampMats.forEach(m=>m.emissiveIntensity=(S.night*1.6+S.dawn*.2)*(S.flk>.5?1:0));
  E.bulbMat.opacity=clamp((S.night*.95+S.dawn*.4)*(1-.75*S.down),0,1)*(S.flk>.5?1:.25);
  E.kolams.forEach(k=>{});
}

/* ---------- per-frame ---------- */
let steamT=0,sporeT=0,boltT=6,warmT=0,moodT=0;
W.bolt=function(target,quiet){
  const g=E.gate.pos,a=rand(0,Math.PI*2),r=rand(6,13);
  const from=V3(g.x+Math.cos(a)*r,g.y+Math.sin(a)*r*.9,g.z+1),to=target||V3(rand(-12,12),rand(0,5),-rand(8,50));
  const pts=E.fireBolt(from,to);
  pts.forEach((p,i)=>{if(i%2===0)sparks.emit(p.x,p.y,p.z,rand(-1,1),rand(-1,1),rand(-1,1),1,rand(.35,.6),rand(.3,.5),rand(.12,.3),.5,0,2,.8);});
  W.S.flash=reduce?.25:1;if(!reduce){const f=$('#flash');f.classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.remove('on')));}
  E.bulbMat.opacity=0;W.S.flk=0;W.after(.12,()=>{W.S.flk=1;});
  if(!quiet){Snd.buzz(0,.35,.16);Snd.thunder(rand(.25,.7),rand(.7,1));}
};
W.fireShell=function(x,y,type){
  const z=-rand(26,40),ty=y||rand(13,22),r={x:x,y:.5,z:z,ty:ty,t:0,up:rand(1.3,1.8),type:type||PV.pickType(),col:pick(PV.PAL)};
  W.rockets.push(r);Snd.shell(0,r.up,clamp(x/20,-1,1)*.7,rand(.8,1.05),r.type==='crackle');
};
W.rockets=[];
const camTmp=V3(0,0,0);
st.update=function(dt){
  W.clock+=dt;const t=W.clock,S=W.S;
  for(let i=W.sched.length-1;i>=0;i--)if(W.sched[i].t<=t){const f=W.sched[i].fn;W.sched.splice(i,1);f();}
  for(const k in W.Tg){const d=W.Tg[k]-S[k],r=W.rate[k];S[k]+=Math.sign(d)*Math.min(Math.abs(d),r*dt);}
  S.flash*=Math.exp(-7*dt);
  /* flicker while dread is high */
  if(S.dread>.25&&Math.random()<dt*(2+S.dread*6)){S.flk=0;W.after(rand(.05,.18),()=>{S.flk=1;});}
  /* camera */
  const k=1-Math.exp(-cam.k*dt);
  cam.p.lerp(cam.gp,k);cam.l.lerp(cam.gl,k);
  const sw=reduce?0:1;
  camera.position.set(cam.p.x+px*.45*sw+Math.sin(t*.37)*.05*sw,cam.p.y-py*.18*sw+Math.sin(t*.53)*.03*sw,cam.p.z);
  camTmp.set(cam.l.x+px*1.2*sw,cam.l.y,cam.l.z);camera.lookAt(camTmp);
  warm.position.set(camera.position.x,camera.position.y+1.5,camera.position.z-6);
  /* gate, vines, colours */
  E.gate.u.uTime.value=t;E.gate.u.uOpen.value=S.gate;E.gate.halo.material.opacity=.4*S.gate*(.8+Math.sin(t*2)*.2);
  E.setVines(S.vines,1);
  applyColours(t);E.updateEnv(dt,t);
  /* diya flames by night (auto ones) */
  E.diyas.forEach(d=>{if(!d.story&&d.auto)E.light(d,S.night>.45&&S.down<.9||d.force);});
  /* people */
  const ctx={gate:E.gate.pos};
  W.people.forEach(p=>p.update(dt,t,ctx));
  /* kids with sparklers in the finale */
  W.people.forEach(p=>{if(p.sparklerOn&&p.mode!=='hidden'){const v=camTmp.clone();p.arm[1].hand.getWorldPosition(v);for(let i=0;i<4;i++)sparks.emit(v.x,v.y+.1,v.z,rand(-1.4,1.4),rand(.5,2),rand(-1.4,1.4),1,rand(.75,.9),rand(.4,.6),rand(.2,.4),.05,4,1.4,.8);}});
  /* dogs and cow */
  E.dogs.forEach(function(d,i){
    d.t+=dt;const s=d.state;let ty=0,hx=0,legs=0;
    if(s==='sleep'){d.body.position.y=-.14;d.head.rotation.x=.55;d.legs.forEach((l,j)=>l.rotation.x=j<2?-1.1:1.1);d.tail.rotation.y=0;}
    else{d.body.position.y=0;
      if(s==='alert'){d.head.rotation.x=-.15;d.legs.forEach(l=>l.rotation.x=0);}
      else if(s==='bark'){d.head.rotation.x=-.25+Math.max(0,Math.sin(d.t*9))*-.25;d.body.position.z=Math.max(0,Math.sin(d.t*9))*.04;d.legs.forEach(l=>l.rotation.x=0);}
      else if(s==='happy'){d.head.rotation.x=0;d.tail.rotation.y=Math.sin(d.t*14)*.7;d.legs.forEach(l=>l.rotation.x=0);}
      else if(s==='flee'){const dx=d.g.position.x>0?1:-1;d.g.position.x+=dx*6.5*dt;d.g.position.z-=2.2*dt;d.g.rotation.y=ang2(d.g.rotation.y,Math.atan2(dx,-.3),.2);d.legs.forEach((l,j)=>l.rotation.x=Math.sin(d.t*16+j*1.6)*.9);if(Math.abs(d.g.position.x)>40){d.g.visible=false;d.state='gone';}}
    }
  });
  E.cows.forEach(c=>{c.t+=dt;c.head.rotation.x=.12+Math.sin(c.t*2.6)*.03;});
  if(E.bell)E.bell.rotation.z*=Math.exp(-1.1*dt),E.bell.rotation.z+=Math.sin(t*9)*.0;
  if(W.bellSwing>0){W.bellSwing-=dt;E.bell.rotation.z=Math.sin(t*7)*.35*Math.min(1,W.bellSwing);}
  /* kolam reveal */
  E.kolams.forEach(k=>{if(k.reveal!=null){k.reveal=Math.min(1,k.reveal+dt*.5);k.material.opacity=k.reveal*.95;}});
  /* steam from the kettle (spores when it is dark) */
  steamT+=dt;if(steamT>.05&&S.night>.1){steamT=0;const a=E.anchors.kettle;const dn=S.down;sparks===null||st.bits.emit(a.x+rand(-.04,.04),a.y,a.z+rand(-.04,.04),rand(-.1,.1),rand(.5,.9),rand(-.1,.1),dn>.5?.6:.9,dn>.5?.15:.9,dn>.5?.1:.95,rand(.9,1.5),.2,-.15,.9,0);}
  /* spores and ash in the Upside Down */
  sporeT+=dt;const rate=S.down*(mobile?28:60);while(sporeT>1/Math.max(rate,1)&&S.down>.05){sporeT-=1/Math.max(rate,1);if(sporeT>1)sporeT=0;
    sparks.emit(camera.position.x+rand(-14,14),rand(.3,9),camera.position.z-rand(2,34),rand(-.15,.15),rand(.25,.8),rand(-.15,.15),1,rand(.45,.7),rand(.25,.4),rand(4,7),.05,-.02,.3,.6);}
  /* random lightning when the gate is open */
  boltT-=dt;if(boltT<=0){boltT=rand(3.5,8);if(S.down>.6&&S.gate>.6&&W.autoBolt!==false)W.bolt();}
  /* shells */
  for(let i=W.rockets.length-1;i>=0;i--){const r=W.rockets[i];r.t+=dt;const u=Math.min(1,r.t/r.up),y=.5+(r.ty-.5)*u*u;
    for(let q=0;q<3;q++)sparks.emit(r.x+rand(-.04,.04),y,r.z,rand(-.4,.4),rand(-2,-.6),rand(-.4,.4),1,rand(.55,.75),.28,rand(.35,.6),.12,2,1.2,.6);
    if(u>=1){PV.burst(sparks,r.x,y,r.z,{type:r.type,col:r.col,scale:rand(1.4,1.9),later:(s,f)=>W.after(s,f)});S.flash=Math.max(S.flash,.0);W.rockets.splice(i,1);}}
  /* ambient mood to the sound engine */
  moodT+=dt;if(moodT>.25){moodT=0;Snd.setMood({night:S.night,dread:S.dread,crowd:S.calm*(1-S.night*.4)});}
  W.emit('frame',dt);
};
function ang2(a,b,k){let d=b-a;while(d>Math.PI)d-=6.283185;while(d<-Math.PI)d+=6.283185;return a+d*k;}
st.visible=false;W.ready=true;
W.setActive=function(v){st.visible=v;};
/* finish the scene state */
W.snapState=function(o){Object.assign(W.Tg,o);Object.assign(W.S,o);};
})();
