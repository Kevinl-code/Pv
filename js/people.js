/* Procedural villagers: proportioned bodies, Tamil clothing, pose-blended behaviours. */
(function(){
'use strict';
if(!window.THREE)return;
const {rand,clamp,pick}=PV;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const SKIN=[0x8a5a3c,0xa06a45,0x6e4429,0xb57a52,0x7d4e32,0x946040];
const mc={};
function mat(c,o){const k=c+JSON.stringify(o||{});return mc[k]||(mc[k]=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o||{})));}
const gc={};
function cylG(rt,rb,h,seg){const k=[rt,rb,h,seg].join();return gc[k]||(gc[k]=new THREE.CylinderGeometry(rt,rb,h,seg||12));}
const SPH=new THREE.SphereGeometry(1,14,10),BOX=new THREE.BoxGeometry(1,1,1);
function add(p,g,m,x,y,z,sx,sy,sz){const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(sx)o.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);o.castShadow=true;p.add(o);return o;}
function sph(p,m,x,y,z,rx,ry,rz){return add(p,SPH,m,x,y,z,rx,ry==null?rx:ry,rz==null?rx:rz);}
function box(p,m,x,y,z,w,h,d){return add(p,BOX,m,x,y,z,w,h,d);}
function ang(a,b,k){let d=b-a;while(d>Math.PI)d-=6.283185;while(d<-Math.PI)d+=6.283185;return a+d*k;}

function make(o){
  const s=o.scale||1,skin=mat(o.skin||pick(SKIN)),top=mat(o.top||0xf0e6d0),root=new THREE.Group();
  const hips=new THREE.Group();hips.position.y=.96*s;root.add(hips);
  const torso=new THREE.Group();hips.add(torso);
  /* torso */
  const woman=o.sex==='f';
  add(torso,cylG(.15*s,.125*s,.54*s,14),top,0,.27*s,0,woman?1.15:1.28,1,woman?.78:.8);
  if(woman&&o.sari)box(torso,mat(o.sari2||o.sari),-.03*s,.28*s,.075*s,.2*s,.62*s,.03*s).rotation.z=-.5;     /* pallu across the chest */
  if(o.towel)box(torso,mat(o.towel),-.17*s,.5*s,0,.1*s,.06*s,.2*s);                                            /* thundu on the shoulder */
  add(torso,cylG(.045*s,.055*s,.1*s,8),skin,0,.57*s,0);
  const head=new THREE.Group();head.position.set(0,.68*s,0);torso.add(head);
  sph(head,skin,0,0,0,.098*s,.118*s,.105*s);
  [-1,1].forEach(function(e){sph(head,mat(0x120a06),e*.04*s,.012*s,.095*s,.012*s);sph(head,skin,e*.1*s,0,0,.02*s,.03*s,.015*s);});
  sph(head,skin,0,-.018*s,.11*s,.016*s,.02*s,.016*s);
  const hair=mat(o.hair==null?0x0a0705:o.hair);
  if(woman){
    sph(head,hair,0,.02*s,-.015*s,.106*s,.118*s,.11*s);
    sph(head,mat(0xd0222f),0,.055*s,.1*s,.011*s);                              /* bindi */
    if(o.age!=='kid'){const br=add(head,cylG(.03*s,.018*s,.5*s,8),hair,0,-.3*s,-.12*s);br.rotation.x=.1;}
    if(o.jasmine)for(let i=0;i<8;i++)sph(head,mat(0xfffaf0,{emissive:0x444030}),Math.cos(i*.8)*.06*s,.1*s,-.12*s+Math.sin(i*.8)*.04*s,.02*s);
  }else{
    sph(head,hair,0,.03*s,-.02*s,.104*s,.108*s,.108*s);
    if(o.moustache)box(head,hair,0,-.04*s,.098*s,.07*s,.016*s,.02*s);
  }
  /* arms */
  const arm=[];
  [-1,1].forEach(function(sd){
    const sh=new THREE.Group();sh.position.set(sd*.205*s,.5*s,0);torso.add(sh);
    add(sh,cylG(.05*s,.042*s,.3*s,8),o.long?top:top,0,-.15*s,0);
    const el=new THREE.Group();el.position.y=-.3*s;sh.add(el);
    add(el,cylG(.04*s,.034*s,.27*s,8),o.long?top:skin,0,-.135*s,0);
    const hand=new THREE.Group();hand.position.y=-.29*s;el.add(hand);sph(hand,skin,0,0,0,.042*s,.05*s,.03*s);
    arm.push({sh,el,hand});
  });
  /* legs */
  const leg=[];
  const legMat=o.legs?mat(o.legs):skin;
  [-1,1].forEach(function(sd){
    const th=new THREE.Group();th.position.set(sd*.085*s,0,0);hips.add(th);
    add(th,cylG(.072*s,.056*s,.46*s,10),legMat,0,-.23*s,0);
    const kn=new THREE.Group();kn.position.y=-.46*s;th.add(kn);
    add(kn,cylG(.054*s,.04*s,.44*s,10),o.legs&&!o.shorts?legMat:skin,0,-.22*s,0);
    box(kn,mat(0x3a2a1a),0,-.45*s,.05*s,.085*s,.04*s,.22*s);
    leg.push({th,kn});
  });
  /* lower garment */
  if(o.lower){
    const L=mat(o.lower,{side:THREE.DoubleSide}),h=(o.hem||.82)*s;
    add(hips,cylG(.175*s,(o.flare||.26)*s,h,18),L,0,-h/2+.03*s,0);
    add(hips,cylG((o.flare||.26)*s+.002,(o.flare||.26)*s+.002,.07*s,18),mat(o.border||0xe8b030,{metalness:.5,roughness:.5}),0,-h+.07*s,0);
  }
  if(o.frock)add(hips,cylG(.15*s,.3*s,.42*s,16),mat(o.frock,{side:THREE.DoubleSide}),0,-.14*s,0);
  /* props */
  const hR=arm[1].hand,hL=arm[0].hand;let stream=null;
  if(o.stick){const st=add(hR,cylG(.014*s,.014*s,.95*s,6),mat(0x5a3a1a),0,-.4*s,0);}
  if(o.phone)box(hR,mat(0x111116,{emissive:0x335577,emissiveIntensity:.8}),0,0,.02*s,.05*s,.1*s,.01*s);
  if(o.tray){const tr=add(hR,cylG(.2*s,.2*s,.02*s,16),mat(0xc8a040,{metalness:.7,roughness:.4}),.1*s,-.02*s,.12*s);for(let i=0;i<7;i++)sph(tr,mat(pick([0xe8a040,0xf0d080,0xb86020])),Math.cos(i)*.11,.04,Math.sin(i)*.11,.05,.04,.05);}
  if(o.glass){const gl=add(hR,cylG(.032*s,.026*s,.09*s,10),mat(0xb8bcc4,{metalness:.9,roughness:.3}),0,-.05*s,.03*s);if(o.glass===2)add(hL,cylG(.032*s,.026*s,.09*s,10),mat(0xb8bcc4,{metalness:.9,roughness:.3}),0,-.05*s,.03*s);}
  if(o.pourStream){stream=new THREE.Mesh(cylG(.012,.012,1,6),mat(0xb8803a,{transparent:true,opacity:.85}));stream.visible=false;}
  root.scale.setScalar(1);
  const P={root,hips,torso,head,arm,leg,s,o,stream,mode:o.mode||'idle',t:rand(0,9),yaw:o.yaw||0,home:o.home?o.home.clone():V3(0,0,0),
    path:o.path||null,pi:0,dir:1,speed:o.speed||1.1,face:o.face||null,lift:o.lift||0,center:o.center||null,rad:o.rad||3,stage:0,st:0,door:null,hidden:false,spin:rand(0,6),
    J:{aLx:0,aLz:.07,eL:.12,aRx:0,aRz:-.07,eR:.12,lLx:0,kL:0,lRx:0,kR:0,tx:0,hy:0,hx:0,hipY:0,hz:0}};
  root.position.copy(P.home);root.rotation.y=P.yaw;
  P.set=function(m,x){P.mode=m;P.stage=0;P.st=0;if(x)Object.assign(P,x);if(m!=='hidden'){root.visible=true;P.hidden=false;}};
  P.update=function(dt,t,W){
    if(P.mode==='hidden'){root.visible=false;if(P.stream)P.stream.visible=false;if(P.tyre)P.tyre.visible=false;return;}
    if(P.tyre)P.tyre.visible=P.mode==='play';
    P.t+=dt;P.st+=dt;const T=P.J,ttt=P.t,k=1-Math.exp(-7*dt);
    const g={aLx:0,aLz:.07,eL:.12,aRx:0,aRz:-.07,eR:.12,lLx:0,kL:0,lRx:0,kR:0,tx:0,hy:0,hx:0,hipY:0,hz:0};
    let moving=false,run=false,faceYaw=null;
    const br=Math.sin(ttt*1.6+P.spin)*.012;g.tx=br;
    switch(P.mode){
      case 'talk':
        g.aRx=-.9+Math.sin(ttt*2.1)*.35;g.eR=1.1+Math.sin(ttt*3.3)*.4;g.hy=Math.sin(ttt*.9)*.25;g.hx=Math.sin(ttt*2.4)*.08;g.aLx=-.2;g.eL=.7;break;
      case 'idle':g.hy=Math.sin(ttt*.5+P.spin)*.35;break;
      case 'walk':case 'run':moving=true;run=P.mode==='run';break;
      case 'play':moving=true;run=true;break;
      case 'diya':g.hipY=-.46*P.s;g.lLx=-1.45;g.kL=2.2;g.lRx=-1.45;g.kR=2.2;g.tx=.55;g.aRx=-1.0;g.eR=.3;g.aLx=-.6;g.eL=.6;g.hx=.3;break;
      case 'kolam':g.hipY=-.46*P.s;g.lLx=-1.45;g.kL=2.2;g.lRx=-1.45;g.kR=2.2;g.tx=.85+Math.sin(ttt*.6)*.06;g.aRx=-1.2+Math.sin(ttt*1.9)*.35;g.aRz=-.25+Math.sin(ttt*1.9+1)*.35;g.eR=.2;g.aLx=-.7;g.eL=.3;g.hx=.3;break;
      case 'hang':g.aLx=-2.7+Math.sin(ttt*1.3)*.1;g.aRx=-2.5+Math.sin(ttt*1.1+1)*.2;g.eL=.2;g.eR=.3;g.tx=-.1;g.hx=-.35;g.hy=Math.sin(ttt*.4)*.2;break;
      case 'pour':{const w=Math.sin(ttt*2.3);g.aRx=-2.0+w*.9;g.aLx=-.5-w*.6;g.eR=.5;g.eL=1.2;g.tx=-w*.12;g.hx=.1;break;}
      case 'sit':g.hipY=-.4*P.s;g.lLx=-1.5;g.kL=1.5;g.lRx=-1.5;g.kR=1.5;g.aLx=-.5;g.eL=.9;g.aRx=-.55;g.eR=1.2;g.hy=Math.sin(ttt*.5+P.spin)*.3;
        if(P.o.sip&&Math.sin(ttt*.45+P.spin)>.7){g.aRx=-1.1;g.eR=2.3;g.hx=-.15;}if(P.o.work){g.aRx=-.9+Math.sin(ttt*3)*.2;g.tx=.25;g.hx=.3;}break;
      case 'selfie':g.aRx=-1.5;g.eR=1.3;g.aRz=-.3;g.hy=-.35;g.hx=.05;g.hz=-.12;break;
      case 'panic':{
        if(P.stage===0){faceYaw=Math.atan2(W.gate.x-root.position.x,W.gate.z-root.position.z);g.aLx=-.9;g.eL=2.0;g.aRx=-.9;g.eR=2.0;g.hx=-.25;g.tx=-.12;g.lLx=.25;g.lRx=-.15;if(P.st>.9+(P.o.delay||0)){P.stage=1;P.st=0;}}
        else if(P.stage===1){moving=true;run=true;g.aLx=-.9;g.aRx=-.9;g.eL=1.8;g.eR=1.8;
          const d=P.door.clone().sub(root.position);d.y=0;const L=d.length();
          if(L<.5){P.stage=2;}else{d.multiplyScalar(1/L);root.position.addScaledVector(d,3.3*dt);faceYaw=Math.atan2(d.x,d.z);}}
        else{P.set('hidden');}
        break;}
      case 'celebrate':{const j=Math.abs(Math.sin(ttt*4+P.spin));g.hipY=-.02+j*.12*P.s;g.aLx=-2.7+Math.sin(ttt*6)*.3;g.aRx=-2.7-Math.sin(ttt*6)*.3;g.eL=.3;g.eR=.3;g.lLx=-j*.5;g.lRx=-j*.5;g.kL=j*.8;g.kR=j*.8;g.hx=-.2;g.hy=Math.sin(ttt*2)*.3;if(P.face)faceYaw=Math.atan2(P.face.x-root.position.x,P.face.z-root.position.z);break;}
    }
    /* locomotion along a path or around a centre */
    if(moving&&P.mode!=='panic'){
      let tgt=null;
      if(P.mode==='play'&&P.center){P.spin+=dt*(P.speed/P.rad);const a=P.spin;const nx=P.center.x+Math.cos(a)*P.rad,nz=P.center.z+Math.sin(a)*P.rad;faceYaw=Math.atan2(nx-root.position.x,nz-root.position.z);root.position.x=nx;root.position.z=nz;
        if(P.tyre){P.tyre.position.set(root.position.x+Math.sin(faceYaw)*.55,.28,root.position.z+Math.cos(faceYaw)*.55);P.tyre.rotation.set(0,faceYaw+1.57,P.t*-9);P.tyre.rotation.order='YXZ';}}
      else if(P.path){tgt=P.path[P.pi];const d=tgt.clone().sub(root.position);d.y=0;const L=d.length();
        if(L<.25){P.pi+=P.dir;if(P.pi>=P.path.length||P.pi<0){P.dir*=-1;P.pi=clamp(P.pi,0,P.path.length-1)+P.dir;}}
        else{d.multiplyScalar(1/L);root.position.addScaledVector(d,P.speed*dt);faceYaw=Math.atan2(d.x,d.z);}}
      const ph=ttt*(run?11:6.2),A=run?.95:.5;
      g.lLx=Math.sin(ph)*A;g.lRx=-Math.sin(ph)*A;g.kL=Math.max(0,-Math.sin(ph+1.2))*(run?1.5:.7);g.kR=Math.max(0,Math.sin(ph+1.2))*(run?1.5:.7);
      if(P.mode!=='panic'||P.stage!==1){g.aLx=-Math.sin(ph)*A*.9;g.aRx=Math.sin(ph)*A*.9;g.eL=run?1.0:.3;g.eR=run?1.0:.3;}
      g.hipY=-Math.abs(Math.sin(ph))*.025*P.s;
    }
    if(P.mode==='panic'&&P.stage===1){const ph=ttt*12;g.lLx=Math.sin(ph)*1.0;g.lRx=-Math.sin(ph)*1.0;g.kL=Math.max(0,-Math.sin(ph+1.2))*1.5;g.kR=Math.max(0,Math.sin(ph+1.2))*1.5;g.hipY=-Math.abs(Math.sin(ph))*.03;}
    if(!moving&&P.face&&faceYaw==null&&(P.mode==='talk'||P.mode==='idle'||P.mode==='sit'||P.mode==='pour'))faceYaw=Math.atan2(P.face.x-root.position.x,P.face.z-root.position.z);
    if(faceYaw!=null)P.yaw=ang(P.yaw,faceYaw,1-Math.exp(-(moving?9:4)*dt));
    root.rotation.y=P.yaw;
    if(P.o.stoop)g.tx+=.16;
    for(const key in g)T[key]+=(g[key]-T[key])*k;
    arm[0].sh.rotation.set(T.aLx,0,-T.aLz*-1);arm[0].sh.rotation.z=T.aLz;arm[1].sh.rotation.set(T.aRx,0,T.aRz);
    arm[0].el.rotation.x=-T.eL;arm[1].el.rotation.x=-T.eR;
    leg[0].th.rotation.x=T.lLx;leg[0].kn.rotation.x=T.kL;leg[1].th.rotation.x=T.lRx;leg[1].kn.rotation.x=T.kR;
    torso.rotation.x=T.tx;head.rotation.y=T.hy;head.rotation.x=T.hx;head.rotation.z=T.hz;
    hips.position.y=.96*P.s+T.hipY+(P.mode==='hang'?0:0);root.position.y=P.lift;
    if(P.stream&&P.mode!=='pour')P.stream.visible=false;
    if(P.stream&&P.mode==='pour'){const a=new THREE.Vector3(),b=new THREE.Vector3();arm[1].hand.getWorldPosition(a);arm[0].hand.getWorldPosition(b);
      const d=b.clone().sub(a),L=d.length();P.stream.visible=true;P.stream.position.copy(a).addScaledVector(d,.5);P.stream.scale.set(1,Math.max(.01,L),1);P.stream.quaternion.setFromUnitVectors(V3(0,1,0),d.multiplyScalar(1/Math.max(L,.01)));}
  };
  return P;
}
PV.People={make:make,SKIN:SKIN};
})();
