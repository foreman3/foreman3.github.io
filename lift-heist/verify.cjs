const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const screenshot='C:/Users/forem/.codex/visualizations/2026/09/29/01a0ebc0-bfc3-7332-af64-7f522a3654b6/lift-heist-gameplay.png';

async function run(){
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
  const errors=[],page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  await page.goto('http://127.0.0.1:8765/lift-heist/?test=1');
  await page.waitForTimeout(280);
  assert.equal(await page.locator('#instruction-modal').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'intro');
  assert.equal(await page.evaluate(()=>window.__liftTest.state.time),0);
  await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'intro');
  await page.locator('#instruction-close').click();assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'playing');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>window.__liftTest.state.player.x)>108);
  await page.locator('#help-button').click();assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'help');
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'help');
  await page.locator('#instruction-close').click();await page.keyboard.press('p');assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'paused');await page.keyboard.press('p');
  await page.keyboard.press('m');assert.equal(await page.evaluate(()=>window.__liftTest.state.muted),true);await page.keyboard.press('m');
  await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.__liftTest.state.stage),1);
  await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);assert.equal(await page.evaluate(()=>window.__liftTest.state.mode),'playing');
  const curve=await page.evaluate(()=>{
    const t=window.__liftTest,out=[];
    function key(k,on){document.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key:k,bubbles:true}))}
    function route(n,forcedHits=0,stopAt=Infinity,smart=false){t.beginStage(n);if(forcedHits){t.state.player.inv=0;for(let k=0;k<forcedHits;k++){t.state.player.inv=0;t.state.guards.push({x:t.state.player.x,floor:t.state.player.floor,dir:1,speed:0,stun:0,hp:1,armor:false,shot:9});t.tick(1/60);t.state.guards.pop()}}
      let elapsed=0,lastHearts=t.state.hearts,hits=forcedHits;key(' ',true);
      while(t.state.mode==='playing'&&elapsed<130&&elapsed<stopAt){const s=t.state,pl=s.player;const file=s.files.find(f=>!f.taken&&f.floor===pl.floor);let target=file?file.x:(pl.floor===4&&s.files.every(f=>f.taken)?924:Math.abs(pl.x-108)<Math.abs(pl.x-852)?108:852);const dx=target-pl.x;
        const incoming=smart&&s.bullets.some(b=>b.floor===pl.floor&&Math.abs(b.x-pl.x)<65&&Math.sign(pl.x-b.x)===Math.sign(b.vx));const crouch=incoming&&Math.abs(pl.x-108)>28&&Math.abs(pl.x-852)>28;
        key('ArrowRight',!crouch&&dx>4);key('ArrowLeft',!crouch&&dx< -4);key('ArrowDown',crouch||!file&&pl.floor<4&&Math.abs(dx)<10);
        t.tick(1/60);elapsed+=1/60;if(s.hearts<lastHearts){hits+=lastHearts-s.hearts;lastHearts=s.hearts}
      }
      for(const k of [' ','ArrowRight','ArrowLeft','ArrowDown'])key(k,false);
      return {level:n,mode:t.state.mode,files:t.state.files.filter(f=>f.taken).length,quota:t.state.files.length,hearts:t.state.hearts,hits,hitLog:t.state.hitLog,seconds:+elapsed.toFixed(1),time:+t.state.time.toFixed(1),x:+t.state.player.x.toFixed(1),floor:t.state.player.floor}
    }
    for(let n=1;n<=7;n++)out.push(route(n));
    window.__route=route;
    return out;
  });
  console.log('CURVE',JSON.stringify(curve));
  for(const row of curve.slice(0,6))assert.equal(row.mode,'clear',`shift ${row.level}`);
  assert.equal(curve[6].mode,'over','ordinary held-fire route should not trivialize shift 7');
  const nextCheck=await page.evaluate(()=>window.__route(1));assert.equal(nextCheck.mode,'clear');await page.locator('#next').click();assert.equal(await page.evaluate(()=>window.__liftTest.state.stage),2);
  const mastered=await page.evaluate(()=>window.__route(7,0,Infinity,true));console.log('MASTERY',JSON.stringify(mastered));
  assert.equal(mastered.mode,'clear');assert.ok(mastered.hearts>=1);
  await page.locator('#again').click();assert.equal(await page.evaluate(()=>window.__liftTest.state.stage),1);
  const recovery=await page.evaluate(()=>window.__route(5,2));console.log('RECOVERY',JSON.stringify(recovery));
  assert.equal(recovery.mode,'clear');assert.ok(recovery.hearts>=2);
  const capture=await page.evaluate(()=>window.__route(5,0,7.5));console.log('CAPTURE',JSON.stringify(capture));
  await page.screenshot({path:screenshot});
  const frames=await page.evaluate(()=>new Promise(resolve=>{const values=[];let previous=0;const sample=now=>{if(previous)values.push(now-previous);previous=now;if(values.length<120)requestAnimationFrame(sample);else{values.sort((a,b)=>a-b);resolve({mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2),p95:+values[Math.floor(values.length*.95)].toFixed(2)})}};requestAnimationFrame(sample)}));console.log('FRAMES',JSON.stringify(frames));
  const layouts=[];
  for(const [width,height] of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(170);layouts.push(await page.evaluate(()=>{const b=document.querySelector('#board').getBoundingClientRect(),j=document.querySelector('[data-joystick]').getBoundingClientRect(),a=document.querySelector('.touch-actions').getBoundingClientRect();return {size:`${innerWidth}x${innerHeight}`,board:{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width},joyRight:j.right,actionsX:a.x,overflow:document.documentElement.scrollWidth>innerWidth}}))}
  console.log('LAYOUTS',JSON.stringify(layouts));
  for(const v of layouts){const [w,h]=v.size.split('x').map(Number);assert.ok(v.board.right<=w+2&&v.board.bottom<=h+2,`board clips at ${v.size}`);assert.equal(v.overflow,false);if(w<900&&w>h){assert.ok(v.joyRight<v.board.x,`joystick overlaps at ${v.size}`);assert.ok(v.actionsX>v.board.right,`actions overlap at ${v.size}`)}}
  const touch=await browser.newPage({viewport:{width:667,height:375},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto('http://127.0.0.1:8765/lift-heist/?test=1');await touch.locator('#instruction-close').click();await touch.waitForFunction(()=>window.__liftTest.state.mode==='playing');await touch.waitForTimeout(150);
  const initial=await touch.evaluate(()=>window.__liftTest.state.player.x),joy=await touch.locator('[data-joystick]').boundingBox();
  await touch.dispatchEvent('[data-joystick]','pointerdown',{pointerId:7,pointerType:'touch',clientX:joy.x+joy.width*.85,clientY:joy.y+joy.height/2});await touch.waitForTimeout(300);
  const moved=await touch.evaluate(()=>window.__liftTest.state.player.x);await touch.dispatchEvent('[data-joystick]','pointerup',{pointerId:7,pointerType:'touch',clientX:joy.x+joy.width*.85,clientY:joy.y+joy.height/2});assert.ok(moved>initial,`touch movement ${initial}->${moved}`);
  await touch.evaluate(()=>{const t=window.__liftTest;t.state.player.floor=1;t.state.player.x=350;t.state.player.face=1;t.state.guards=[{x:450,floor:1,dir:1,speed:0,stun:0,hp:1,armor:false,shot:8}];t.state.player.fire=0});await touch.locator('#touch-fire').dispatchEvent('pointerdown',{pointerId:8,pointerType:'touch'});await touch.evaluate(()=>window.__liftTest.tick(1/60));await touch.locator('#touch-fire').dispatchEvent('pointerup',{pointerId:8,pointerType:'touch'});assert.ok(await touch.evaluate(()=>window.__liftTest.state.guards[0].stun)>0);
  await touch.evaluate(()=>{localStorage.setItem('vibecade-mobile-controls','buttons');window.dispatchEvent(new StorageEvent('storage',{key:'vibecade-mobile-controls',newValue:'buttons'}))});await touch.locator('.vibecade-direction-pad [data-direction="left"]').waitFor({state:'visible'});const before=await touch.evaluate(()=>window.__liftTest.state.player.x);await touch.dispatchEvent('.vibecade-direction-pad [data-direction="left"]','pointerdown',{pointerId:9,pointerType:'touch'});await touch.waitForTimeout(220);await touch.dispatchEvent('.vibecade-direction-pad [data-direction="left"]','pointerup',{pointerId:9,pointerType:'touch'});assert.ok(await touch.evaluate(()=>window.__liftTest.state.player.x)<before);
  await touch.evaluate(()=>{const t=window.__liftTest;t.state.player.x=450;t.state.player.floor=2;t.state.player.inv=0;t.state.bullets=[{x:455,floor:2,y:290,vx:-200}]});await touch.dispatchEvent('.vibecade-direction-pad [data-direction="down"]','pointerdown',{pointerId:10,pointerType:'touch'});await touch.evaluate(()=>window.__liftTest.tick(1/60));assert.equal(await touch.evaluate(()=>window.__liftTest.state.player.crouch),true);assert.equal(await touch.evaluate(()=>window.__liftTest.state.hearts),5);await touch.dispatchEvent('.vibecade-direction-pad [data-direction="down"]','pointerup',{pointerId:10,pointerType:'touch'});
  await touch.screenshot({path:screenshot.replace('gameplay.png','mobile.png')});
  await touch.locator('.vibecade-mobile-restart').click();assert.equal(await touch.evaluate(()=>window.__liftTest.state.stage),1);await touch.close();
  assert.deepEqual(errors,[]);await page.goto('http://127.0.0.1:8765/');assert.equal(await page.locator('a[href="lift-heist/"]').count(),1);await page.locator('a[href="lift-heist/"]').click();assert.equal(await page.title(),'Lift Heist | VibeCade');assert.ok(errors.every(e=>e==='Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED'||e==='Failed to load resource: the server responded with a status of 404 (File not found)'),JSON.stringify(errors));await browser.close();
  return {curve,mastered,recovery,frames,screenshot};
}
run().then(x=>{console.log('PASS',JSON.stringify(x))}).catch(e=>{console.error(e);process.exitCode=1});
