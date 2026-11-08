
/* ================= CRACKER LAB ================= */
(function(){
const {$,rand,clamp,pick,reduce,Snd,Sparks,PAL,burst,makeStage}=PV;
let inited=false;
function init(){
  const canvas=$('#c-lab');
  const st=makeStage(canvas,45,5200,true);if(!st)return;
  const {scene,camera,sparks}=st;
  /* normal-blend pool for paper bits and smoke */
  st.bits=new Sparks(scene,900,false);
  const bits=st.bits;bits.mat.uniforms.uScale.value=sparks.mat.uniforms.uScale.value;
  st.resize();

  /* lights */
  scene.add(new THREE.AmbientLight(0xffe8cf,.55));
  const key=new THREE.DirectionalLight(0xffd7a8,.9);key.position.set(4,9,9);scene.add(key);
  const rim=new THREE.DirectionalLight(0x7a5cff,.5);rim.position.set(-6,4,-6);scene.add(rim);
  const fl=[new THREE.PointLight(0xffa040,0,26,2),new THREE.PointLight(0xffa040,0,26,2)];
  fl.forEach(l=>scene.add(l));let flN=0;
  function flash(x,y,z,color,power){const l=fl[flN++%2];l.position.set(x,y,z);l.color.set(color);l.intensity=power;}

  /* platform */
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(15,15.4,.4,72),new THREE.MeshStandardMaterial({color:0x1b1424,roughness:.95}));
  floor.position.y=-.2;scene.add(floor);
  const trim=new THREE.Mesh(new THREE.TorusGeometry(15.2,.06,8,96),new THREE.MeshBasicMaterial({color:0xffc83d}));trim.rotation.x=Math.PI/2;scene.add(trim);

  function mat(c,o){o=o||{};return new THREE.MeshStandardMaterial({color:c,roughness:o.r==null?.7:o.r,metalness:o.m||0,emissive:o.e||0x000000,emissiveIntensity:o.ei||1,transparent:!!o.tr,opacity:o.op==null?1:o.op});}
  function label(text,bg,fg,w,h){
    const c=document.createElement('canvas');c.width=w||512;c.height=h||256;const x=c.getContext('2d');
    x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
    x.strokeStyle=fg;x.lineWidth=6;x.setLineDash([14,10]);x.strokeRect(14,14,c.width-28,c.height-28);x.setLineDash([]);
    x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font='900 '+Math.floor(c.height*.3)+'px "Big Shoulders Display",Impact,sans-serif';
    const parts=text.split('|');
    parts.forEach((p,i)=>x.fillText(p,c.width/2,c.height*(parts.length===1?.5:.34+i*.34)));
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  function spiralTex(){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle='#c4202f';x.fillRect(0,0,256,256);x.strokeStyle='#ffc83d';x.lineWidth=9;x.beginPath();
    for(let a=0;a<28;a+=.08){const r=4+a*4.4;x.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r);}x.stroke();
    return new THREE.CanvasTexture(c);
  }

  /* ---- the seven models ---- */
  const defs=[];
  function def(o){defs.push(o);return o;}

  def({id:'sparkler',ta:'கம்பி மத்தாப்பு',en:'Sparkler',kind:'Hand-held',loud:22,burn:'6 s',
    sound:'A dry, steady sizzle. Hundreds of tiny crackles every second, bright and high, like rain on a tin roof.',
    make(){const g=new THREE.Group();
      const rod=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,3.4,8),mat(0x777b85,{m:.8,r:.4}));rod.position.y=1.7;g.add(rod);
      const coat=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2,10),mat(0x2a2a30,{r:.9}));coat.position.y=2.4;g.add(coat);
      const tip=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xffe9a8}));tip.position.y=3.42;tip.visible=false;g.add(tip);g.userData.tip=tip;
      const base=new THREE.Mesh(new THREE.CylinderGeometry(.4,.5,.3,16),mat(0x3a2a20));base.position.y=.15;g.add(base);
      return g;},
    fuseLocal:[0,3.45,0],cam:{h:3.2,d:8.5},dur:6.2,
    fire(g,P){
      const T=.8,burn=4.6;Snd.fuse(0,T,0);Snd.sparkler(T,burn);
      const tip=g.userData.tip;
      P.later(T,function(){tip.visible=true;});
      P.run(T,burn,function(el){
        const u=el/burn,y=3.42-u*1.8;tip.position.y=y;
        const wx=g.position.x,wy=y,wz=g.position.z;
        for(let i=0;i<5;i++){
          const a=rand(0,6.28),b=rand(-1,1),r=Math.sqrt(1-b*b),s=rand(1.2,3.6);
          sparks.emit(wx,wy,wz,Math.cos(a)*r*s,b*s,Math.sin(a)*r*s,1,rand(.78,.95),rand(.45,.8),rand(.22,.5),.06,5,1.2,.8);
        }
        flash(wx,wy+.3,wz+.5,0xffb060,2.2+Math.random()*1.4);
      },function(){tip.visible=false;});
      return T+burn+.3;}});

  def({id:'pot',ta:'பூத்தொட்டி',en:'Flower Pot',kind:'Fountain',loud:38,burn:'6 s',
    sound:'A rising hiss that swells into a roaring fountain, with soft pops each time the colour changes.',
    make(){const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.5,.82,1.5,28,1,true),new THREE.MeshStandardMaterial({map:label('POO|THOTTI','#c4202f','#ffc83d',512,512),roughness:.8,side:THREE.DoubleSide}));
      body.position.y=.75;g.add(body);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.05,28),mat(0xd8c9a0));top.position.y=1.48;g.add(top);
      const bot=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.06,28),mat(0x7a1420));bot.position.y=.03;g.add(bot);
      const fz=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.4,5),mat(0xd8c9a0));fz.position.set(.15,1.7,0);fz.rotation.z=-.4;g.add(fz);
      return g;},
    fuseLocal:[.28,1.88,0],cam:{h:2.6,d:8.5},dur:7.6,
    fire(g,P){
      const T=1.1,burn=5.6;Snd.fuse(0,T,0);Snd.flowerpot(T,burn);
      const wx=g.position.x,wz=g.position.z;
      P.run(T,burn,function(el){
        const u=el/burn,prof=Math.min(1,el/.9)*Math.min(1,(burn-el)/1.2+.15);
        const ph=u<.36?0:u<.7?1:2;
        const cols=[[[1,.82,.35],[1,.55,.15]],[[1,.25,.35],[1,.9,.85]],[[.25,.95,.8],[.7,.5,1]]][ph];
        for(let i=0;i<9;i++){
          const a=rand(0,6.28),sp=rand(0,.38),s=rand(6,10.5)*prof,c=pick(cols);
          sparks.emit(wx,1.55,wz,Math.cos(a)*sp*s*.7,s,Math.sin(a)*sp*s*.7,c[0],c[1],c[2],rand(.8,1.5),.09,10,.5,.5);
        }
        flash(wx,2.2,wz+1.2,ph===0?0xffb060:ph===1?0xff4060:0x40ffd0,4*prof+.5);
      });
      P.later(T+burn*.36,function(){P.pop(wx,2.2,wz);});
      P.later(T+burn*.7,function(){P.pop(wx,2.2,wz);});
      return T+burn+.3;}});

  def({id:'chakkaram',ta:'சக்கரம்',en:'Ground Chakkaram',kind:'Spinner',loud:44,burn:'6 s',
    sound:'A whirring whistle that climbs as the wheel spins up, then falls away. The pitch follows the speed.',
    make(){const g=new THREE.Group();
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,.14,48),[mat(0x8a1522),new THREE.MeshStandardMaterial({map:spiralTex(),roughness:.8}),mat(0x8a1522)]);
      disc.position.y=.12;g.add(disc);g.userData.disc=disc;
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.2,12),mat(0xffc83d,{m:.7,r:.3}));hub.position.y=.2;disc.add(hub);hub.position.y=.08;
      const fz=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.5,5),mat(0xd8c9a0));fz.position.set(.7,.38,0);fz.rotation.z=-.7;g.add(fz);
      return g;},
    fuseLocal:[.88,.62,0],cam:{h:1.6,d:8.2},dur:7.4,
    fire(g,P){
      const T=1.0,burn=5.6,spin=1.2;Snd.fuse(0,T,0);Snd.chakkaram(T,burn);
      const disc=g.userData.disc;let ang=0;
      P.run(T,burn,function(el,dt){
        const w=(el<spin?el/spin:el>burn-1?Math.max(.05,burn-el):1)*36;
        ang+=w*dt;disc.rotation.y=ang;
        const hop=el<burn-.8?Math.abs(Math.sin(el*5.3))*.05:0;g.position.y=hop;
        const wx=g.position.x,wz=g.position.z;
        if(w>3){
          for(let n=0;n<2;n++){
            const a=ang+n*Math.PI,rx=Math.cos(a),rz=Math.sin(a),tx=-rz,tz=rx;
            for(let k=0;k<4;k++){
              const s=rand(2.8,5);
              sparks.emit(wx+rx*.9,.3+hop,wz+rz*.9,rx*s*.7-tx*s*.9,rand(.2,1.2),rz*s*.7-tz*s*.9,1,rand(.62,.85),rand(.25,.5),rand(.5,.95),.08,4,1,.5);
            }
          }
          flash(wx,.8,wz+1.4,0xff9a40,3*Math.min(1,w/20));
        }
      },function(){g.position.y=0;});
      return T+burn+.3;}});

  def({id:'rocket',ta:'வானம் ராக்கெட்',en:'Sky Rocket',kind:'Aerial',loud:70,burn:'4 s',
    sound:'Fuse hiss, a sharp whoosh and a thin rising whistle. Then a hollow boom high up and a scatter of cracks.',
    make(){const g=new THREE.Group();
      const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.26,.3,.9,18),mat(0x2f8f78,{tr:true,op:.55,r:.2}));bottle.position.y=.45;g.add(bottle);
      const fly=new THREE.Group();g.add(fly);g.userData.fly=fly;
      const stick=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.6,6),mat(0xb58a4a));stick.position.y=1.3;fly.add(stick);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,1.5,20),new THREE.MeshStandardMaterial({map:label('VAANAM','#1d3a7a','#ffc83d',256,512),roughness:.7}));body.position.y=3.2;fly.add(body);
      const nose=new THREE.Mesh(new THREE.ConeGeometry(.2,.55,20),mat(0xc4202f));nose.position.y=4.2;fly.add(nose);
      const fz=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.35,5),mat(0xd8c9a0));fz.position.set(0,2.35,.18);fz.rotation.x=.5;fly.add(fz);
      return g;},
    fuseLocal:[0,2.4,.28],cam:{h:3,d:9.5},tall:true,dur:6,
    fire(g,P){
      const T=1.2,up=1.8,top=15;Snd.fuse(0,T,0);Snd.rocket(T,up,.18);
      const fly=g.userData.fly,wx=g.position.x,wz=g.position.z;
      P.tall(T+up+2.2);
      P.run(T,up,function(el){
        const u=el/up,y=top*u*u;fly.position.y=y;fly.position.x=Math.sin(el*18)*.03*u;
        for(let i=0;i<7;i++)sparks.emit(wx,y+2.3,wz,rand(-.5,.5),rand(-3,-1),rand(-.5,.5),1,rand(.55,.78),.28,rand(.4,.8),.1,3,1.2,.6);
        flash(wx,y+2.3,wz+1,0xffa040,3);
      },function(){
        const y=top+2.3;fly.visible=false;
        burst(sparks,wx,y,wz,{type:'crackle',col:pickCol(),scale:1.6,later:P.later});
        flash(wx,y,wz+2,0xffd090,14);P.shake(.25);P.later(.85,function(){Snd.crackleAt(0,1.2,38,.4);});
      });
      P.later(T+up+2.6,function(){fly.visible=true;fly.position.set(0,0,0);});
      return T+up+2.6;}});

  def({id:'lakshmi',ta:'லட்சுமி வெடி',en:'Lakshmi Vedi',kind:'Sound',loud:92,burn:'2 s',
    sound:'One hard crack and a chest thump. Short, flat and very loud. You hear it streets away.',
    make(){const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.8,20),new THREE.MeshStandardMaterial({map:label('LAKSHMI|VEDI','#8a1522','#ffc83d',256,256),roughness:.8}));body.position.y=.4;g.add(body);
      const ring=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.06,20),mat(0xffc83d,{m:.6,r:.4}));ring.position.y=.78;g.add(ring);
      const fz=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.55,5),mat(0xd8c9a0));fz.position.set(.06,1.05,0);fz.rotation.z=-.25;g.add(fz);
      return g;},
    fuseLocal:[.13,1.32,0],cam:{h:.8,d:6.8},dur:3.6,
    fire(g,P){
      const T=1.5;Snd.fuse(0,T,0);Snd.lakshmi(T);
      const wx=g.position.x,wz=g.position.z;
      P.later(T,function(){
        g.visible=false;P.bang(wx,.6,wz,1);
      });
      P.later(T+1.8,function(){g.visible=true;});
      return T+1.8;}});

  def({id:'ladi',ta:'லடி வெடி',en:'Ladi Vedi',kind:'String',loud:68,burn:'5 s',
    sound:'Hundreds of fast cracks in a rippling roll. A little louder in the middle, tapering to pops.',
    N:44,
    make(){const g=new THREE.Group();
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.2,6),mat(0xb58a4a));pole.rotation.z=Math.PI/2;pole.position.y=4.4;g.add(pole);
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,4.4,6),mat(0xb58a4a));post.position.set(-1.05,2.2,0);g.add(post);
      const N=this.N,inst=new THREE.InstancedMesh(new THREE.CylinderGeometry(.075,.075,.3,10),new THREE.MeshStandardMaterial({color:0xc4202f,roughness:.7}),N);
      const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
      for(let i=0;i<N;i++){
        const y=4.25-i*.092,ph=i*.5;
        e.set(rand(-.2,.2),rand(0,3),rand(-.35,.35));q.setFromEuler(e);
        m.compose(new THREE.Vector3(Math.sin(ph)*.07,y,Math.cos(ph)*.07),q,new THREE.Vector3(1,1,1));
        inst.setMatrixAt(i,m);
      }
      inst.instanceMatrix.needsUpdate=true;g.add(inst);g.userData.inst=inst;
      const cord=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,4.1,4),mat(0xd8c9a0));cord.position.y=2.2;g.add(cord);
      return g;},
    fuseLocal:[0,.15,0],cam:{h:2.4,d:8.6},dur:6.6,
    fire(g,P){
      const T=1.1,N=this.N,times=[];let tt=0;
      for(let i=0;i<N;i++){tt+=rand(.05,.13)*(i<N*.3?1.3:i>N*.75?1.35:.85);times.push(tt);}
      Snd.fuse(0,T,0);Snd.ladi(T,times);
      const inst=g.userData.inst,m=new THREE.Matrix4(),zero=new THREE.Matrix4().makeScale(0,0,0),wx=g.position.x,wz=g.position.z;
      times.forEach(function(t,i){
        P.later(T+t,function(){
          const idx=N-1-i,y=4.25-idx*.092;
          inst.getMatrixAt(idx,m);inst.setMatrixAt(idx,zero);inst.instanceMatrix.needsUpdate=true;
          const big=(i%9===4);
          for(let k=0;k<(big?26:12);k++){
            const a=rand(0,6.28),b=rand(-1,1),r=Math.sqrt(1-b*b),s=rand(2,big?8:5);
            sparks.emit(wx,y,wz,Math.cos(a)*r*s,b*s,Math.sin(a)*r*s,1,rand(.7,.9),rand(.35,.6),rand(.1,.28),.12,4,2,.6);
          }
          for(let k=0;k<3;k++)bits.emit(wx,y,wz,rand(-2,2),rand(0,2.5),rand(-2,2),.72,.12,.15,rand(.5,.9),.09,9,.8,0);
          flash(wx,y,wz+1,0xffc070,big?9:5);
          if(big)P.shake(.06);
        });
      });
      P.later(T+tt+.5,function(){
        const mm=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
        for(let i=0;i<N;i++){e.set(rand(-.2,.2),rand(0,3),rand(-.35,.35));q.setFromEuler(e);mm.compose(new THREE.Vector3(Math.sin(i*.5)*.07,4.25-i*.092,Math.cos(i*.5)*.07),q,new THREE.Vector3(1,1,1));inst.setMatrixAt(i,mm);}
        inst.instanceMatrix.needsUpdate=true;
      });
      return T+tt+.6;}});

  def({id:'sky',ta:'ஸ்கை ஷாட்',en:'Sky Shot',kind:'Aerial shell',loud:100,burn:'5 s',
    sound:'A deep mortar thump, a long rising whistle, a huge booming burst, and a late crackle drifting across the street.',
    make(){const g=new THREE.Group();
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,1.9,28),new THREE.MeshStandardMaterial({map:label('SKY|SHOT','#16295e','#ffc83d',512,512),roughness:.7}));tube.position.y=.95;g.add(tube);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.1,28),mat(0xffc83d,{m:.7,r:.3}));band.position.y=1.9;g.add(band);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.2,28),mat(0xc4202f));cap.position.y=2.05;g.add(cap);
      const fz=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.4,5),mat(0xd8c9a0));fz.position.set(.2,2.3,0);fz.rotation.z=-.35;g.add(fz);
      return g;},
    fuseLocal:[.3,2.5,0],cam:{h:3,d:9.5},tall:true,dur:8,
    fire(g,P){
      const T=1.3,up=2.2,top=17;Snd.fuse(0,T,0);Snd.sky(T);
      const wx=g.position.x,wz=g.position.z;P.tall(T+up+3.5);
      P.later(T,function(){
        P.shake(.3);flash(wx,2.4,wz+1,0xffc070,16);
        for(let i=0;i<70;i++){const a=rand(0,6.28),s=rand(1,5);bits.emit(wx,2.2,wz,Math.cos(a)*s,rand(1,5),Math.sin(a)*s,.45,.45,.5,rand(.8,1.6),.28,1.5,1,0);}
      });
      P.run(T,up,function(el){
        const u=el/up,y=2.3+(top-2.3)*(1-Math.pow(1-u,2.2));
        for(let i=0;i<6;i++)sparks.emit(wx+rand(-.05,.05),y,wz,rand(-.5,.5),rand(-2.5,-.8),rand(-.5,.5),1,rand(.6,.8),.3,rand(.5,1),.12,2,1,.6);
      },function(){
        burst(sparks,wx,top,wz,{type:'willow',scale:1.9});
        burst(sparks,wx,top,wz,{type:'ring',scale:1.8,col:PAL[2]});
        burst(sparks,wx,top,wz,{type:'peony',scale:1.5,col:PAL[3],density:.8});
        flash(wx,top,wz+2,0xffe0a0,18);P.shake(.5);
        P.later(.8,function(){burst(sparks,wx,top,wz,{type:'crackle',scale:1.7,col:PAL[5],later:P.later});});
      });
      return T+up+4.2;}});

  /* ---- place crackers ---- */
  const SP=3.3,items=[];
  defs.forEach(function(d,i){
    const g=d.make();g.position.set((i-(defs.length-1)/2)*SP,0,0);g.userData.i=i;scene.add(g);
    g.traverse(o=>{o.userData.i=i;});
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.28,48),new THREE.MeshBasicMaterial({color:0xffc83d,transparent:true,opacity:0,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.set(g.position.x,.02,0);scene.add(ring);
    items.push({d,g,ring,busy:false});
  });

  /* ---- effect runner helpers ---- */
  let shake=0,tallUntil=0;
  const runs=[];
  const P={
    later:(s,f)=>st.later(s,f),
    run(delay,dur,fn,end){runs.push({start:st.time+delay,dur:dur,fn:fn,end:end,last:null,done:false});},
    shake(a){shake=Math.max(shake,a);},
    tall(sec){tallUntil=Math.max(tallUntil,st.time+sec);},
    pop(x,y,z){for(let i=0;i<30;i++){const a=rand(0,6.28),s=rand(1,3);sparks.emit(x,y,z,Math.cos(a)*s,rand(0,3),Math.sin(a)*s,1,.9,.7,rand(.2,.4),.12,4,1,.5);}flash(x,y,z+1,0xffd090,6);Snd.bangAt(0,{vol:.18,size:.25});},
    bang(x,y,z,k){
      flash(x,y+.2,z+1,0xfff0d0,34);P.shake(.4);
      for(let i=0;i<130;i++){const a=rand(0,6.28),b=rand(-.3,1),r=Math.sqrt(1-b*b),s=rand(5,14);sparks.emit(x,y,z,Math.cos(a)*r*s,b*s,Math.sin(a)*r*s,1,rand(.65,.9),rand(.3,.6),rand(.15,.4),.18,3,2.2,.6);}
      for(let i=0;i<46;i++){const a=rand(0,6.28),s=rand(2,8);bits.emit(x,y,z,Math.cos(a)*s,rand(1,8),Math.sin(a)*s,rand(.55,.8),.1,.14,rand(.9,1.6),.12,10,.6,0);}
      for(let i=0;i<16;i++){const a=rand(0,6.28),s=rand(.6,2);bits.emit(x,y,z,Math.cos(a)*s,rand(.2,1.4),Math.sin(a)*s,.32,.3,.34,rand(1.2,2.1),rand(.5,.8),-.3,1.4,0);}
      ringFx(x,y,z);
    }
  };
  /* shockwave ring */
  const shock=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),new THREE.MeshBasicMaterial({color:0xffe0b0,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  shock.rotation.x=-Math.PI/2;scene.add(shock);let shockT=9;
  function ringFx(x,y,z){shock.position.set(x,.05,z);shockT=0;}

  /* ---- selection + camera ---- */
  let sel=0,yaw=0,yawT=0;
  const goal={x:0,y:3,d:12},cur={x:0,y:3,d:12};
  function setGoal(){const it=items[sel],c=it.d.cam;goal.x=it.g.position.x;goal.y=c.h;goal.d=c.d*(st.aspect<1?1.45:st.aspect<1.4?1.15:1);}
  st.onResize=setGoal;

  const chips=$('#chips'),pTa=$('#pTa'),pEn=$('#pEn'),pSound=$('#pSound'),mLoud=$('#mLoud'),mBurn=$('#mBurn'),mKind=$('#mKind'),fuseBtn=$('#fuse');
  defs.forEach(function(d,i){
    const b=document.createElement('button');b.className='cchip';b.setAttribute('role','tab');b.id='chip-'+d.id;
    b.innerHTML='<small>'+d.ta+'</small><b>'+d.en+'</b>';
    b.addEventListener('click',function(){select(i);});chips.appendChild(b);
  });
  function select(i){
    sel=i;const d=defs[i];
    pTa.textContent=d.ta;pEn.textContent=d.en;pSound.textContent=d.sound;
    mLoud.style.width=d.loud+'%';mBurn.textContent=d.burn;mKind.textContent=d.kind;
    items.forEach((it,k)=>{it.ring.material.opacity=k===i?.9:0;});
    [].forEach.call(chips.children,(c,k)=>c.setAttribute('aria-selected',k===i?'true':'false'));
    const c=chips.children[i];if(c&&c.scrollIntoView)c.scrollIntoView({block:'nearest',inline:'center',behavior:reduce?'auto':'smooth'});
    fuseBtn.disabled=items[i].busy;fuseBtn.textContent=items[i].busy?'Burning…':'Light the fuse';
    setGoal();
  }
  fuseBtn.addEventListener('click',function(){
    Snd.unlock();const it=items[sel];if(it.busy)return;
    it.busy=true;fuseBtn.disabled=true;fuseBtn.textContent='Burning…';
    const total=it.d.fire(it.g,P);
    /* fuse glints */
    const f=it.d.fuseLocal,fx=it.g.position.x+f[0],fy=f[1],fz=it.g.position.z+f[2];
    const ft=Math.min(1.5,total*.2);
    P.run(0,ft,function(){for(let i=0;i<4;i++)sparks.emit(fx,fy,fz,rand(-1.2,1.2),rand(.5,2.4),rand(-1.2,1.2),1,rand(.7,.9),.4,rand(.15,.35),.06,5,1,.8);});
    st.later(total,function(){it.busy=false;if(items[sel]===it){fuseBtn.disabled=false;fuseBtn.textContent='Light the fuse';}});
  });

  /* pick by tapping a model; drag to orbit */
  const ray=new THREE.Raycaster();let down=null;
  canvas.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY,yaw:yawT,moved:false};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',function(e){
    if(!down)return;const dx=e.clientX-down.x;
    if(Math.abs(dx)>5)down.moved=true;
    yawT=clamp(down.yaw-dx*.004,-.9,.9);
  });
  canvas.addEventListener('pointerup',function(e){
    if(down&&!down.moved){
      const r=canvas.getBoundingClientRect();
      ray.setFromCamera({x:((e.clientX-r.left)/r.width)*2-1,y:-((e.clientY-r.top)/r.height)*2+1},camera);
      const hit=ray.intersectObjects(items.map(i=>i.g),true)[0];
      if(hit&&hit.object.userData.i!=null)select(hit.object.userData.i);
    }
    down=null;
  });

  st.update=function(dt){
    /* effect runners */
    for(let i=runs.length-1;i>=0;i--){
      const r=runs[i];if(st.time<r.start)continue;
      const el=st.time-r.start;
      if(el>=r.dur){if(r.end)r.end();runs.splice(i,1);continue;}
      r.fn(el,dt);
    }
    /* lights decay */
    fl.forEach(l=>{l.intensity*=Math.exp(-7*dt);});
    if(shockT<1){shockT+=dt*3.2;const s=1+shockT*9;shock.scale.set(s,s,s);shock.material.opacity=.7*(1-shockT);}else shock.material.opacity=0;
    /* ring pulse */
    items.forEach((it,k)=>{if(k===sel)it.ring.material.opacity=.55+Math.sin(st.time*3)*.3;});
    /* camera */
    const tall=st.time<tallUntil;
    const gy=tall?8.5:goal.y,gd=tall?goal.d*1.75:goal.d;
    const k=1-Math.exp(-3.2*dt);
    cur.x+=(goal.x-cur.x)*k;cur.y+=(gy-cur.y)*k;cur.d+=(gd-cur.d)*k;
    yaw+=(yawT-yaw)*(1-Math.exp(-6*dt));
    shake*=Math.exp(-5*dt);
    const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;
    camera.position.set(cur.x+Math.sin(yaw)*cur.d+sx,cur.y+1.4+sy,Math.cos(yaw)*cur.d);
    camera.lookAt(cur.x,cur.y+(tall?1.6:.4),0);
    /* idle bob on selected */
    const it=items[sel];if(!it.busy&&it.d.id!=='ladi')it.g.rotation.y=Math.sin(st.time*.8)*.35;
  };
  select(0);
  cur.x=goal.x;cur.y=goal.y;cur.d=goal.d;
}
new IntersectionObserver(function(es){if(es[0].isIntersecting&&!inited){inited=true;init();}},{rootMargin:'600px'}).observe($('#lab'));
})();
