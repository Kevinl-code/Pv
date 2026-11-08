/* Procedural Tamil village environment (no external assets). */
(function(){
'use strict';
if(!window.THREE)return;
const {rand,clamp,pick,mobile}=PV;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);

/* ---------- canvas textures ---------- */
function cv(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x,w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;}
function noiseFill(x,w,h,n,a){for(let i=0;i<n;i++){x.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+(Math.random()*a)+')';x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3);}}
const T={};
T.ground=cv(512,512,function(x,w,h){
  x.fillStyle='#6a5236';x.fillRect(0,0,w,h);noiseFill(x,w,h,9000,.22);
  for(let i=0;i<40;i++){x.fillStyle='rgba(40,28,16,'+(.05+Math.random()*.1)+')';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*40,4+Math.random()*12,Math.random()*3,0,6.3);x.fill();}
  x.fillStyle='rgba(30,20,12,.25)';x.fillRect(w*.3,0,6,h);x.fillRect(w*.64,0,6,h);
});
T.ground.wrapS=T.ground.wrapT=THREE.RepeatWrapping;T.ground.repeat.set(12,60);
const wallCache={};
function wallTex(c){
  if(wallCache[c])return wallCache[c];
  return wallCache[c]=cv(256,256,function(x,w,h){
    x.fillStyle=c;x.fillRect(0,0,w,h);noiseFill(x,w,h,3500,.16);
    const g=x.createLinearGradient(0,h*.7,0,h);g.addColorStop(0,'rgba(60,40,20,0)');g.addColorStop(1,'rgba(60,40,20,.45)');x.fillStyle=g;x.fillRect(0,h*.7,w,h*.3);
    x.fillStyle='rgba(30,20,10,.18)';for(let i=0;i<6;i++){x.fillRect(Math.random()*w,0,2+Math.random()*3,h*(.2+Math.random()*.5));}
    x.fillStyle='#8a2a1a';x.fillRect(0,h-26,w,8);x.fillStyle='#f3e6c0';x.fillRect(0,h-18,w,10);
  });
}
T.roof=cv(256,256,function(x,w,h){
  x.fillStyle='#8f3d22';x.fillRect(0,0,w,h);
  for(let r=0;r<16;r++)for(let c=0;c<16;c++){const ox=(r%2)*8;x.fillStyle='hsl(12,'+(45+Math.random()*15)+'%,'+(30+Math.random()*12)+'%)';x.fillRect(c*16+ox,r*16,14,14);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(c*16+ox,r*16+13,14,3);}
  noiseFill(x,w,h,1500,.2);
});
T.roof.wrapS=T.roof.wrapT=THREE.RepeatWrapping;T.roof.repeat.set(3,2);
T.glow=cv(128,128,function(x,w,h){const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,230,170,.8)');g.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
T.flame=cv(64,128,function(x,w,h){const g=x.createRadialGradient(32,84,2,32,76,34);g.addColorStop(0,'rgba(255,255,230,1)');g.addColorStop(.35,'rgba(255,190,70,.95)');g.addColorStop(1,'rgba(255,90,10,0)');x.fillStyle=g;x.beginPath();x.ellipse(32,76,22,48,0,0,6.3);x.fill();});
function sign(text,bg,fg,w,h,font){return cv(w||512,h||160,function(x,W,H){x.fillStyle=bg;x.fillRect(0,0,W,H);x.strokeStyle=fg;x.lineWidth=6;x.strokeRect(8,8,W-16,H-16);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font=font||('700 '+Math.floor(H*.46)+'px "Hind Madurai","Noto Sans Tamil",sans-serif');x.fillText(text,W/2,H/2+2);});}
T.kolam=cv(512,512,function(x,w,h){
  x.clearRect(0,0,w,h);const c=w/2,pal=['#ff4f6d','#ffc83d','#35e0c0','#7b61ff'];
  x.lineCap='round';x.strokeStyle='#f6efe0';x.lineWidth=5;
  for(let k=0;k<8;k++){const a=k*Math.PI/4;x.save();x.translate(c,c);x.rotate(a);x.beginPath();x.moveTo(0,0);x.bezierCurveTo(34,-46,128,-46,170,0);x.bezierCurveTo(128,46,34,46,0,0);x.stroke();x.fillStyle=pal[k%4]+'55';x.fill();x.restore();}
  x.beginPath();x.arc(c,c,200,0,6.3);x.stroke();x.beginPath();x.arc(c,c,226,0,6.3);x.lineWidth=3;x.stroke();x.lineWidth=5;
  for(let k=0;k<16;k++){const a=k*Math.PI/8;x.beginPath();x.arc(c+Math.cos(a)*213,c+Math.sin(a)*213,7,0,6.3);x.fillStyle='#f6efe0';x.fill();}
  for(let r=1;r<4;r++)for(let k=0;k<r*6;k++){const a=k/(r*6)*6.283;x.beginPath();x.arc(c+Math.cos(a)*r*32,c+Math.sin(a)*r*32,3.2,0,6.3);x.fillStyle='#fff';x.fill();}
});

/* ---------- materials ---------- */
const M={};
function std(c,o){o=o||{};return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));}
M.dark=std(0x1a1410);M.wood=std(0x4a2e1a);M.pillar=std(0xe9dcc0);M.gold=std(0xe8b030,{metalness:.8,roughness:.35});
M.window=new THREE.MeshStandardMaterial({color:0x221a10,emissive:0xffb050,emissiveIntensity:0,roughness:.5});
M.lampTube=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xcfe8ff,emissiveIntensity:0,roughness:.4});
M.clay=std(0x9a4a28,{roughness:.9});M.leaf=std(0x2f7a3a,{side:THREE.DoubleSide});M.tea=std(0x7a5a38);
M.vine=std(0x1a070b,{roughness:.8,emissive:0x5c0610,emissiveIntensity:.7});
M.pole=std(0x77736c);
const GEO={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),sph:new THREE.SphereGeometry(1,14,10)};

/* ---------- builder helpers ---------- */
function mesh(par,geo,mat,x,y,z,sx,sy,sz,cast){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.scale.set(sx,sy,sz);if(cast!==false){m.castShadow=true;m.receiveShadow=true;}par.add(m);return m;}
const box=(p,m,x,y,z,w,h,d,c)=>mesh(p,GEO.box,m,x,y,z,w,h,d,c);
const cyl=(p,m,x,y,z,r,h,c)=>mesh(p,GEO.cyl,m,x,y,z,r,h,r,c);
const sph=(p,m,x,y,z,rx,ry,rz,c)=>mesh(p,GEO.sph,m,x,y,z,rx,ry==null?rx:ry,rz==null?rx:rz,c);

function Env(scene){
  const E={scene,root:new THREE.Group(),diyas:[],bulbPos:[],bulbCol:[],windowMats:[M.window],lampMats:[M.lampTube],anchors:{},casters:[],houses:[],doors:[],vines:[],birds:[],dogs:[],cows:[],poles:[]};
  scene.add(E.root);
  const R=E.root;

  /* sky dome */
  const skyU={uTop:{value:new THREE.Color(.1,.12,.3)},uMid:{value:new THREE.Color(.55,.28,.35)},uHor:{value:new THREE.Color(1,.55,.25)},uTime:{value:0},uDown:{value:0},uStars:{value:0},uFlash:{value:0}};
  E.skyU=skyU;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(480,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec3 vD;uniform vec3 uTop,uMid,uHor;uniform float uTime,uDown,uStars,uFlash;'+
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}'+
    'void main(){float y=clamp(vD.y,-.2,1.);vec3 c=mix(uHor,uMid,smoothstep(0.,.25,y));c=mix(c,uTop,smoothstep(.2,.8,y));'+
    'vec2 q=vD.xz/(vD.y+.35)*1.6;float cl=fbm(q*1.5+vec2(uTime*.01,uDown*uTime*.04));float cl2=fbm(q*3.+uTime*(.02+uDown*.08));'+
    'vec3 cc=mix(vec3(.12,.08,.14),vec3(.5,.04,.05)*(.6+cl2*1.4),uDown);c=mix(c,cc+c*.4,smoothstep(.45,.8,cl)*mix(.35,.85,uDown)*smoothstep(-.05,.3,vD.y));'+
    'float st=step(.9975,h(floor(vD.xz/(vD.y+.5)*140.)))*uStars*smoothstep(.12,.4,vD.y);c+=vec3(st);'+
    'c+=vec3(1.,.25,.2)*uFlash*(.35+.65*cl);gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-10;R.add(sky);E.sky=sky;

  /* ground */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,200),new THREE.MeshStandardMaterial({map:T.ground,roughness:.95,color:0xffffff}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,0,-45);ground.receiveShadow=true;R.add(ground);E.ground=ground;
  for(let s=-1;s<=1;s+=2){const g=new THREE.Mesh(new THREE.PlaneGeometry(40,200),new THREE.MeshStandardMaterial({color:0x35402a,roughness:1}));g.rotation.x=-Math.PI/2;g.position.set(s*36,.02,-45);g.receiveShadow=true;R.add(g);}

  /* kolam decal */
  function kolam(x,z,s,rot){const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:T.kolam,transparent:true,depthWrite:false,opacity:.0,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-Math.PI/2;m.rotation.z=rot||0;m.position.set(x,.03,z);R.add(m);return m;}
  E.kolams=[];
  /* diya */
  function diya(x,y,z,story){
    const g=new THREE.Group();g.position.set(x,y,z);
    const b=mesh(g,GEO.cyl,M.clay,0,.025,0,.09,.05,false);b.scale.set(.09,.05,.09);
    const f=new THREE.Sprite(new THREE.SpriteMaterial({map:T.flame,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));f.scale.set(.16,.34,1);f.position.y=.16;f.visible=false;g.add(f);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:T.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7,fog:false}));gl.scale.set(1.3,1.3,1);gl.position.y=.2;gl.visible=false;g.add(gl);
    R.add(g);const d={g,flame:f,glow:gl,lit:false,pos:V3(x,y+.2,z),story:!!story,ph:Math.random()*9};E.diyas.push(d);return d;
  }
  E.diya=diya;
  E.light=function(d,v){if(d.lit===v)return;d.lit=v;d.flame.visible=v;d.glow.visible=v;};

  /* house */
  function bulbLine(x0,y0,z0,x1,y1,z1,n,sag){for(let i=0;i<=n;i++){const u=i/n;E.bulbPos.push(x0+(x1-x0)*u,y0+(y1-y0)*u-Math.sin(u*Math.PI)*(sag||.12),z0+(z1-z0)*u);const c=pick([[1,.65,.2],[1,.85,.4],[1,.35,.5],[.4,.8,1],[1,.5,.15]]);E.bulbCol.push(c[0],c[1],c[2]);}}
  function house(x,z,side,o){
    o=o||{};const g=new THREE.Group();const W=o.w||7,D=o.d||6,H=o.h||3.3,wc=o.wall||'#e8d3a4';
    const wm=std(0xffffff,{map:wallTex(wc)});
    box(g,std(0x4a3a2c),0,.15,0,W+.3,.3,D+.3);
    box(g,wm,0,.3+H/2,0,W,H,D);
    /* porch (thinnai) */
    box(g,std(0xb8a68a),0,.3,D/2+.9,W-.6,.38,1.8);
    for(let i=0;i<4;i++)cyl(g,M.pillar,-W/2+.9+i*((W-1.8)/3),.3+1.6,D/2+1.55,.1,3.0);
    /* roof: two slopes */
    const rm=std(0xffffff,{map:T.roof,roughness:.8});
    const sl=Math.atan2(1.9,D/2+1.3);
    const L=Math.hypot(1.9,D/2+1.3);
    const rf=box(g,rm,0,.3+H+.85,(D/2+1.3)/2-1.3+.45,W+1.2,.16,L+.2);rf.rotation.x=sl;rf.castShadow=true;
    const rb=box(g,rm,0,.3+H+.85,-(D/2+.2)/2-.05,W+1.2,.16,L-1.1);rb.rotation.x=-Math.atan2(1.9,D/2+.2);
    box(g,std(0x5a2412),0,.3+H+1.78,0,W+1.3,.14,.22);
    /* door + windows */
    box(g,M.wood,0,.3+1.15,D/2+.01,1.2,2.3,.12);box(g,M.gold,.42,.3+1.15,D/2+.09,.08,.08,.05);
    box(g,std(0x7a1a1a),0,.3+2.45,D/2+.03,1.6,.28,.14);
    for(let s=-1;s<=1;s+=2){box(g,M.window,s*2.3,.3+1.7,D/2+.01,1.0,1.05,.1,false);for(let k=-1;k<=1;k++)box(g,M.dark,s*2.3+k*.3,.3+1.7,D/2+.08,.04,1.05,.04,false);}
    /* toran: mango-leaf garland over the door */
    for(let k=0;k<9;k++){const lf=mesh(g,GEO.cyl,M.leaf,-.7+k*.175,.3+2.2,D/2+.2,.07,.34,false);lf.scale.set(.07,.34,.02);lf.rotation.z=rand(-.15,.15);}
    /* sign + hanging bulb */
    box(g,sign&&std(0xffffff,{map:sign(o.name||'இல்லம்','#f3e6c0','#6b1d12',256,96)}),-2.5,.3+3.0,D/2+.04,1.6,.55,.06,false);
    g.position.set(x,0,z);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;R.add(g);
    /* world-space anchors */
    const fw=side<0?1:-1,fx=x+fw*(D/2+1.8);
    const info={g,x,z,side,fx,door:V3(x+fw*(D/2+.1),1.4,z),W,D};
    E.houses.push(info);E.doors.push(info.door);
    /* eave lights across the front */
    const ex=x+fw*(D/2+1.55);bulbLine(ex,3.45,z-W/2,ex,3.45,z+W/2,16,.2);
    /* diyas on the porch */
    const dd=[];[-1.2,1.2].forEach(function(dz){dd.push(diya(x+fw*(D/2+1.65),.52,z+dz*(.9),o.story));});
    info.diyas=dd;
    info.kol=kolam(x+fw*(D/2+4.0),z,2.8+rand(0,.4),rand(0,3));E.kolams.push(info.kol);
    return info;
  }
  const wallCols=['#e8d3a4','#d9a06a','#cfe0c4','#e7b9a0','#b9d3e0','#eadba6','#d4b4c8'];
  const zs=[2,-8,-18,-30,-38];
  zs.forEach(function(z,i){
    house(-9.2,z-(i===2?4:0),-1,{wall:wallCols[i%7],name:'இல்லம்',story:i===0||i===1||i===3});
    if(!(i===2))house(9.2,z,1,{wall:wallCols[(i+3)%7],name:'வீடு',story:i===0||i===3||i===4});
  });

  /* tea shop (right side, between houses) */
  (function tea(){
    const g=new THREE.Group();g.position.set(8.6,0,-14.5);g.rotation.y=-Math.PI/2;R.add(g);
    box(g,std(0x5a4a3a),0,.2,0,5,.4,3.6);
    box(g,std(0x2a2a30),-1.2,1.0,-.9,.1,1.6,.1);
    [[-2.3,-1.6],[2.3,-1.6],[-2.3,1.6],[2.3,1.6]].forEach(p=>cyl(g,M.wood,p[0],1.7,p[1],.07,3));
    const rm=std(0xffffff,{map:T.roof});const r=box(g,rm,0,3.45,0,5.6,.14,4.4);r.rotation.x=.12;
    box(g,M.wood,0,.95,1.2,4.2,.9,.9);                      /* counter */
    box(g,std(0xffffff,{map:sign('டீ கடை · TEA','#0f4a3a','#ffe9a0',512,160)}),0,3.0,1.8,3.6,.9,.08,false);
    /* shelves with jars */
    box(g,M.wood,0,2.0,-1.5,4,.08,.5);for(let i=0;i<9;i++){cyl(g,std(0xd9a24a,{emissive:0x6a3c10,emissiveIntensity:.0}),-1.7+i*.42,2.2,-1.5,.12,.3,false);}
    /* stove + kettle */
    box(g,M.dark,1.3,1.46,1.2,.8,.12,.5);const kt=cyl(g,M.gold,1.3,1.72,1.2,.22,.4);const sp=cyl(g,M.gold,1.62,1.82,1.2,.04,.4);sp.rotation.z=-.9;
    E.anchors.kettle=V3(8.6-1.2,1.75,-14.5+1.3);
    /* bananas */
    for(let i=0;i<3;i++)for(let k=0;k<5;k++){const b=cyl(g,std(0xe8c840),-1.9+i*.6,2.9-k*.07,1.7,.03,.28,false);b.rotation.z=.3;b.position.x+=k*.04;}
    /* benches */
    box(g,M.wood,-1.2,.55,2.6,2.2,.1,.5);box(g,M.wood,-1.2,.3,2.6,.1,.6,.4);
    /* hanging bulb */
    E.bulbPos.push(8.6-1.8,3.15,-14.5,8.6-1.8,3.15,-12.5);E.bulbCol.push(1,.8,.4,1,.8,.4);
    E.teaGroup=g;
  })();

  /* temple with gopuram at the end of the street */
  (function temple(){
    const g=new THREE.Group();g.position.set(0,0,-54);R.add(g);E.temple=g;
    const pm=std(0xffffff,{map:wallTex('#e6c9a0')}),pm2=std(0xffffff,{map:wallTex('#c9503a')}),pm3=std(0xffffff,{map:wallTex('#f0e6c8')});
    box(g,std(0x6b5a48),0,.3,0,26,.6,10);
    box(g,pm3,-9,1.9,2,8,3.2,.6);box(g,pm3,9,1.9,2,8,3.2,.6);               /* compound wall */
    box(g,pm,0,1.2,0,3.8,1.2,3,false);
    let y=.6;
    for(let i=0;i<8;i++){
      const w=10.5*(1-i*.1),h=1.85*(1-i*.012),d=5.4*(1-i*.07),mm=i%2?pm2:pm;
      box(g,mm,0,y+h/2,0,w,h,d);box(g,std(0xf2e4c4),0,y+h+.12,0,w*1.07,.28,d*1.07);
      const n=Math.max(2,6-i);for(let k=0;k<n;k++){const px=-w*.38+k*(w*.76/(n-1));box(g,M.window,px,y+h*.5,d/2+.02,.34,.74,.06,false);}
      y+=h+.28;
    }
    const roof=cyl(g,pm2,0,y+.9,0,2.8,1.8);roof.scale.set(2.8,1.8,1.4);
    for(let k=-2;k<=2;k++)cyl(g,M.gold,k*1.0,y+2.2,0,.2,1.0);
    box(g,std(0x2a1a10),0,2.3,2.7,2.2,3.6,.2);
    box(g,std(0x2a1a10),0,.62,3.9,3,.28,2.4);
    E.templeTop=V3(0,y+2.7,-54);
    /* bell */
    const bell=new THREE.Group();bell.position.set(2.4,4.2,4.2);g.add(bell);
    cyl(bell,M.gold,0,-.35,0,.3,.5);sph(bell,M.gold,0,-.65,0,.34,.2,.34);E.bell=bell;E.anchors.bell=V3(2.4,3.6,-54+4.2);
    box(g,M.wood,2.4,4.7,4.2,.12,.12,.12);box(g,M.wood,2.4,4.5,4.2,.5,.1,.1);
    /* lamp rows on the steps */
    for(let k=-3;k<=3;k++)diya(k*1.0,.78,-54+4.9,k===-2||k===2);
    E.anchors.temple=V3(0,2.2,-54+5.5);
  })();

  /* electric poles, wires, tube lights, birds' perches */
  const wireM=new THREE.LineBasicMaterial({color:0x0b0b0f});
  const px=-3.9;
  for(let i=0;i<6;i++){
    const z=6-i*10.5,g=new THREE.Group();g.position.set(px,0,z);R.add(g);
    cyl(g,M.pole,0,3.7,0,.1,7.4);box(g,M.pole,0,6.6,0,.12,.12,2.2);box(g,M.pole,.7,4.6,0,1.4,.1,.1);
    const tube=box(g,M.lampTube,1.5,4.45,0,.12,.1,1.1,false);E.poles.push({g,z});
  }
  for(let i=0;i<5;i++){const z0=6-i*10.5,z1=z0-10.5;[-1,0,1].forEach(function(o){const pts=[];for(let k=0;k<=10;k++){const u=k/10;pts.push(V3(px,6.6-Math.sin(u*Math.PI)*.45,z0+(z1-z0)*u+o*.9));}
    R.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wireM));});}
  /* festive string lights across the road */
  for(let i=0;i<4;i++){const z=-1-i*11;bulbLine(-9,5.2,z,9,5.2,z,28,1.4);}
  return E;
}
PV.Env={build:Env,T:T,M:M,GEO:GEO,box:box,cyl:cyl,sph:sph,mesh:mesh,std:std,sign:sign,V3:V3};
})();
