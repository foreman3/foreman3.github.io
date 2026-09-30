const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out='C:/Users/forem/.codex/visualizations/2026/09/30/01a0f1be-c3f1-7c33-b90a-5dccfafc0acb';
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
 globalThis.activeBrowser=browser;
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await page.goto('http://127.0.0.1:8765/clockwork-blast/?test=1');await page.waitForTimeout(300);
 assert.equal(await page.locator('#instruction-modal').isVisible(),true);assert.equal(await page.evaluate(()=>__clockTest.state.time),0);
 await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__clockTest.state.mode),'intro');
 await page.locator('#instruction-close').click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>__clockTest.state.player.x)>1);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__clockTest.state.bombs.length),1);
 await page.locator('#help-button').click();const frozen=await page.evaluate(()=>__clockTest.state.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__clockTest.state.time),frozen);
 await page.locator('#instruction-close').click();await page.keyboard.press('p');assert.equal(await page.evaluate(()=>__clockTest.state.mode),'paused');await page.keyboard.press('p');await page.keyboard.press('m');assert.equal(await page.evaluate(()=>__clockTest.state.muted),true);
 await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__clockTest.state.room),1);await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);
 await page.evaluate(()=>{
  __clockTest.manual(true);
  window.playRoom=(n,delay=.15,forced=0,maxTime=150,smart=false)=>{
   const t=__clockTest;t.begin(n);const s=t.state,D=[[0,-1],[1,0],[0,1],[-1,0]];s.score=0;let elapsed=0,think=0,goal=null,placed=0;
   for(let i=0;i<forced;i++){s.player.inv=0;t.damage()}s.player.inv=2.5;
   function code(x,y){return `${x},${y}`}
   function hazards(){const h=new Set();for(const b of s.bombs)for(const[x,y]of t.footprint(b))h.add(code(x,y));for(const f of s.fire)h.add(code(f.x,f.y));return h}
   function route(tx,ty,h,allowStart=true){const p=s.player,queue=[[p.x,p.y,[]]],seen=new Set([code(p.x,p.y)]);while(queue.length){const[x,y,path]=queue.shift();if(tx===null?!h.has(code(x,y))&&path.length>0:x===tx&&y===ty)return path;for(const[dx,dy]of D){const a=x+dx,b=y+dy,k=code(a,b);if(seen.has(k)||s.grid[b]?.[a]!==0||s.bombs.some(v=>v.x===a&&v.y===b)||(!allowStart&&h.has(k))||s.enemies.some(v=>v.x===a&&v.y===b&&v.stun<=0)&&s.player.inv<=0)continue;seen.add(k);queue.push([a,b,[...path,[dx,dy]]])}}return null}
   while(s.mode==='playing'&&elapsed<maxTime){if(think<=0){think=delay;const p=s.player,h=hazards();let move=null;
     if(s.enemies.length===0)move=route(11,7,h,false);
     else if(smart&&s.bombs.length&&goal&&!h.has(code(goal.x,goal.y))&&!s.enemies.some(e=>Math.abs(e.x-goal.x)+Math.abs(e.y-goal.y)<2))move=route(goal.x,goal.y,h,h.has(code(p.x,p.y)));
     else if(h.has(code(p.x,p.y))){move=route(null,null,h,true);if(smart){const opts=[];for(let y=1;y<8;y++)for(let x=1;x<12;x++){if(h.has(code(x,y)))continue;const path=route(x,y,h,true);if(!path||path.length*.15+delay>=Math.min(...s.bombs.map(b=>b.fuse))-.1)continue;const dist=Math.min(...s.enemies.map(e=>Math.abs(e.x-x)+Math.abs(e.y-y)));opts.push({path,v:dist-path.length*.8})}opts.sort((a,b)=>b.v-a.v);move=opts[0]?.path||move}}
     else if(s.bombs.length){t.setInput(0,0);goal=null;if(smart&&s.enemies.some(e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y)<4&&e.stun<=0)){const options=[];for(let y=1;y<8;y++)for(let x=1;x<12;x++){if(h.has(code(x,y)))continue;const path=route(x,y,h,false);if(!path)continue;const dist=Math.min(...s.enemies.map(e=>Math.abs(e.x-x)+Math.abs(e.y-y)));options.push({path,v:dist-path.length*.45})}options.sort((a,b)=>b.v-a.v);move=options[0]?.path}}
     else {
       const fake={x:p.x,y:p.y,range:s.cfg.range},area=t.footprint(fake),targets=s.enemies.filter(e=>area.some(([x,y])=>x===e.x&&y===e.y));
       const candidates=[];for(let y=1;y<8;y++)for(let x=1;x<12;x++){if(s.grid[y][x]!==0)continue;const path=route(x,y,h,false);if(!path)continue;const cells=t.footprint({x,y,range:s.cfg.range});const hits=s.enemies.filter(e=>cells.some(([a,b])=>a===e.x&&b===e.y)).length;const crates=cells.filter(([a,b])=>s.grid[b][a]===2).length;const distance=Math.min(...s.enemies.map(e=>Math.abs(e.x-x)+Math.abs(e.y-y)));candidates.push({x,y,path,value:hits*20+crates*2-path.length*.75-distance*.2})}candidates.sort((a,b)=>b.value-a.value);const best=candidates[0];
       if(targets.length||best&&best.x===p.x&&best.y===p.y){const danger=new Set(area.map(([x,y])=>code(x,y)));let escape=route(null,null,danger,true);if(smart){const opts=[];for(let y=1;y<8;y++)for(let x=1;x<12;x++){if(danger.has(code(x,y)))continue;const path=route(x,y,danger,true);if(!path||path.length*.15+delay>=s.cfg.fuse-.2)continue;const dist=Math.min(...s.enemies.map(e=>Math.abs(e.x-x)+Math.abs(e.y-y)));opts.push({path,v:dist-path.length*.8})}opts.sort((a,b)=>b.v-a.v);escape=opts[0]?.path}if(escape&&escape.length*.15+delay<s.cfg.fuse-.2){t.plant();placed++;move=escape;goal={x:p.x+escape.reduce((a,v)=>a+v[0],0),y:p.y+escape.reduce((a,v)=>a+v[1],0)}}else if(best)move=best.path}
       else if(best)move=best.path;
     }
     if(move&&move.length)t.setInput(...move[0]);else t.setInput(0,0);
     if(s.player.inv<=0&&s.shields&&s.enemies.some(e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y)<=1))t.shield();
    }t.tick(1/60);elapsed+=1/60;think-=1/60;
   }t.setInput(0,0);t.draw();return{room:n,delay,mode:s.mode,remaining:s.enemies.length,hearts:s.hearts,shields:s.shields,seconds:+elapsed.toFixed(1),charges:placed,score:s.score,hits:s.hits};
  };
 });
 const curve=await page.evaluate(()=>Array.from({length:7},(_,i)=>playRoom(i+1)));console.log('CURVE',JSON.stringify(curve));
 const slower=await page.evaluate(()=>Array.from({length:7},(_,i)=>playRoom(i+1,.35)));console.log('SLOWER',JSON.stringify(slower));
 const recovery=await page.evaluate(()=>playRoom(5,.35,2,150,true));console.log('RECOVERY',JSON.stringify(recovery));
 const mastery=await page.evaluate(()=>[6,7].map(n=>playRoom(n,.15,0,150,true)));console.log('MASTERY',JSON.stringify(mastery));
 for(const r of slower.slice(0,5))assert.equal(r.mode,'clear',`room ${r.room} clear`);assert.equal(slower[5].mode,'over');assert.equal(slower[6].mode,'over');assert.equal(recovery.mode,'clear');assert.ok(recovery.hearts>=1);for(const r of mastery)assert.equal(r.mode,'clear');
 const mechanics=await page.evaluate(()=>{
  const t=__clockTest,s=t.state;t.begin(2);t.setInput(0,0);s.bombs=[{x:3,y:1,fuse:.01,range:3,dx:0,dy:0},{x:5,y:1,fuse:2,range:3,dx:0,dy:0}];s.player.x=1;s.player.y=3;t.tick(1/60);const chain=s.bombs.length===0&&s.fire.some(f=>f.x===7&&f.y===1);
  t.begin(3);s.player.x=1;s.player.y=1;s.player.move=0;s.bombs=[{x:2,y:1,fuse:2,range:3,dx:0,dy:0}];t.movement(1,0);const kick=s.player.x===2&&s.bombs[0].x===3&&s.bombs[0].dx===1;
  t.begin(5);s.player.x=1;s.player.y=1;s.player.inv=0;const armored=s.enemies[0];s.fire=[{x:armored.x,y:armored.y,life:.48}];t.tick(1/60);const armor=armored.hp===1&&s.enemies.includes(armored);s.fire=[];armored.hit=0;s.fire=[{x:armored.x,y:armored.y,life:.48}];t.tick(1/60);const second=!s.enemies.includes(armored);
  t.begin(1);s.player.inv=0;t.shield();const before=s.hearts;t.damage();const shield=s.hearts===before&&s.shields===1&&s.player.shield===3;
  t.begin(1);s.grid[2][3]=0;s.grid[3][3]=2;s.player.x=1;s.player.y=1;s.bombs=[{x:3,y:1,fuse:.01,range:3,dx:0,dy:0}];t.tick(1/60);const crate=s.grid[3][3]===0&&s.score>0&&!s.fire.some(f=>f.x===3&&f.y===4);
  t.begin(1);s.enemies=[];s.player.x=11;s.player.y=7;t.tick(1/60);const clear=s.mode==='clear';
  return{chain,kick,armor,second,shield,crate,clear};
 });console.log('MECHANICS',JSON.stringify(mechanics));for(const[k,v]of Object.entries(mechanics))assert.equal(v,true,k);
 await page.locator('#next').click();assert.equal(await page.evaluate(()=>__clockTest.state.room),2);
 await page.evaluate(()=>{const t=__clockTest;t.begin(7);t.state.enemies=[];t.state.player.x=11;t.state.player.y=7;t.tick(1/60)});assert.equal(await page.locator('#result-title').textContent(),'Perfectly wound!');await page.locator('#again').click();assert.equal(await page.evaluate(()=>__clockTest.state.score),0);
 await page.evaluate(()=>{const t=__clockTest;t.state.time=t.state.cfg.limit;t.tick(1/60)});assert.equal(await page.evaluate(()=>__clockTest.state.mode),'over');await page.locator('#again').click();assert.equal(await page.evaluate(()=>__clockTest.state.mode),'playing');
 // Review keyboard alternatives and ensure restarting from paused help resumes a fresh run.
 await page.keyboard.press('d');assert.equal(await page.evaluate(()=>__clockTest.state.player.x),2);await page.keyboard.press('x');assert.equal(await page.evaluate(()=>__clockTest.state.shields),1);await page.keyboard.press('p');await page.locator('#help-button').click();await page.keyboard.press('r');await page.locator('#instruction-close').click();assert.equal(await page.evaluate(()=>__clockTest.state.mode),'playing');
 const capture=await page.evaluate(()=>playRoom(5,.35,0,12));console.log('CAPTURE',JSON.stringify(capture));await page.locator('canvas').evaluate(e=>e.blur());await page.screenshot({path:out+'/clockwork-blast-gameplay.png'});
 await page.evaluate(()=>__clockTest.manual(false));const desktopFrames=await page.evaluate(()=>new Promise(resolve=>{const a=[];let prev=0;function sample(n){if(prev)a.push(n-prev);prev=n;if(a.length<120)requestAnimationFrame(sample);else{a.sort((x,y)=>x-y);resolve({mean:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2)})}}requestAnimationFrame(sample)}));await page.evaluate(()=>__clockTest.manual(true));console.log('DESKTOP FRAMES',JSON.stringify(desktopFrames));
 const layouts=[];
 for(const[width,height]of[[1440,900],[667,375],[740,390],[844,390],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(120);layouts.push(await page.evaluate(()=>{const r=id=>{const b=document.querySelector(id).getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};return{w:innerWidth,h:innerHeight,board:r('#board'),joy:r('[data-joystick]'),actions:r('.touch-actions'),overflow:document.documentElement.scrollWidth>innerWidth}}));await page.screenshot({path:out+`/clockwork-blast-${width}.png`})}
 console.log('LAYOUTS',JSON.stringify(layouts));for(const r of layouts){assert.equal(r.overflow,false);assert.ok(r.board.right<=r.w+1&&r.board.bottom<=r.h+1);if(r.w<900&&r.w>r.h){assert.ok(r.joy.right<r.board.x);assert.ok(r.actions.x>r.board.right)}if(r.w<r.h){assert.ok(r.joy.y>r.board.bottom);assert.ok(r.actions.y>r.board.bottom)}}
 const touch=await browser.newPage({viewport:{width:667,height:375},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push(e.message));touch.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
 await touch.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error('Test fullscreen refusal'))});
 await touch.goto('http://127.0.0.1:8765/clockwork-blast/?test=1');assert.equal(await touch.locator('#touch-controls').isVisible(),false);await touch.locator('#instruction-close').tap();await touch.waitForFunction(()=>__clockTest.state.mode==='playing');assert.equal(await touch.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
 const cdp=await touch.context().newCDPSession(touch),j=await touch.locator('[data-joystick]').boundingBox(),cx=j.x+j.width/2,cy=j.y+j.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx+26,y:cy,id:1}]});await touch.waitForTimeout(240);assert.ok(await touch.evaluate(()=>__clockTest.state.player.x)>1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy+27,id:1}]});assert.equal(await touch.locator('[data-joystick]').getAttribute('data-joystick-direction'),'down');await touch.waitForTimeout(180);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy,id:1}]});await touch.waitForFunction(()=>document.querySelector('[data-joystick]').dataset.joystickDirection==='idle');const stationary=await touch.evaluate(()=>[__clockTest.state.player.x,__clockTest.state.player.y]);await touch.waitForTimeout(180);assert.deepEqual(await touch.evaluate(()=>[__clockTest.state.player.x,__clockTest.state.player.y]),stationary);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await touch.locator('[data-joystick]').getAttribute('data-joystick-vector'),'0.000,0.000');
 assert.equal(await touch.evaluate(()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('[data-joystick]').dispatchEvent(e);return e.defaultPrevented}),true);
 await touch.locator('#charge').tap();assert.equal(await touch.evaluate(()=>__clockTest.state.bombs.length),1);await touch.locator('#shield').tap();assert.equal(await touch.evaluate(()=>__clockTest.state.shields),1);await touch.locator('#touch-sound').tap();assert.equal(await touch.evaluate(()=>__clockTest.state.muted),true);
 await touch.locator('.vibecade-mobile-restart').tap();assert.equal(await touch.evaluate(()=>__clockTest.state.room),1);assert.equal(await touch.evaluate(()=>__clockTest.state.bombs.length),0);
 await touch.locator('.vibecade-mobile-options').tap();await touch.locator('.vibecade-control-toggle').click();await touch.locator('.vibecade-options-close').click();
 const right=touch.locator('.vibecade-direction-pad [data-direction="right"]'),rb=await right.boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rb.x+22,y:rb.y+22,id:2}]});await touch.waitForTimeout(210);assert.ok(await touch.evaluate(()=>__clockTest.state.player.x)>1);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await touch.locator('[data-joystick]').getAttribute('data-joystick-vector'),'0.000,0.000');
 await touch.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await touch.evaluate(()=>__clockTest.state.mode),'paused');await touch.locator('.vibecade-mobile-restart').tap();
 await touch.reload();await touch.locator('.vibecade-mobile-play').waitFor({state:'visible'});assert.equal(await touch.evaluate(()=>__clockTest.state.mode),'help');await touch.locator('.vibecade-mobile-play').tap();await touch.waitForFunction(()=>__clockTest.state.mode==='playing');assert.equal(await touch.locator('.virtual-joystick').getAttribute('data-control-style'),'buttons');
 await touch.screenshot({path:out+'/clockwork-blast-touch.png'});
 const frames=await touch.evaluate(()=>new Promise(resolve=>{let prev=0;const a=[];function f(n){if(prev)a.push(n-prev);prev=n;if(a.length<120)requestAnimationFrame(f);else{a.sort((x,y)=>x-y);resolve({mean:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2)})}}requestAnimationFrame(f)}));console.log('MOBILE FRAMES',JSON.stringify(frames));await touch.close();
 assert.deepEqual(errors,[]);console.log('ERRORS',JSON.stringify(errors));
 await page.goto('http://127.0.0.1:8765/');assert.equal(await page.locator('section[data-status="work"] a[href="clockwork-blast/"]').count(),1);await page.locator('a[href="clockwork-blast/"]').click();assert.equal(await page.title(),'Clockwork Blast | VibeCade');const rootResources=errors.filter(e=>e==='Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED'||e==='Failed to load resource: the server responded with a status of 404 (File not found)');assert.deepEqual(errors.filter(e=>!rootResources.includes(e)),[]);console.log('ROOT RESOURCES',JSON.stringify(rootResources));
 await browser.close();fs.writeFileSync(out+'/verification.json',JSON.stringify({curve,slower,recovery,mastery,mechanics,capture,layouts,desktopFrames,frames,errors},null,2));console.log('PASS');
}
run().catch(async e=>{console.error(e);await globalThis.activeBrowser?.close();process.exitCode=1});
