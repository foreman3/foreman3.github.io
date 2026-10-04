// Arena placement isolates fights. Inputs, damage, shots and discoveries remain real.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}});try{await page.goto('http://127.0.0.1:4173/hollow-signal/?test');const rows=await page.evaluate(()=>{
 __hollow.manual(true);__hollow.start();const rows=[],pressed=new Set();const key=(code,on)=>{if(pressed.has(code)===on)return;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));if(on)pressed.add(code);else pressed.delete(code);};
 function close(){document.getElementById('story-close').click();}
 function getRelic(id){__hollow.enter(id);const a=__hollow.world().objects.find(o=>o.type==='power');__hollow.warp(a.x,a.y-8);key('KeyE',true);key('KeyE',false);close();}
 function tank(id){__hollow.enter(id);const a=__hollow.world().objects.find(o=>o.type==='tank');__hollow.warp(a.x,a.y);__hollow.step(1,false);}
 getRelic(3);tank(2);
 for(let index=0;index<5;index++){
  if(index===1){getRelic(8);tank(9);}if(index===2){getRelic(11);}
  __hollow.enter([4,10,16,22,28][index]);__hollow.warp(__hollow.world().arena.x+250);key('ArrowRight',true);let frames=0,chargeAge=0,rest=0,minHP=__hollow.snapshot().p.hp,startDeaths=__hollow.snapshot().deaths;
  while(frames<6000){const s=__hollow.snapshot(),p=s.p,b=s.boss;if(s.mode!=='play')break;
   if(!b){key('ArrowRight',true);key('ArrowLeft',false);__hollow.step(3,false);frames+=3;continue;}
   const target=b.x<__hollow.world().arena.x+440?__hollow.world().arena.x+720:__hollow.world().arena.x+210;key('ArrowRight',p.x<target-18);key('ArrowLeft',p.x>target+18);
   const near=__hollow.bullets().filter(a=>a.owner==='enemy'&&Math.abs(a.x-p.x)<130&&a.y+a.h>p.y-20&&a.y<p.y+p.h+30);
   const body=b.phase==='attack'&&b.y>__hollow.world().floor-220&&Math.abs(b.x-p.x)<230;
   const jump=p.ground&&(near.length>0||body);
   key('Space',jump||pressed.has('Space')&&p.vy<-25);
   const above=Math.abs(b.x+55-p.x-14)<120&&b.y+108<p.y+20;key('ArrowUp',above);
   if(rest>0){key('KeyX',false);rest-=3;}else if(chargeAge>=42&&(above||b.y+108>p.y+20&&b.y<p.y+42)){
    if(!above){key('ArrowRight',b.x>p.x);key('ArrowLeft',b.x<=p.x);__hollow.step(1,false);frames++;}
    key('KeyX',false);chargeAge=0;rest=15;
   }else{key('KeyX',true);chargeAge+=3;}
   __hollow.step(3,false);frames+=3;minHP=Math.min(minHP,__hollow.snapshot().p.hp);
   if(__hollow.snapshot().deaths-startDeaths>2)break;
  }
  for(const code of [...pressed])key(code,false);
  const s=__hollow.snapshot();rows.push({guardian:index+1,weapon:s.weapon,result:s.mode,seconds:frames/60,remainingIntegrity:s.p.hp,maxIntegrity:s.maxHP,minIntegrity:minHP,recoveries:s.deaths-startDeaths,bossHP:s.boss?.hp});if(s.mode==='story')close();
 }
 return rows;
});console.log(JSON.stringify(rows,null,2));fs.writeFileSync(path.join(__dirname,'combat.json'),JSON.stringify(rows,null,2));assert(rows.every(r=>r.result==='story'&&r.bossHP<=0));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
