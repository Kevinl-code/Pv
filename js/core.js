(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[(Math.random()*a.length)|0];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Sound engine (all synthesized) ---------------- */
const Snd=(function(){
  let ctx=null,master,dry,wet,noiseBuf,muted=false,unlocked=false;
  const listeners=[];
  function impulse(sec,decay){
    const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++){const e=Math.pow(1-i/n,decay);d[i]=(Math.random()*2-1)*e*(i<400?i/400:1);}}
    return b;
  }
  function init(){
    if(ctx)return true;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();
    master=ctx.createGain();master.gain.value=.9;
    const comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-16;comp.knee.value=20;comp.ratio.value=8;comp.attack.value=.002;comp.release.value=.25;
    master.connect(comp);comp.connect(ctx.destination);
    dry=ctx.createGain();dry.connect(master);
    wet=ctx.createGain();wet.gain.value=.6;
    const conv=ctx.createConvolver();conv.buffer=impulse(2.6,2.4);
    wet.connect(conv);conv.connect(master);
    /* slap echo, like a bang bouncing off a row of houses */
    const dl=ctx.createDelay(1);dl.delayTime.value=.19;
    const fb=ctx.createGain();fb.gain.value=.26;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;
    wet.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(master);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    return true;
  }
  function ok(){return ctx&&!muted&&unlocked;}
  function now(){return ctx.currentTime+.03;}
  function route(node,send,pan){
    let n=node;
    if(pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);node.connect(p);n=p;}
    n.connect(dry);
    if(send>0){const s=ctx.createGain();s.gain.value=send;n.connect(s);s.connect(wet);}
  }
  function noiseSrc(t,dur){
    const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;
    s.start(t,rand(0,1.6));s.stop(t+dur+.05);return s;
  }
  function env(t,a,peak,d){
    const g=ctx.createGain();
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak,.0002),t+a);
    g.gain.exponentialRampToValueAtTime(.0001,t+a+d);
    return g;
  }
  function filt(type,f,q){const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;return b;}

  /* one explosion. size: 0.3 firecracker .. 1.6 sky shell */
  function bang(t,o){
    o=o||{};const vol=o.vol==null?1:o.vol,size=o.size||1,pan=o.pan||0,far=o.far||0;
    const bright=1-far*.7;
    /* sharp crack */
    let n=noiseSrc(t,.2),f=filt('highpass',1200+800*bright),g=env(t,.0008,.9*vol,.05+.05*size);
    n.connect(f);f.connect(g);route(g,.35,pan);
    /* body */
    n=noiseSrc(t,.6*size+.2);f=filt('lowpass',7000*bright+400);
    f.frequency.setValueAtTime(7000*bright+400,t);f.frequency.exponentialRampToValueAtTime(220,t+.35*size+.1);
    g=env(t,.002,1.0*vol,.2*size+.12);n.connect(f);f.connect(g);route(g,.5,pan);
    /* chest thump */
    const osc=ctx.createOscillator();osc.type='sine';
    osc.frequency.setValueAtTime(150-20*far,t);osc.frequency.exponentialRampToValueAtTime(34,t+.4*size+.1);
    g=env(t,.004,1.15*vol*Math.min(size,1.4),.4*size+.15);osc.connect(g);route(g,.2,pan);osc.start(t);osc.stop(t+.8*size+.3);
    /* room tail */
    if(size>.5){
      n=noiseSrc(t,1.4*size);f=filt('lowpass',650);g=env(t+.02,.06,.32*vol,.9*size);
      n.connect(f);f.connect(g);route(g,.9,pan);
    }
  }
  /* burst of tiny clicks: sparklers, crackle of a shell, paper cracks */
  function crackle(t,dur,rate,vol,fmin,fmax,pan,ramp){
    const count=Math.min(420,Math.floor(dur*rate));
    for(let i=0;i<count;i++){
      const u=Math.random();
      let tt=t+dur*(ramp==='down'?1-Math.pow(u,1.6):ramp==='up'?Math.pow(u,1.5):u);
      const s=ctx.createBufferSource();s.buffer=noiseBuf;s.start(tt,rand(0,1.8),.03);
      const f=filt('bandpass',rand(fmin,fmax),rand(.8,3));
      const g=env(tt,.0006,vol*rand(.12,1)*(Math.random()<.08?1.8:1),rand(.006,.03));
      s.connect(f);f.connect(g);route(g,.3,(pan||0)+rand(-.15,.15));
    }
  }
  function hiss(t,dur,vol,f0,f1,q,pan,attack,release){
    const n=noiseSrc(t,dur),f=filt('bandpass',f0,q||1);
    f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(f1,30),t+dur);
    const g=ctx.createGain();attack=attack||.08;release=release||.25;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+attack);
    g.gain.setValueAtTime(vol,t+Math.max(attack,dur-release));g.gain.linearRampToValueAtTime(.0001,t+dur);
    n.connect(f);f.connect(g);route(g,.3,pan);
  }
  function whistle(t,dur,f0,f1,vol,pan){
    const o=ctx.createOscillator();o.type='triangle';
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=7;lg.gain.value=f0*.015;lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+.1);
    const bp=filt('bandpass',f1,3);bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.2);g.gain.setValueAtTime(vol,t+dur*.8);g.gain.linearRampToValueAtTime(.0001,t+dur);
    o.connect(bp);bp.connect(g);route(g,.5,pan);o.start(t);o.stop(t+dur+.1);
    hiss(t,dur,vol*.7,f0*1.6,f1*1.6,1.4,pan,.15,.4);
  }
  function fuse(t,dur,vol,pan){hiss(t,dur,(vol||.25),5200,3600,.9,pan,.1,.15);crackle(t,dur,22,.2*(vol||.25)/.25,3000,8000,pan);}

  const api={
    unlock(){
      if(!init())return false;
      unlocked=true;
      if(ctx.state==='suspended')ctx.resume();
      ensureBeds();
      listeners.forEach(f=>f());return true;
    },
    toggle(){
      if(!unlocked){api.unlock();muted=false;}else muted=!muted;
      if(master)master.gain.setTargetAtTime(muted?0:.9,ctx.currentTime,.05);
      listeners.forEach(f=>f());return api.on();
    },
    on(){return unlocked&&!muted;},
    onChange(f){listeners.push(f);},
    time(){return ctx?ctx.currentTime:0;},

    /* ---- the seven voices ---- */
    fuse(d,dur,pan){if(!ok())return;fuse(now()+d,dur,.22,pan||0);},
    sparkler(d,dur){
      if(!ok())return;const t=now()+d;
      hiss(t,dur,.16,7500,5200,.7,0,.2,.8);
      crackle(t,dur,75,.5,3500,9500,0,'down');
      hiss(t,dur,.05,1800,900,1,0,.2,.8);
    },
    flowerpot(d,dur){
      if(!ok())return;const t=now()+d;
      hiss(t,dur,.5,500,1300,.7,0,.9,.9);
      hiss(t,dur,.28,2600,4800,.8,0,.9,.9);
      const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(52,t);o.frequency.linearRampToValueAtTime(75,t+1);o.frequency.linearRampToValueAtTime(48,t+dur);
      const lp=filt('lowpass',180),g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.2,t+.9);g.gain.setValueAtTime(.2,t+dur-.9);g.gain.linearRampToValueAtTime(.0001,t+dur);
      o.connect(lp);lp.connect(g);route(g,.3,0);o.start(t);o.stop(t+dur+.1);
      crackle(t+1.2,dur-1.6,10,.3,1500,5000,0);
    },
    chakkaram(d,dur){
      if(!ok())return;const t=now()+d;
      const spin=1.2;
      /* whirr: pitch follows wheel speed */
      const o=ctx.createOscillator();o.type='sawtooth';
      o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(300,t+spin);o.frequency.setValueAtTime(300,t+dur-1);o.frequency.exponentialRampToValueAtTime(90,t+dur);
      const bp=filt('bandpass',900,1.4),g=ctx.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.2,t+spin);g.gain.setValueAtTime(.2,t+dur-1);g.gain.linearRampToValueAtTime(.0001,t+dur);
      const trem=ctx.createOscillator(),tg=ctx.createGain();trem.frequency.setValueAtTime(8,t);trem.frequency.linearRampToValueAtTime(34,t+spin);tg.gain.value=.08;trem.connect(tg);tg.connect(g.gain);trem.start(t);trem.stop(t+dur+.1);
      o.connect(bp);bp.connect(g);route(g,.3,0);o.start(t);o.stop(t+dur+.1);
      hiss(t,dur,.42,1100,2600,.8,0,spin,1);
      crackle(t+.4,dur-.6,38,.35,2500,8000,0);
    },
    rocket(d,up,delay){
      if(!ok())return;const t=now()+d;
      hiss(t,.12,.3,3000,2500,1,0);
      hiss(t+.05,up,.55,1400,3400,.8,0,.15,.3);
      whistle(t+.1,up,520,2300,.2,0);
      const bt=t+up+(delay||.15);
      bang(bt,{vol:.85,size:1.1});
      crackle(bt+.15,1.1,40,.4,1500,6500,0,'down');
    },
    lakshmi(d){if(!ok())return;bang(now()+d,{vol:1,size:1.25});},
    ladi(d,times){
      if(!ok())return;const t=now()+d;
      times.forEach((tt,i)=>{
        const big=(i%9===4);
        bang(t+tt,{vol:(big?.55:.32)+Math.random()*.25,size:big?.42:.26,pan:rand(-.25,.25)});
      });
    },
    sky(d){
      if(!ok())return;const t=now()+d;
      bang(t,{vol:.55,size:.7});                    /* mortar thump */
      whistle(t+.15,2.2,260,1800,.22,0);
      hiss(t+.1,2.2,.35,900,3000,.8,0,.2,.5);
      const bt=t+2.35;
      bang(bt,{vol:1,size:1.6});
      bang(bt+.12,{vol:.7,size:1.2,far:.4});
      crackle(bt+.7,2.2,48,.45,1500,7000,0,'down');
    },
    /* a shell burst heard from a distance, used by the hero sky */
    shell(d,up,pan,size,withCrackle){
      if(!ok())return;const t=now()+d;
      whistle(t,up,400+rand(-60,60),2000+rand(-200,300),.12,pan);
      hiss(t,up,.2,1200,3000,.9,pan,.1,.3);
      const bt=t+up+rand(.18,.34);
      bang(bt,{vol:.75*size,size:.9*size+.2,pan:pan,far:.5});
      if(withCrackle)crackle(bt+.5,1.4,34,.3,1500,6000,pan,'down');
    },
    thunder(d){if(!ok())return;const t=now()+d;bang(t,{vol:.5,size:1.8,far:.8});hiss(t,2.6,.4,320,70,.6,0,.3,1.6);},
    /* quick impact noises for the villain game */
    thud(d,vol){if(!ok())return;const t=now()+d;bang(t,{vol:vol||.8,size:.6});},
    bangAt(d,o){if(!ok())return;bang(now()+d,o);},
    crackleAt(d,dur,rate,vol){if(!ok())return;crackle(now()+d,dur,rate,vol||.4,1500,7000,0,'down');},
    whistleAt(d,dur,f0,f1,vol){if(!ok())return;whistle(now()+d,dur,f0,f1,vol||.2,0);}
  };
  /* ===== v2: village ambience, story sounds ===== */
  let beds=null,mood={calm:.3,night:0,dread:0,crowd:.3};
  function ensureBeds(){
    if(beds||!ctx)return;
    beds={};
    const mk=function(type,f,q){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.start(0,rand(0,1.5));const b=filt(type,f,q);const gn=ctx.createGain();gn.gain.value=0;s.connect(b);b.connect(gn);gn.connect(master);return gn;};
    beds.wind=mk('lowpass',380,.5);beds.crowd=mk('bandpass',650,.7);
    beds.cric=[4300,4650].map(function(fr,i){
      const o=ctx.createOscillator();o.frequency.value=fr;const g=ctx.createGain();g.gain.value=0;
      const l=ctx.createOscillator();l.frequency.value=5.8+i*1.7;const lg=ctx.createGain();lg.gain.value=.5;l.connect(lg);
      const c=ctx.createGain();c.gain.value=0;lg.connect(c.gain);o.connect(c);c.connect(g);g.connect(master);o.start();l.start();return g;});
    beds.drone=ctx.createGain();beds.drone.gain.value=0;
    [[43,'sawtooth'],[43.7,'sawtooth'],[61.7,'sine'],[92.5,'sine']].forEach(function(p){
      const o=ctx.createOscillator();o.type=p[1];o.frequency.value=p[0];const lp=filt('lowpass',150,.7);o.connect(lp);lp.connect(beds.drone);o.start();});
    beds.drone.connect(master);
    api.setMood({});
  }
  api.setMood=function(m){
    for(const k in m)mood[k]=m[k];
    if(!beds||!ctx)return;const T=ctx.currentTime,s=.6;
    beds.wind.gain.setTargetAtTime(.05+.12*mood.dread,T,s);
    beds.crowd.gain.setTargetAtTime(.075*mood.crowd*(1-mood.dread),T,s);
    beds.cric.forEach(function(g,i){g.gain.setTargetAtTime(.022*mood.night*(1-mood.dread*.85)*(i?.7:1),T,s);});
    beds.drone.gain.setTargetAtTime(.2*mood.dread,T,s);
  };
  api.bark=function(d,pan,p){
    if(!ok())return;const t=now()+d;p=p||1;const n=2+((Math.random()*3)|0);
    for(let i=0;i<n;i++){
      const tt=t+i*rand(.3,.4);
      const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(430*p,tt);o.frequency.exponentialRampToValueAtTime(220*p,tt+.17);
      const g=env(tt,.012,.55,.17),f1=filt('bandpass',760*p,3),f2=filt('bandpass',1550*p,4);
      o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);route(g,.5,pan);o.start(tt);o.stop(tt+.3);
      const s=noiseSrc(tt,.2),nf=filt('bandpass',1100,1.4),ng=env(tt,.008,.2,.1);s.connect(nf);nf.connect(ng);route(ng,.4,pan);
    }
  };
  api.thunder=function(d,v,pan){
    if(!ok())return;const t=now()+d;v=v||1;
    let n=noiseSrc(t,.2),f=filt('highpass',2600),g=env(t,.001,.55*v,.14);n.connect(f);f.connect(g);route(g,.7,pan);
    n=noiseSrc(t,3.8);f=filt('lowpass',450);f.frequency.setValueAtTime(450,t);f.frequency.exponentialRampToValueAtTime(70,t+3.2);
    g=env(t+.03,.2,.95*v,3.2);n.connect(f);f.connect(g);route(g,.9,pan);
    const o=ctx.createOscillator();o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(27,t+2.6);g=env(t,.12,.55*v,2.6);o.connect(g);route(g,.3,pan);o.start(t);o.stop(t+3.2);
  };
  api.buzz=function(d,dur,v){
    if(!ok())return;const t=now()+d;v=v||.18;
    const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=100;const o2=ctx.createOscillator();o2.type='square';o2.frequency.value=50;
    const hp=filt('highpass',260),g=ctx.createGain();g.gain.setValueAtTime(0,t);
    for(let k=0;k<dur;k+=.035)g.gain.setValueAtTime(Math.random()<.65?v:0,t+k);g.gain.setValueAtTime(0,t+dur);
    o.connect(hp);o2.connect(hp);hp.connect(g);route(g,.3,0);o.start(t);o2.start(t);o.stop(t+dur);o2.stop(t+dur);
  };
  api.bell=function(d,f,v,pan){
    if(!ok())return;const t=now()+d;f=f||330;v=v||.3;
    [[1,3.5],[2.01,2.4],[2.76,1.6],[5.4,.9],[8.9,.5]].forEach(function(p,i){
      const o=ctx.createOscillator();o.type='sine';o.frequency.value=f*p[0];const g=env(t,.004,v/(1+i*.7),p[1]);o.connect(g);route(g,.7,pan||0);o.start(t);o.stop(t+p[1]+.3);});
  };
  api.whisper=function(d,dur,pan,v){
    if(!ok())return;const t=now()+d;v=v||.1;
    const n=noiseSrc(t,dur),f=filt('bandpass',2200,2.4);f.frequency.setValueAtTime(1800,t);f.frequency.linearRampToValueAtTime(3400,t+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,t);for(let k=0;k<dur;k+=.07)g.gain.linearRampToValueAtTime(Math.random()*v*Math.sin(Math.PI*k/dur),t+k);g.gain.linearRampToValueAtTime(0,t+dur);
    n.connect(f);f.connect(g);route(g,.8,pan||0);
  };
  api.gateOpen=function(d,dur){
    if(!ok())return;const t=now()+d;
    const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(30,t);o.frequency.exponentialRampToValueAtTime(82,t+dur);
    const lp=filt('lowpass',260),g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.55,t+dur*.8);g.gain.linearRampToValueAtTime(.0001,t+dur+1.5);
    o.connect(lp);lp.connect(g);route(g,.5,0);o.start(t);o.stop(t+dur+1.6);
    [220,233,311].forEach(function(fr,i){const x=ctx.createOscillator();x.type='sine';x.frequency.setValueAtTime(fr*.5,t);x.frequency.exponentialRampToValueAtTime(fr*1.4,t+dur);
      const xg=ctx.createGain();xg.gain.setValueAtTime(.0001,t);xg.gain.linearRampToValueAtTime(.05,t+dur*.9);xg.gain.linearRampToValueAtTime(.0001,t+dur+1);x.connect(xg);route(xg,.8,(i-1)*.5);x.start(t);x.stop(t+dur+1.1);});
    hiss(t,dur,.28,300,4200,.8,0,dur*.8,.6);crackle(t+dur*.3,dur*.7,28,.4,2000,7000,0,'up');
    bang(t+dur,{vol:.9,size:1.7});
  };
  api.gateClose=function(d,dur){
    if(!ok())return;const t=now()+d;
    const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(26,t+dur);
    const lp=filt('lowpass',300),g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.5,t+.3);g.gain.linearRampToValueAtTime(.0001,t+dur);
    o.connect(lp);lp.connect(g);route(g,.5,0);o.start(t);o.stop(t+dur+.1);
    hiss(t,dur,.3,5000,300,.8,0,.2,.8);bang(t+dur,{vol:1,size:1.9});api.thunder(dur-.1,.7);
  };
  api.flock=function(d,dur){
    if(!ok())return;const t=now()+d;
    hiss(t,dur,.12,3800,2500,.8,0,.05,.6);
    for(let i=0;i<26;i++){const tt=t+Math.random()*dur,f=rand(3000,5200);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(f,tt);o.frequency.exponentialRampToValueAtTime(f*rand(.7,1.3),tt+.1);const g=env(tt,.01,.07,.1);o.connect(g);route(g,.4,rand(-.8,.8));o.start(tt);o.stop(tt+.2);}
  };
  api.chirps=function(d,dur,v){
    if(!ok())return;const t=now()+d;v=v||.07;
    for(let i=0;i<dur*5;i++){const tt=t+Math.random()*dur,f=rand(2800,5000),pan=rand(-.8,.8);
      for(let k=0;k<2+((Math.random()*3)|0);k++){const o=ctx.createOscillator();o.type='sine';const t2=tt+k*.09;o.frequency.setValueAtTime(f,t2);o.frequency.exponentialRampToValueAtTime(f*rand(.8,1.4),t2+.07);const g=env(t2,.008,v,.07);o.connect(g);route(g,.5,pan);o.start(t2);o.stop(t2+.12);}}
  };
  api.heartbeat=function(d,v){
    if(!ok())return;const t=now()+d;v=v||.5;
    [0,.28].forEach(function(dt,i){const o=ctx.createOscillator();o.frequency.setValueAtTime(70,t+dt);o.frequency.exponentialRampToValueAtTime(38,t+dt+.18);const g=env(t+dt,.005,v*(i?.7:1),.22);o.connect(g);route(g,.2,0);o.start(t+dt);o.stop(t+dt+.4);});
  };
  api.click=function(d,v){if(!ok())return;const t=now()+(d||0);const o=ctx.createOscillator();o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(420,t+.05);const g=env(t,.002,v||.12,.06);o.connect(g);route(g,.1,0);o.start(t);o.stop(t+.12);};
  api.ember=function(){if(!ok())return;api.bell(0,880,.22);api.bell(.12,1318,.16);api.bell(.26,1760,.12);};
  api.clink=function(d){if(!ok())return;const t=now()+(d||0);[3100,4700,6200].forEach(function(f,i){const o=ctx.createOscillator();o.frequency.value=f;const g=env(t,.001,.12/(i+1),.25);o.connect(g);route(g,.4,0);o.start(t);o.stop(t+.4);});};
  api.pour=function(d,dur){if(!ok())return;hiss(now()+d,dur,.12,2200,1600,.8,0,.1,.3);};
  api.ring=function(d,n){if(!ok())return;const t=now()+d;for(let i=0;i<(n||3);i++){[0,.18].forEach(function(dt){const o=ctx.createOscillator();o.type='sine';o.frequency.value=i%2?480:440;const g=env(t+i*.9+dt,.01,.14,.14);o.connect(g);route(g,.3,0);o.start(t+i*.9+dt);o.stop(t+i*.9+dt+.3);});}};
  api.applause=function(d,dur){if(!ok())return;const t=now()+d;crackle(t,dur,70,.22,900,3200,0,'down');hiss(t,dur,.05,1600,1200,.6,0,.5,1);};
  api.dawn=function(d){if(!ok())return;[261.6,329.6,392,523.3,659.3].forEach(function(f,i){api.bell(d+i*.45,f,.18);});api.chirps(d+.5,6,.06);};
  api.sting=function(d){if(!ok())return;const t=now()+d;[55,58.3].forEach(function(f){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f,t);const lp=filt('lowpass',200),g=env(t,.05,.4,2.5);o.connect(lp);lp.connect(g);route(g,.6,0);o.start(t);o.stop(t+3);});bang(t,{vol:.5,size:1.4});};
  api.canPlay=function(){return ok();};
  api.ready=function(){return !!ctx;};
  return api;
})();

/* ---------------- Spark particle pool ---------------- */
class Sparks{
  constructor(scene,max,additive){
    this.max=max;this.cursor=0;
    const M=max;
    this.pos=new Float32Array(M*3);this.col=new Float32Array(M*3);this.siz=new Float32Array(M);this.alp=new Float32Array(M);
    this.vel=new Float32Array(M*3);this.life=new Float32Array(M);this.maxl=new Float32Array(M);
    this.grav=new Float32Array(M);this.drag=new Float32Array(M);this.base=new Float32Array(M);this.flick=new Float32Array(M);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));
    g.setAttribute('aCol',new THREE.BufferAttribute(this.col,3));
    g.setAttribute('aSize',new THREE.BufferAttribute(this.siz,1));
    g.setAttribute('aAlpha',new THREE.BufferAttribute(this.alp,1));
    this.geo=g;
    this.mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,
      blending:additive===false?THREE.NormalBlending:THREE.AdditiveBlending,
      uniforms:{uScale:{value:600},uHot:{value:additive===false?0:1}},
      vertexShader:'attribute vec3 aCol;attribute float aSize;attribute float aAlpha;varying vec3 vC;varying float vA;uniform float uScale;void main(){vC=aCol;vA=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(aSize*uScale/-mv.z,0.0);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vC;varying float vA;uniform float uHot;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;float a=smoothstep(.5,.0,d);a=a*a*1.7;vec3 c=mix(vC,vec3(1.0),smoothstep(.2,.0,d)*.75*uHot);gl_FragColor=vec4(c,clamp(a*vA,0.0,1.0));}'
    });
    this.points=new THREE.Points(g,this.mat);this.points.frustumCulled=false;scene.add(this.points);
  }
  emit(x,y,z,vx,vy,vz,r,g,b,life,size,grav,drag,flick){
    const i=this.cursor;this.cursor=(this.cursor+1)%this.max;
    const k=i*3;
    this.pos[k]=x;this.pos[k+1]=y;this.pos[k+2]=z;
    this.vel[k]=vx;this.vel[k+1]=vy;this.vel[k+2]=vz;
    this.col[k]=r;this.col[k+1]=g;this.col[k+2]=b;
    this.life[i]=life;this.maxl[i]=life;this.base[i]=size;this.siz[i]=size;this.alp[i]=1;
    this.grav[i]=grav==null?6:grav;this.drag[i]=drag==null?1:drag;this.flick[i]=flick||0;
  }
  update(dt){
    const P=this.pos,V=this.vel;
    for(let i=0;i<this.max;i++){
      if(this.life[i]<=0)continue;
      this.life[i]-=dt;
      if(this.life[i]<=0){this.alp[i]=0;this.siz[i]=0;continue;}
      const k=i*3,dr=Math.exp(-this.drag[i]*dt);
      V[k]*=dr;V[k+1]=V[k+1]*dr-this.grav[i]*dt;V[k+2]*=dr;
      P[k]+=V[k]*dt;P[k+1]+=V[k+1]*dt;P[k+2]+=V[k+2]*dt;
      const t=this.life[i]/this.maxl[i];
      this.alp[i]=Math.min(1,t*2.2)*(1+this.flick[i]*(Math.random()-.5)*1.6);
      this.siz[i]=this.base[i]*(.35+.65*t);
    }
    const a=this.geo.attributes;a.position.needsUpdate=a.aCol.needsUpdate=a.aSize.needsUpdate=a.aAlpha.needsUpdate=true;
  }
  clear(){this.life.fill(0);this.alp.fill(0);this.siz.fill(0);}
}

const RED=[[1,.1,.12],[1,.42,.3],[.95,.9,.9],[.62,.05,.1]];let UD=false;
const PAL=[[1,.78,.24],[1,.48,.1],[1,.16,.28],[.2,.92,.76],[.72,.42,1],[1,.95,.85],[.4,1,.45],[.35,.62,1]];

/* shell bursts shared by every scene */
function burst(sp,x,y,z,o){
  o=o||{};const s=o.scale||1,type=o.type||'peony';
  const c=o.col||pickCol();
  if(type==='peony'){
    const n=Math.floor(240*(o.density||1));
    for(let i=0;i<n;i++){
      const u=Math.random()*2-1,a=Math.random()*6.2832,r=Math.sqrt(1-u*u),sp0=rand(4.2,6.4)*s;
      const w=Math.random()<.18;
      sp.emit(x,y,z,r*Math.cos(a)*sp0,u*sp0,r*Math.sin(a)*sp0,w?1:c[0],w?.95:c[1],w?.85:c[2],rand(1.5,2.3),.17*s,2.4,1.5,.5);
    }
  }else if(type==='ring'){
    const n=Math.floor(130*(o.density||1)),tilt=rand(0,3.1416),ct=Math.cos(tilt),st=Math.sin(tilt);
    for(let i=0;i<n;i++){
      const a=i/n*6.2832,sp0=6.2*s,px=Math.cos(a)*sp0,py=Math.sin(a)*sp0;
      sp.emit(x,y,z,px,py*ct,py*st,c[0],c[1],c[2],rand(1.5,2),.18*s,2.2,1.6,.4);
    }
    for(let i=0;i<50;i++){const u=Math.random()*2-1,a=Math.random()*6.2832,r=Math.sqrt(1-u*u),q=rand(1,2.4)*s;sp.emit(x,y,z,r*Math.cos(a)*q,u*q,r*Math.sin(a)*q,1,.95,.8,rand(.9,1.4),.14*s,2,1.4,.5);}
  }else if(type==='willow'){
    const n=Math.floor(200*(o.density||1));
    for(let i=0;i<n;i++){
      const u=Math.random()*2-1,a=Math.random()*6.2832,r=Math.sqrt(1-u*u),sp0=rand(2.6,5)*s;
      sp.emit(x,y,z,r*Math.cos(a)*sp0,u*sp0,r*Math.sin(a)*sp0,1,.74,.28,rand(3,4.4),.13*s,3.4,.95,.7);
    }
  }else if(type==='crackle'){
    const n=Math.floor(200*(o.density||1));
    for(let i=0;i<n;i++){
      const u=Math.random()*2-1,a=Math.random()*6.2832,r=Math.sqrt(1-u*u),sp0=rand(3.6,5.8)*s;
      sp.emit(x,y,z,r*Math.cos(a)*sp0,u*sp0,r*Math.sin(a)*sp0,c[0],c[1],c[2],rand(1.2,1.7),.16*s,2.6,1.5,.6);
    }
    if(o.later)o.later(.85,function(){
      for(let i=0;i<70;i++){
        const a=rand(0,6.28),u=rand(-1,1),rr=rand(1.2,3.6)*s;
        const px=x+Math.cos(a)*Math.sqrt(1-u*u)*rr,py=y+u*rr-1.5*s,pz=z+Math.sin(a)*Math.sqrt(1-u*u)*rr;
        sp.emit(px,py,pz,rand(-.4,.4),rand(-.4,.4),rand(-.4,.4),1,.96,.85,rand(.12,.38),.2*s,0,1,1.2);
      }
    });
  }
}
function pickCol(){return UD?pick(RED):pick(PAL);}
function pickType(){return pick(['peony','peony','ring','willow','crackle','crackle']);}

/* ---------------- scene factory ---------------- */
const stages=[];
function makeStage(canvas,fov,max,additive,manual){
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(e){
    const m=document.createElement('div');m.className='nogl';m.textContent='3D needs WebGL, which this browser has switched off.';
    canvas.parentNode.appendChild(m);return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(fov,1,.1,300);
  const sparks=new Sparks(scene,max,true);
  const st={canvas,renderer,scene,camera,sparks,visible:true,sched:[],time:0,aspect:1,update:null};
  st.later=function(sec,fn){st.sched.push({t:st.time+sec,fn});};
  function resize(){
    const w=canvas.clientWidth||300,h=canvas.clientHeight||300;
    renderer.setSize(w,h,false);camera.aspect=w/h;st.aspect=w/h;camera.updateProjectionMatrix();
    const s=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360));
    sparks.mat.uniforms.uScale.value=s;
    if(st.bits)st.bits.mat.uniforms.uScale.value=s;
    if(st.onResize)st.onResize();
  }
  st.resize=resize;
  new ResizeObserver(resize).observe(canvas);
  if(!manual)new IntersectionObserver(function(es){st.visible=es[0].isIntersecting;},{threshold:0}).observe(canvas);
  resize();stages.push(st);return st;
}
let last=performance.now();
function frame(ts){
  const dt=Math.min(.05,(ts-last)/1000);last=ts;
  for(const st of stages){
    if(!st.visible)continue;
    st.time+=dt;
    for(let i=st.sched.length-1;i>=0;i--){if(st.sched[i].t<=st.time){const f=st.sched[i].fn;st.sched.splice(i,1);try{f();}catch(err){console.error('sched',err);}}}
    try{if(st.update)st.update(dt);}catch(err){console.error('update',err);}
    try{st.sparks.update(dt);if(st.bits)st.bits.update(dt);st.renderer.render(st.scene,st.camera);}catch(err){console.error('render',err);}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


window.PV={pickCol:pickCol,$:$,rand:rand,clamp:clamp,pick:pick,reduce:reduce,Snd:Snd,Sparks:Sparks,PAL:PAL,burst:burst,pickType:pickType,makeStage:makeStage,stages:stages,
  mobile:matchMedia('(max-width:820px)').matches||/Mobi|Android/i.test(navigator.userAgent)};
})();
