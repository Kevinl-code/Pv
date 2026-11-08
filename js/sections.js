/* DigiDiwali, companions, responsible celebration, creator. */
(function(){
'use strict';
const {$,clamp,Snd,reduce}=PV;
const $$=s=>[].slice.call(document.querySelectorAll(s));
const ember=id=>PV.Story.ember(id);
function tiles(box,items,onToggle,single){
  items.forEach(function(it,i){
    const b=document.createElement('button');b.type='button';b.className='tile';b.textContent=it;b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){
      Snd.unlock();Snd.click();
      if(single){[].forEach.call(box.children,c=>{c.classList.remove('on');c.setAttribute('aria-pressed','false');});}
      const on=single?true:!b.classList.contains('on');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');onToggle(i,on,b);
    });box.appendChild(b);
  });
}
const picked=box=>[].filter.call(box.children,c=>c.classList.contains('on')).map(c=>c.textContent);

/* ---- shared table ---- */
(function(){
  const dishes=['Adhirasam','Murukku','Laddu','Payasam','Mysore pak','Seedai','Thattai'],leaf=$('#leaf'),box=$('#dishes');
  function upd(){const p=picked(box);leaf.innerHTML=p.length?p.map(x=>'<span>'+x+'</span>').join(''):'<span style="opacity:.6">An empty leaf</span>';
    $('#feastOut').innerHTML='<b>'+p.length+'</b> / 4 dishes'+(p.length>=4?' · Everyone eats together.':'');
    if(p.length>=4){$('#feast').classList.add('done');ember('feast');}}
  tiles(box,dishes,upd);
})();
/* ---- one call ---- */
(function(){
  const who=['Paati','Chithappa','Cousin abroad','Old friend'],box=$('#who');let sel=null,t=0;
  tiles(box,who,(i)=>{sel=who[i];$('#callOut').textContent='Ready to call '+sel+'.';},true);
  $('#callBtn').addEventListener('click',function(){
    Snd.unlock();if(!sel){$('#callOut').textContent='Pick someone first.';return;}
    clearTimeout(t);$('#callOut').textContent='Calling '+sel+'…';Snd.ring(0,3);
    t=setTimeout(function(){$('#callOut').innerHTML='<b>'+sel+'</b> picks up. “Happy Deepavali! I was just thinking about you.”';Snd.bell(0,784,.15);},2700);
  });
})();
/* ---- budget ---- */
(function(){
  const ids=['bTotal','bGive','mealCost','kitCost'];
  function upd(){
    const tot=+$('#bTotal').value||0,pct=+$('#bGive').value,meal=Math.max(1,+$('#mealCost').value||60),kit=Math.max(1,+$('#kitCost').value||500),give=Math.round(tot*pct/100);
    $('#bGiveN').textContent=pct+'%';$('#bBar').style.width=pct+'%';
    $('#bOut').innerHTML='Give <b>₹'+give.toLocaleString('en-IN')+'</b>: about <b>'+Math.floor(give/meal)+'</b> meals, or <b>'+Math.floor(give/kit)+'</b> school kits. Keep <b>₹'+(tot-give).toLocaleString('en-IN')+'</b> for your own celebration.';
  }
  ids.forEach(i=>$('#'+i).addEventListener('input',upd));upd();
})();
/* ---- diwali box ---- */
(function(){
  const items=['Rice','Oil','Sweets','New clothes','Notebooks','Toys','Soap'],box=$('#boxTiles');
  tiles(box,items,function(){const p=picked(box);$('#boxOut').innerHTML='<b>'+p.length+'</b> items packed'+(p.length>=4?' · Someone gets a happier Deepavali.':'');
    if(p.length>=4){$('#boxCard').classList.add('done');ember('give');}});
})();

/* ---- companions ---- */
(function(){
  const A={Dog:{e:'🐕',tips:['Keep them indoors in a quiet room, windows and curtains closed.','Never tie a dog outside while crackers are being burst.','Play soft music or the TV to soften the bangs.','Keep an ID tag on and a recent photo handy in case they bolt.','Stay with them. Your calm helps.']},
    Cat:{e:'🐈',tips:['Give a covered bed or box in a quiet inner room.','Keep windows and balcony doors shut.','Keep them inside. Panicked cats run far.','Leave food and water within reach of the hiding spot.']},
    Birds:{e:'🦜',tips:['Do not burst crackers near trees and nests.','Cover a pet bird\'s cage on the noisy side and move it to an inner room.','Keep fireworks away from wires and roofs where birds roost.','Burst away from dusk roosting trees.']},
    Cow:{e:'🐄',tips:['Never burst crackers near cattle sheds or roaming cows.','Street animals cannot run to safety. Give them a wide berth.','Never throw crackers at any animal.','If you find an injured animal, call a local rescue group.']}};
  const chips=$('#aniChips');let cur='Dog';
  function show(k){cur=k;[].forEach.call(chips.children,c=>c.setAttribute('aria-pressed',c.dataset.k===k?'true':'false'));
    $('#aniTitle').textContent=k+' · '+A[k].tips.length+' things to do';$('#aniTips').innerHTML=A[k].tips.map(t=>'<li style="margin:.35rem 0">'+t+'</li>').join('');mood();}
  Object.keys(A).forEach(k=>{const b=document.createElement('button');b.className='chip';b.dataset.k=k;b.textContent=A[k].e+' '+k;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{Snd.click();show(k);});chips.appendChild(b);});
  const room=$('#room'),its=[['Water bowl','🥣',12,66],['Soft blanket','🧺',72,70],['Closed windows','🪟',20,12],['Quiet music','🎵',80,16],['Hiding box','📦',86,66],['Familiar toy','🧸',32,74],['Lights on','💡',50,10]];
  const els=its.map(i=>{const d=document.createElement('span');d.className='it';d.textContent=i[1];d.style.left=i[2]+'%';d.style.top=i[3]+'%';room.appendChild(d);return d;});
  const box=$('#roomTiles');
  function mood(){const n=picked(box).length,p=Math.round(n/its.length*100);
    $('#calmN').textContent=p+'%';$('#calmFill').style.width=p+'%';
    $('#pet').textContent=p>=70?'😴':p>=35?'😟':'😰';
    $('#pet').style.filter='none';
    $('#roomCard h3').textContent=p>=70?'A calm '+cur.toLowerCase()+' corner':'Build a calm corner';
    if(n>=6){$('#roomCard').classList.add('done');ember('animals');}}
  tiles(box,its.map(i=>i[0]),(i,on)=>{els[i].classList.toggle('on',on);mood();});
  show('Dog');
})();

/* ---- safe distance ---- */
(function(){
  const c=$('#sdCanvas'),x=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2+10,ppm=26;let me={x:cx+60,y:cy+10},drag=false;
  function draw(){
    x.clearRect(0,0,W,H);x.fillStyle='#0e0a14';x.fillRect(0,0,W,H);
    const rings=[[5*ppm,'rgba(53,224,192,.10)','5 m'],[2*ppm,'rgba(255,200,61,.12)','2 m'],[.7*ppm,'rgba(224,36,63,.28)','']];
    x.font='11px "DM Mono",monospace';x.textAlign='center';
    rings.forEach(r=>{x.beginPath();x.arc(cx,cy,r[0],0,6.283);x.fillStyle=r[1];x.fill();x.setLineDash([5,5]);x.strokeStyle='rgba(242,228,196,.35)';x.stroke();x.setLineDash([]);if(r[2]){x.fillStyle='#a99cbb';x.fillText(r[2],cx,cy-r[0]-4);}});
    x.beginPath();x.arc(cx,cy,9,0,6.283);x.fillStyle='#e0243f';x.fill();x.fillStyle='#ffc83d';x.fillText('cracker',cx,cy+24);
    const d=Math.hypot(me.x-cx,me.y-cy)/ppm,ok=d>=5,mid=d>=2;
    x.beginPath();x.arc(me.x,me.y,12,0,6.283);x.fillStyle=ok?'#35e0c0':mid?'#ffc83d':'#e0243f';x.fill();x.fillStyle='#07060c';x.font='700 10px "DM Mono",monospace';x.fillText('YOU',me.x,me.y+3.5);
    $('#sdOut').innerHTML='You are <b>'+d.toFixed(1)+' m</b> away. '+(ok?'Good distance for a ground cracker.':mid?'Move back a little more.':'Too close. Light it at arm\'s length, then step back fast.')+' Aerial ones need far more room. Follow the instructions on the pack.';
  }
  function pos(e){const r=c.getBoundingClientRect();me.x=clamp((e.clientX-r.left)*W/r.width,14,W-14);me.y=clamp((e.clientY-r.top)*H/r.height,14,H-14);draw();}
  c.addEventListener('pointerdown',e=>{drag=true;c.setPointerCapture(e.pointerId);pos(e);});
  c.addEventListener('pointermove',e=>{if(drag)pos(e);});c.addEventListener('pointerup',()=>{drag=false;});
  draw();
})();
/* ---- how long it lasts ---- */
(function(){
  const L=[['Lakshmi vedi',1,'about 1 second'],['Rocket',6,'a few seconds'],['Chakkaram',30,'about half a minute'],['Sparkler',60,'about a minute'],['Call to Paati',1800,'half an hour or more'],['Shared family meal',3600,'an hour or more'],['Kolam with the kids',7200,'a whole afternoon']],box=$('#lastTiles');
  tiles(box,L.map(l=>l[0]),i=>{const l=L[i];$('#lastBar').style.width=(Math.log10(l[1]+1)/Math.log10(7201)*100)+'%';$('#lastOut').innerHTML='<b>'+l[0]+'</b> lasts '+l[2]+'. Enjoy both, but save room for the long ones.';},true);
})();
/* ---- haze ---- */
(function(){
  const r=$('#hazeRange');
  function upd(){const v=+r.value;$('#haze').style.opacity=(v/100*.85).toFixed(2);$('#hazeOut').textContent=v<15?'Clear evening.':v<45?'Hazy. Eyes start to sting.':v<75?'Thick smoke. Elders, babies and patients cough.':'Smoke hangs over the whole street for hours.';}
  r.addEventListener('input',upd);upd();
})();
/* ---- pledge ---- */
(function(){
  const P=['I will use only legal, permitted crackers.','I will keep a safe distance and supervise children.','I will follow local rules and time limits.','I will spend within my means and waste less.','I will give real time to family and friends.','I will share food or help someone in need.','I will protect animals, babies, elders and patients from loud noise.'],box=$('#pledge');
  P.forEach((t,i)=>{const l=document.createElement('label');l.className='chk';l.innerHTML='<input type="checkbox" id="pl'+i+'"><span>'+t+'</span>';box.appendChild(l);
    l.querySelector('input').addEventListener('change',()=>{Snd.unlock();Snd.click();upd();});});
  function upd(){const n=$$('#pledge input:checked').length;$('#pledgeOut').innerHTML='<b>'+n+'</b> / '+P.length+' checked';if(n===P.length){$('#pledgeCard').classList.add('done');ember('pledge');}}
  $('#copyPledge').addEventListener('click',function(){
    const t=P.filter((p,i)=>$('#pl'+i).checked).map(p=>'✓ '+p).join('\n')||'Tick at least one promise first.';
    const b=$('#copyPledge');const done=m=>{b.textContent=m;setTimeout(()=>b.textContent='Copy my pledge',1800);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText('My Diwali pledge\n'+t).then(()=>done('Copied'),()=>done('Copy failed'));else done('Select manually');
  });
})();

/* ---- creator ---- */
(function(){
  const face=$('#idcard .face'),card=$('#idcard');
  if(!reduce){card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;face.style.transform='rotateY('+(x*14)+'deg) rotateX('+(-y*14)+'deg)';});
    card.addEventListener('pointerleave',()=>{face.style.transform='';});}
  const C={
    'Technology':['Technology','Everything runs in your browser. Three.js builds the village, the people and the gate from code. Every bang, bark and bell is synthesized live with the Web Audio API. No audio files, no heavy assets.',()=>{Snd.unlock();Snd.bell(0,523,.2);}],
    'Cinematic experiences':['Cinematic experiences','I think in shots: a slow walk down a quiet street, then the sky changes. The letterbox bars, captions and slow camera moves are there to make you feel the turn.',()=>{document.body.classList.add('cine');setTimeout(()=>document.body.classList.remove('cine'),2600);}],
    'Creative experimentation':['Creative experimentation','Most Diwali sites sell something. I wanted one that makes you feel something, then do something kind. The story itself is the message.',()=>{const a=$('.avatar');a.classList.remove('spin');void a.offsetWidth;a.classList.add('spin');Snd.ember();}],
    'Stranger Things':['Stranger Things','A fan of the mood: flickering lights, small-town warmth, and something wrong in the sky. The gate here is original and built around a Tamil idea: darkness grows where people are alone. Not affiliated with the show.',()=>{Snd.unlock();const f=$('#flash');[0,260,520].forEach(d=>setTimeout(()=>{f.classList.add('on');setTimeout(()=>f.classList.remove('on'),90);},d));Snd.buzz(0,.6,.14);Snd.thunder(.2,.6);}]};
  const box=$('#cChips');
  Object.keys(C).forEach((k,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=k;b.setAttribute('aria-pressed',i===0?'true':'false');
    b.addEventListener('click',()=>{[].forEach.call(box.children,c=>c.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');$('#cPanel').innerHTML='<h4>'+C[k][0]+'</h4><p>'+C[k][1]+'</p>';C[k][2]();});box.appendChild(b);});
  $('#cPanel').innerHTML='<h4>'+C.Technology[0]+'</h4><p>'+C.Technology[1]+'</p>';
})();
})();
