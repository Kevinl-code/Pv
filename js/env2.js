/* Environment part 2: bulbs, birds, animals, the gate, vines, lightning. */
(function(){
'use strict';
if(!window.THREE)return;
const {rand,clamp,pick,mobile}=PV;
const {T,M,GEO,box,cyl,sph,mesh,std,V3}=PV.Env;
const GATE=V3(0,27,-66);

PV.Env.extend=function(E){
  const R=E.root;

  /* bulbs */
  const bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.Float32BufferAttribute(E.bulbPos,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(E.bulbCol,3));
  E.bulbMat=new THREE.PointsMaterial({map:T.glow,size:.62,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0,sizeAttenuation:true,fog:false});
  R.add(new THREE.Points(bg,E.bulbMat));

  /* birds on the wire and rooftops */
  const nb=mobile?10:18,bm=std(0x2a2420),bw=std(0x3a3028,{side:THREE.DoubleSide});
  for(let i=0;i<nb;i++){
    const g=new THREE.Group(),onWire=i<nb*.7;
    sph(g,bm,0,0,0,.07,.06,.13,false);sph(g,bm,0,.04,.12,.045,false);box(g,bm,0,0,-.17,.04,.01,.14,false);
    const wl=new THREE.Group(),wr=new THREE.Group();box(wl,bw,-.1,0,0,.2,.01,.1,false);box(wr,bw,.1,0,0,.2,.01,.1,false);g.add(wl,wr);wl.position.x=-.04;wr.position.x=.04;
    const z=-2-Math.random()*38;
    const home=onWire?V3(-3.9+rand(-.1,.1),6.7,z):V3(rand(-9.5,9.5)*(Math.random()<.5?1:-1),5.6,-rand(2,36));
    g.position.copy(home);g.rotation.y=rand(0,6.28);wl.rotation.z=wr.rotation.z=.9;R.add(g);
    E.birds.push({g,wl,wr,home,state:'perch',t:0,v:V3(0,0,0),ph:Math.random()*6});
  }
  E.scatterBirds=function(){E.birds.forEach(function(b,i){if(b.state!=='perch')return;b.state='fly';b.t=-i*.04;const a=rand(-.6,.6);b.v.set(a*5+rand(-2,2),rand(3,6),-rand(3,9));b.g.rotation.y=Math.atan2(b.v.x,b.v.z);});};
  E.returnBirds=function(){E.birds.forEach(function(b,i){b.state='back';b.t=-i*.06;b.g.visible=true;b.g.position.set(rand(-30,30),rand(18,30),rand(-80,-50));});};

  /* dogs */
  function dog(x,z,col,ry){
    const g=new THREE.Group(),m=std(col,{roughness:.95}),dk=std(0x2a1a10);
    const body=new THREE.Group();g.add(body);sph(body,m,0,.34,0,.17,.17,.36);sph(body,m,0,.4,.22,.17,.19,.2);
    const head=new THREE.Group();head.position.set(0,.5,.46);body.add(head);sph(head,m,0,0,0,.1,.1,.12);box(head,dk,0,-.03,.12,.07,.06,.12);
    [-1,1].forEach(function(s){const e=box(head,dk,s*.07,.08,-.02,.04,.1,.03);e.rotation.z=-s*.4;});
    const legs=[];[[-.1,.22],[.1,.22],[-.1,-.22],[.1,-.22]].forEach(function(p){const l=new THREE.Group();l.position.set(p[0],.3,p[1]);body.add(l);cyl(l,m,0,-.14,0,.04,.28);legs.push(l);});
    const tail=new THREE.Group();tail.position.set(0,.42,-.34);body.add(tail);const tl=cyl(tail,m,0,.0,-.1,.03,.26);tl.rotation.x=Math.PI/2-.5;
    g.position.set(x,0,z);g.rotation.y=ry||0;R.add(g);
    const d={g,body,head,legs,tail,state:'sleep',t:Math.random()*5,home:V3(x,0,z),ry:ry||0,x0:x,z0:z};E.dogs.push(d);return d;
  }
  dog(6.2,-12,0xb48a52,-1.2);dog(-3.4,-16,0x6a5238,.6);dog(-6.5,-27,0xd8c9a8,2.2);
  /* cow */
  (function cow(){
    const g=new THREE.Group(),m=std(0xe9e1cf,{roughness:.95}),br=std(0x7a5232);
    sph(g,m,0,1.0,0,.55,.55,1.0);sph(g,br,.2,1.2,.2,.3,.25,.4);sph(g,m,0,1.2,.9,.3,.3,.3);
    const head=new THREE.Group();head.position.set(0,1.25,1.15);g.add(head);sph(head,m,0,0,0,.24,.26,.32);sph(head,std(0xd09a90),0,-.1,.28,.14,.12,.1);
    [-1,1].forEach(function(s){const h=cyl(head,std(0xefe6cc),s*.18,.26,-.05,.03,.28);h.rotation.z=-s*.5;box(head,br,s*.26,.1,-.1,.18,.05,.1);});
    [[-.3,.6],[.3,.6],[-.3,-.6],[.3,-.6]].forEach(function(p){cyl(g,m,p[0],.35,p[1],.09,.7);});
    cyl(g,br,0,.95,-1.0,.03,.8).rotation.x=.2;
    g.position.set(-6.8,0,-40);g.rotation.y=1.2;R.add(g);E.cows.push({g,head,t:0,home:g.position.clone()});
  })();

  /* the gate */
  const gu={uTime:{value:0},uOpen:{value:0}};
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(40,50),new THREE.ShaderMaterial({uniforms:gu,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;uniform float uTime,uOpen;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.1;a*=.5;}return v;}'+
    'void main(){vec2 p=(vUv-.5)*vec2(2.0,2.5);float ang=atan(p.y,p.x),r=length(p);'+
    'float jag=fbm(vec2(ang*2.5+uTime*.15,r*1.5))*.34+fbm(vec2(ang*9.,uTime*.5))*.1;float rad=(.62+jag)*uOpen;float d=r-rad;'+
    'float inside=smoothstep(.03,-.03,d);float edge=smoothstep(.2,.0,abs(d))*step(.001,uOpen);'+
    'float a=uTime*.12;vec2 q=mat2(cos(a),-sin(a),sin(a),cos(a))*p;float n1=fbm(q*2.6+vec2(0.,uTime*.25)),n2=fbm(q*5.-uTime*.18);'+
    'vec3 core=mix(vec3(.015,0.,.02),vec3(.6,.03,.06),n1*n2*2.4)+vec3(1.,.25,.1)*pow(max(0.,n2-.5),2.)*4.;'+
    'vec3 rim=vec3(1.,.28,.12)*edge*(1.4+fbm(vec2(ang*14.,uTime*2.))*2.2);'+
    'gl_FragColor=vec4(core*inside+rim,clamp(inside+edge*.85,0.,1.));}'}));
  gm.position.copy(GATE);gm.renderOrder=-5;R.add(gm);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:T.glow,color:0xff2a1a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0,fog:false}));
  halo.scale.set(110,110,1);halo.position.set(0,GATE.y,GATE.z+1);R.add(halo);
  E.gate={mesh:gm,u:gu,halo,pos:GATE,open:0};

  /* vines */
  const curves=[];
  function addVine(curve,rad,seg,delay,ground){
    const geo=new THREE.TubeGeometry(curve,seg,rad,5,false),m=new THREE.Mesh(geo,M.vine);m.castShadow=false;m.frustumCulled=false;R.add(m);
    E.vines.push({mesh:m,count:geo.index.count,delay:delay,ground:ground});curves.push(curve);return m;
  }
  const targets=[];E.houses.forEach(function(h){targets.push(V3(h.x+(h.side<0?1:-1)*3,5.4,h.z+rand(-1,1)));targets.push(V3(h.x+(h.side<0?1:-1)*6,.2,h.z+rand(-2,2)));});
  const nv=mobile?9:14;
  for(let i=0;i<nv;i++){
    const th=rand(-2.6,-.55),r=rand(8,15),s=V3(GATE.x+Math.cos(th)*r,GATE.y+Math.sin(th)*r,GATE.z+.5),e=pick(targets).clone();
    const mid1=s.clone().lerp(e,.35);mid1.x+=rand(-6,6);mid1.y+=rand(0,5);
    const mid2=s.clone().lerp(e,.7);mid2.x+=rand(-3,3);mid2.y=Math.max(2,mid2.y-rand(0,4));
    const cu=new THREE.CatmullRomCurve3([s,mid1,mid2,e]);
    addVine(cu,rand(.16,.34),70,i/nv*.45,false);
    for(let b=0;b<1+(i%2);b++){const p=cu.getPoint(rand(.35,.85)),q=p.clone().add(V3(rand(-4,4),-rand(2,6),rand(1,5)));q.y=Math.max(.2,q.y);
      addVine(new THREE.CatmullRomCurve3([p,p.clone().lerp(q,.5).add(V3(rand(-1,1),rand(0,1.5),0)),q]),rand(.05,.1),24,.3+i/nv*.5,false);}
  }
  /* street-level tendrils near the tea shop and mid road */
  [[7.2,-11],[6.8,-17],[-3,-20],[1.5,-26],[-6.4,-10]].forEach(function(p,i){
    const s=V3(p[0],.1,p[1]),pts=[s];let c=s.clone();for(let k=0;k<5;k++){c=c.clone().add(V3(rand(-.8,.8),rand(.6,1.4)*(i<2?1.2:.5),rand(-.8,.8)));pts.push(c);}
    addVine(new THREE.CatmullRomCurve3(pts),rand(.07,.13),30,.15+i*.1,true);
  });
  E.setVines=function(g,gl){
    E.vines.forEach(function(v){
      const base=v.ground?g:g*gl,l=clamp((base-v.delay)/(1-v.delay+.0001),0,1);
      v.mesh.visible=l>.002;v.mesh.geometry.setDrawRange(0,Math.floor(l*v.count/3)*3);
    });
  };

  /* lightning */
  E.bolts=[];
  for(let i=0;i<3;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(30*3),3));
    const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffb8b0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));l.frustumCulled=false;R.add(l);E.bolts.push({l,life:0});}
  E.fireBolt=function(from,to){
    const b=E.bolts.find(x=>x.life<=0)||E.bolts[0],a=b.l.geometry.attributes.position,pts=[];
    for(let i=0;i<30;i++){const u=i/29,j=Math.sin(u*Math.PI)*2.4;
      const p=from.clone().lerp(to,u);p.x+=rand(-j,j);p.y+=rand(-j,j)*.4;p.z+=rand(-j,j);a.setXYZ(i,p.x,p.y,p.z);pts.push(p);}
    a.needsUpdate=true;b.life=.16;b.l.material.opacity=1;return pts;
  };
  E.updateEnv=function(dt,t){
    E.bolts.forEach(function(b){if(b.life>0){b.life-=dt;b.l.material.opacity=Math.max(0,b.life/.16)*(Math.random()<.5?1:.4);}});
    E.diyas.forEach(function(d){if(d.lit){const f=.85+Math.sin(t*11+d.ph)*.1+Math.random()*.08;d.flame.scale.set(.16*f,.34*f,1);d.glow.material.opacity=.55+Math.sin(t*7+d.ph)*.12;}});
    /* birds */
    E.birds.forEach(function(b){
      if(b.state==='perch'){b.wl.rotation.z=b.wr.rotation.z=.9;if(Math.random()<.002)b.g.rotation.y+=rand(-.5,.5);}
      else if(b.state==='fly'){b.t+=dt;if(b.t<0)return;const fl=Math.sin((b.t+b.ph)*34)*.6;b.wl.rotation.z=.2+fl;b.wr.rotation.z=-.2-fl;
        b.g.position.addScaledVector(b.v,dt);b.v.x*=1+dt*.2;b.v.y+=dt*.6;b.v.z-=dt*3;if(b.t>7||b.g.position.y>70){b.g.visible=false;b.state='gone';}}
      else if(b.state==='back'){b.t+=dt;if(b.t<0)return;const fl=Math.sin((b.t+b.ph)*30)*.6;b.wl.rotation.z=.2+fl;b.wr.rotation.z=-.2-fl;
        const tg=b.home,d=tg.clone().sub(b.g.position),L=d.length();if(L<.3){b.state='perch';b.g.position.copy(tg);}else{d.multiplyScalar(1/L);b.g.position.addScaledVector(d,Math.min(L,9*dt));b.g.rotation.y=Math.atan2(d.x,d.z);}}
    });
  };
  return E;
};
})();
