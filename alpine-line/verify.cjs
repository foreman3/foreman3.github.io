const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out=process.env.ALPINE_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/01/01a0f60d-3d50-7101-b656-37990e60463a';
const base=process.env.ALPINE_BASE_URL||'http://127.0.0.1:8765';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});globalThis.activeBrowser=browser;fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await page.goto(base+'/alpine-line/?test=1');await page.waitForTimeout(250);assert.equal(await page.locator('#instruction-modal').isVisible(),true);assert.equal(await page.evaluate(()=>__alpineTest.state.time),0);
 await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'intro');await page.locator('#instruction-close').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'playing');
 const startX=await page.evaluate(()=>__alpineTest.state.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>__alpineTest.state.x)>startX);
 await page.keyboard.down('Space');await page.waitForTimeout(250);await page.keyboard.up('Space');assert.ok(await page.evaluate(()=>__alpineTest.state.reserve)<1);assert.ok(await page.evaluate(()=>__alpineTest.state.speed)<160);
 await page.locator('#help-button').click();const frozen=await page.evaluate(()=>__alpineTest.state.time);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>__alpineTest.state.time),frozen);await page.locator('#instruction-close').click();await page.keyboard.press('p');assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'paused');await page.keyboard.press('p');await page.keyboard.press('m');assert.equal(await page.evaluate(()=>__alpineTest.state.muted),true);await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__alpineTest.state.score),0);await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);
 await page.evaluate(()=>{
   __alpineTest.manual(true);
   window.skiRun=(n,delay=.18,smart=true,forcedMisses=0,forcedHits=0,maxTime=180)=>{
     const t=__alpineTest,s=t.state;t.begin(n);s.score=0;for(let i=0;i<forcedHits;i++){s.inv=0;t.damage();}s.inv=1.7;
     let elapsed=0,think=0,braking=0,decisions=0;
     while(s.mode==='playing'&&elapsed<maxTime){
       if(think<=0){think=delay;decisions++;const g=s.gates.find(g=>!g.done);let goal=g?.x||480;
         if(g&&g.num<=forcedMisses)goal=g.x+(g.x<480?1:-1)*(g.width/2+70);
         if(smart){
           const danger=s.objects.filter(o=>['tree','rock','rider'].includes(o.type)&&o.y>s.distance-20&&o.y-s.distance<s.speed*.8);
           const candidates=Array.from({length:25},(_,i)=>180+i*25),originalGoal=goal;let best=Infinity;
           for(const x of candidates){let cost=Math.abs(x-originalGoal)*.85+Math.abs(x-s.x)*.12;for(const o of danger){const forecast=o.type==='rider'?Math.max(180,Math.min(780,o.base+Math.sin((s.time+(o.y-s.distance)/s.speed)*1.25+o.phase)*160)):o.x;const margin=Math.abs(x-forecast);if(margin<60)cost+=(60-margin)*6;}
             if(g&&g.y-s.distance<s.speed*.4&&g.num>forcedMisses&&Math.abs(x-g.x)>g.width/2)cost+=1000;if(cost<best){best=cost;goal=x;}}
         }
         const error=goal-s.x-s.vx*.10;const move=Math.max(-1,Math.min(1,error/48));const useBrake=smart&&s.reserve>.1&&g&&g.y-s.distance<s.speed*.65&&Math.abs(g.x-s.x)>g.width*.48;t.setInput(move,useBrake);if(useBrake)braking++;
       }t.tick(1/60);elapsed+=1/60;think-=1/60;
     }t.setInput(0,false);t.draw();return{level:n,delay,smart,mode:s.mode,gates:s.passed,quota:s.cfg.quota,count:s.cfg.count,misses:s.missed,hearts:s.hearts,hits:s.hits,seconds:+elapsed.toFixed(1),braking,decisions};
   };
 });
 const curve=await page.evaluate(()=>Array.from({length:7},(_,i)=>skiRun(i+1,.18,true)));console.log('CURVE',JSON.stringify(curve));
 const developing=await page.evaluate(()=>Array.from({length:7},(_,i)=>skiRun(i+1,.42,false)));console.log('DEVELOPING',JSON.stringify(developing));
 const recovery=await page.evaluate(()=>skiRun(5,.18,true,3,2));console.log('RECOVERY',JSON.stringify(recovery));
 for(const r of curve)assert.equal(r.mode,'clear',`strong run ${r.level}`);for(const r of developing.slice(0,5))assert.equal(r.mode,'clear');for(const r of developing.slice(5))assert.equal(r.mode,'over');assert.equal(recovery.mode,'clear');assert.ok(recovery.misses>=3);assert.ok(recovery.hearts>=1);
 const mechanics=await page.evaluate(()=>{
  const t=__alpineTest,s=t.state;t.begin(2);const rough=s.objects.find(o=>o.type==='rough');s.distance=rough.y;s.x=rough.x;t.setInput(1);t.tick(1/60);const roughGrip=s.vx<30;
  t.begin(3);const mogul=s.objects.find(o=>o.type==='mogul');s.distance=mogul.y;s.x=mogul.x;t.tick(1/60);const bumps=s.slow>0&&s.hearts===5;
  t.begin(4);const rider=s.objects.find(o=>o.type==='rider'),old=rider.x;t.tick(.1);const crossing=rider.x!==old;
  t.begin(5);const linked=s.gates.some(g=>g.linked);s.inv=0;const tree=s.objects.find(o=>o.type==='tree');s.distance=tree.y;s.x=tree.x;t.tick(1/60);const collision=s.hearts===4&&s.inv>1&&s.slow>0;t.damage();const protection=s.hearts===4;
  t.begin(1);const gate=s.gates[0];s.distance=gate.y-1;s.x=gate.x;t.tick(1/60);const scoring=s.passed===1&&s.score>=125;
  t.begin(1);s.reserve=.5;t.setInput(0,false);for(let i=0;i<60;i++)t.tick(1/60);const recharge=s.reserve>.59;t.setInput(0,true);for(let i=0;i<60;i++)t.tick(1/60);const brake=s.reserve<.42&&s.speed<s.cfg.speed*.65;
  t.begin(1);t.setInput(0,true);s.reserve=.01;for(let i=0;i<180;i++)t.tick(1/60);const exhausted=s.reserve===0&&s.speed>s.cfg.speed*.98;t.setInput(0,false);for(let i=0;i<60;i++)t.tick(1/60);const releaseRecharge=s.reserve>.099;
  return{roughGrip,bumps,crossing,linked,collision,protection,scoring,recharge,brake,exhausted,releaseRecharge};
 });console.log('MECHANICS',JSON.stringify(mechanics));for(const[k,v]of Object.entries(mechanics))assert.equal(v,true,k);
 await page.evaluate(()=>skiRun(1));await page.locator('#next').click();assert.equal(await page.evaluate(()=>__alpineTest.state.level),2);
 await page.evaluate(()=>skiRun(7));assert.equal(await page.locator('#result-title').textContent(),'A perfect mountain.');await page.locator('#again').click();assert.equal(await page.evaluate(()=>__alpineTest.state.score),0);
 await page.evaluate(()=>{const t=__alpineTest;t.state.inv=0;t.state.hearts=1;t.damage()});assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'over');await page.locator('#again').click();assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'playing');
 await page.evaluate(()=>{const t=__alpineTest;t.state.distance=t.state.finish;t.tick(1/60)});assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'over');await page.locator('#again').click();
 await page.evaluate(()=>{const t=__alpineTest;t.state.score=880;t.begin(4);t.state.score=2000;t.state.inv=0;t.state.hearts=1;t.damage()});await page.locator('#retry').click();assert.equal(await page.evaluate(()=>__alpineTest.state.level),4);assert.equal(await page.evaluate(()=>__alpineTest.state.score),880);assert.equal(await page.evaluate(()=>__alpineTest.state.hearts),5);
 await page.keyboard.press('p');await page.locator('#help-button').click();await page.keyboard.press('r');await page.locator('#instruction-close').click();assert.equal(await page.evaluate(()=>__alpineTest.state.mode),'playing');
 const capture=await page.evaluate(()=>skiRun(5,.18,true,0,0,13));console.log('CAPTURE',JSON.stringify(capture));await page.locator('canvas').evaluate(e=>e.blur());await page.screenshot({path:out+'/alpine-line-gameplay.png'});
 await page.evaluate(()=>__alpineTest.manual(false));const desktopFrames=await frames(page);await page.evaluate(()=>__alpineTest.manual(true));console.log('DESKTOP FRAMES',JSON.stringify(desktopFrames));
 const layouts=[];
 for(const[width,height]of[[1440,900],[667,375],[740,390],[844,390],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(120);layouts.push(await page.evaluate(()=>{const r=id=>{const b=document.querySelector(id).getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};return{w:innerWidth,h:innerHeight,board:r('#playfield'),joy:r('[data-joystick]'),actions:r('.touch-actions'),hud:r('#hud'),overflow:document.documentElement.scrollWidth>innerWidth}}));await page.screenshot({path:out+`/alpine-line-${width}.png`});}
 console.log('LAYOUTS',JSON.stringify(layouts));for(const r of layouts){assert.equal(r.overflow,false);assert.ok(r.board.x>=-1&&r.board.right<=r.w+1&&r.board.bottom<=r.h+1);if(r.w<900&&r.w>r.h){assert.ok(r.joy.right<r.board.x);assert.ok(r.actions.x>r.board.right);}if(r.w<r.h){assert.ok(r.joy.y>r.board.bottom);assert.ok(r.actions.y>r.board.bottom);}}
 const touch=await browser.newPage({viewport:{width:667,height:375},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push(e.message));touch.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await touch.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error('Test fullscreen refusal'))});await touch.goto(base+'/alpine-line/?test=1');assert.equal(await touch.locator('#touch-controls').isVisible(),false);await touch.locator('#instruction-close').tap();await touch.waitForFunction(()=>__alpineTest.state.mode==='playing');assert.equal(await touch.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
 const cdp=await touch.context().newCDPSession(touch),j=await touch.locator('[data-joystick]').boundingBox(),cx=j.x+j.width/2,cy=j.y+j.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx+26,y:cy,id:1}]});await touch.waitForTimeout(200);assert.ok(await touch.evaluate(()=>__alpineTest.state.x)>480);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-27,y:cy,id:1}]});await touch.waitForTimeout(160);assert.ok(await touch.evaluate(()=>__alpineTest.input().touchInput)<0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy,id:1}]});await touch.waitForFunction(()=>document.querySelector('[data-joystick]').dataset.joystickDirection==='idle');assert.equal(await touch.evaluate(()=>__alpineTest.input().touchInput),0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await touch.locator('[data-joystick]').getAttribute('data-joystick-vector'),'0.000,0.000');
 assert.equal(await touch.evaluate(()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('[data-joystick]').dispatchEvent(e);return e.defaultPrevented}),true);
 const bb=await touch.locator('#brake').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+40,y:bb.y+28,id:3}]});await touch.waitForTimeout(250);assert.ok(await touch.evaluate(()=>__alpineTest.state.reserve)<1);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await touch.evaluate(()=>__alpineTest.input().touchBrake),false);
 await touch.locator('#touch-sound').tap();assert.equal(await touch.evaluate(()=>__alpineTest.state.muted),true);await touch.locator('#touch-pause').tap();assert.equal(await touch.evaluate(()=>__alpineTest.state.mode),'paused');await touch.locator('#touch-pause').tap();await touch.locator('.vibecade-mobile-restart').tap();assert.equal(await touch.evaluate(()=>__alpineTest.state.level),1);assert.equal(await touch.evaluate(()=>__alpineTest.state.score),0);
 await touch.locator('.vibecade-mobile-options').tap();await touch.locator('.vibecade-control-toggle').click();await touch.locator('.vibecade-options-close').click();const rb=await touch.locator('.vibecade-direction-pad [data-direction="right"]').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rb.x+22,y:rb.y+22,id:2}]});await touch.waitForTimeout(170);assert.ok(await touch.evaluate(()=>__alpineTest.state.x)>480);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await touch.evaluate(()=>__alpineTest.input().touchInput),0);
 await touch.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await touch.evaluate(()=>__alpineTest.state.mode),'paused');await touch.locator('.vibecade-mobile-restart').tap();await touch.reload();await touch.locator('.vibecade-mobile-play').waitFor({state:'visible'});assert.equal(await touch.evaluate(()=>__alpineTest.state.mode),'help');await touch.locator('.vibecade-mobile-play').tap();await touch.waitForFunction(()=>__alpineTest.state.mode==='playing');assert.equal(await touch.locator('.virtual-joystick').getAttribute('data-control-style'),'buttons');
 await touch.screenshot({path:out+'/alpine-line-touch.png'});const mobileFrames=await frames(touch);console.log('MOBILE FRAMES',JSON.stringify(mobileFrames));await touch.close();
 assert.deepEqual(errors,[]);console.log('GAME ERRORS',JSON.stringify(errors));await page.goto(base+'/');assert.equal(await page.locator('section[data-status="work"] a[href="alpine-line/"]').count(),1);await page.locator('a[href="alpine-line/"]').click();assert.equal(await page.title(),'Alpine Line | VibeCade');
 const rootResources=errors.filter(e=>e==='Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED'||e==='Failed to load resource: the server responded with a status of 404 (File not found)');assert.deepEqual(errors.filter(e=>!rootResources.includes(e)),[]);console.log('ROOT RESOURCES',JSON.stringify(rootResources));
 await browser.close();fs.writeFileSync(out+'/verification.json',JSON.stringify({curve,developing,recovery,mechanics,capture,layouts,desktopFrames,mobileFrames,rootResources},null,2));console.log('PASS');
}
async function frames(page){return page.evaluate(()=>new Promise(resolve=>{const a=[];let prev=0;function f(n){if(prev)a.push(n-prev);prev=n;if(a.length<120)requestAnimationFrame(f);else{a.sort((x,y)=>x-y);resolve({mean:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2)})}}requestAnimationFrame(f)}));}
run().catch(async e=>{console.error(e);await globalThis.activeBrowser?.close();process.exitCode=1});
