const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
  const errors=[];
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  await page.goto('http://127.0.0.1:8765/fuse-catch/?test=1');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#instruction-modal').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'intro');
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.time),0);
  await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'intro');
  await page.locator('#instruction-close').click();
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'playing');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  assert.ok(await page.evaluate(()=>window.__fuseTest.state.cartX)>480);
  await page.locator('#help-button').click();
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'help');
  await page.locator('#instruction-close').click();
  await page.locator('#sound').click();
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.muted),true);
  await page.keyboard.press('m');
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.muted),false);
  await page.keyboard.press('p');assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'paused');
  await page.keyboard.press('p');assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'playing');
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.__fuseTest.state.water),2);
  await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.__fuseTest.state.stage),1);
  await page.evaluate(()=>{const t=window.__fuseTest;t.state.bombs.push({x:t.state.cartX,y:400,vx:0,vy:170,type:'normal',phase:0,spin:0})});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.__fuseTest.state.water),1);
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.caught),1);
  await page.evaluate(()=>{const t=window.__fuseTest;t.state.bombs.push({x:40,y:400,vx:0,vy:170,type:'normal',phase:0,spin:0})});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.__fuseTest.state.water),1);
  await page.evaluate(()=>{const t=window.__fuseTest;t.jump(1);t.state.caught=t.profiles[0].quota-1;t.state.bombs.push({x:t.state.cartX,y:515,vx:0,vy:170,type:'normal',phase:0,spin:0});t.tick(1/60)});
  assert.equal(await page.locator('#result-modal').isVisible(),true);
  await page.locator('#next').click();assert.equal(await page.evaluate(()=>window.__fuseTest.state.stage),2);
  await page.evaluate(()=>{const t=window.__fuseTest;t.state.buckets=1;t.state.bombs.push({x:50,y:559,vx:0,vy:170,type:'normal',phase:0,spin:0});t.tick(1/60)});
  assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'over');
  await page.locator('#again').click();assert.equal(await page.evaluate(()=>window.__fuseTest.state.stage),1);
  await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);assert.equal(await page.evaluate(()=>window.__fuseTest.state.mode),'playing');
  const mechanics=await page.evaluate(()=>{const t=window.__fuseTest;t.jump(1);t.spawn();const arc=Math.abs(t.predictLanding(t.state.bombs[0])-t.state.bombs[0].x);t.jump(2);for(let i=0;i<4;i++)t.spawn();const pair=t.state.bombs.length===5;const spaced=Math.abs(t.predictLanding(t.state.bombs[3])-t.predictLanding(t.state.bombs[4]));t.jump(5);for(let i=0;i<60;i++)t.spawn();const types=[...new Set(t.state.bombs.map(b=>b.type))];return {arc,pair,spaced,types}});
  console.log('MECHANICS',JSON.stringify(mechanics));assert.ok(mechanics.arc>50);assert.equal(mechanics.pair,true);assert.ok(mechanics.spaced>120);assert.ok(mechanics.types.includes('quick')&&mechanics.types.includes('zig'));
  const curve=await page.evaluate(()=>{
    const t=window.__fuseTest,out=[];
    for(let n=1;n<=7;n++){
      t.jump(n);let elapsed=0,misses=0,lastBuckets=t.state.buckets;const missed=[];
      const interval= n<=5?.21:n===6?.13:.075;
      let decision=0,target=t.state.cartX;
      while(t.state.mode==='playing'&&elapsed<125){
        const threats=t.state.bombs.map(v=>({v,x:t.predictLanding(v),eta:(515-v.y)/v.vy})).sort((a,b)=>a.eta-b.eta);
        const threat=threats.find(q=>Math.max(0,Math.abs(q.x-t.state.cartX)-t.profiles[n-1].width/2)/(590+Math.max(0,n-4)*35)+.08<q.eta)||threats[0];
        if(threats.some(q=>q.eta<.24&&Math.abs(q.v.x-t.state.cartX)<210&&Math.abs(q.x-t.state.cartX)>t.profiles[n-1].width/2+10)&&t.state.water>0)t.sweep();
        if(decision<=0&&threat){target=threat.x;decision=interval}
        const dx=target-t.state.cartX;
        document.dispatchEvent(new KeyboardEvent('keydown',{key:dx>10?'ArrowRight':'ArrowLeft',bubbles:true}));
        document.dispatchEvent(new KeyboardEvent('keyup',{key:dx>10?'ArrowLeft':'ArrowRight',bubbles:true}));
        if(Math.abs(dx)<=10){document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}))}
        t.tick(1/60);elapsed+=1/60;decision-=1/60;
        if(t.state.buckets<lastBuckets){misses+=lastBuckets-t.state.buckets;lastBuckets=t.state.buckets;if(n>=5)missed.push({time:+elapsed.toFixed(1),cart:Math.round(t.state.cartX),target:Math.round(target),threats:threats.map(q=>({x:Math.round(q.x),eta:+q.eta.toFixed(2)}))})}
      }
      out.push({level:n,mode:t.state.mode,caught:t.state.caught,quota:t.profiles[n-1].quota,misses,buckets:t.state.buckets,seconds:+elapsed.toFixed(1),missed});
    }
    document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));
    return out;
  });
  console.log('CURVE',JSON.stringify(curve));
  for(const item of curve.slice(0,5))assert.equal(item.mode,'clear',`level ${item.level}`);
  assert.equal(await page.locator('#result-title').textContent(),'SEVEN SHIFTS SAFE!');
  await page.locator('#again').click();assert.equal(await page.evaluate(()=>window.__fuseTest.state.stage),1);
  const follower=await page.evaluate(()=>{const t=window.__fuseTest,out=[];for(const n of [1,2,3,5,6,7]){t.jump(n);let elapsed=0;while(t.state.mode==='playing'&&elapsed<110){const dx=t.state.bomberX-t.state.cartX;document.dispatchEvent(new KeyboardEvent('keydown',{key:dx>9?'ArrowRight':'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:dx>9?'ArrowLeft':'ArrowRight',bubbles:true}));if(Math.abs(dx)<=9){document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}))}t.tick(1/60);elapsed+=1/60}out.push({level:n,mode:t.state.mode,caught:t.state.caught,buckets:t.state.buckets})}document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));return out});
  console.log('FOLLOWER',JSON.stringify(follower));
  const slower=await page.evaluate(()=>{
    const t=window.__fuseTest,out=[];
    for(let n=5;n<=7;n++){
      t.jump(n);let target=480,decision=0,elapsed=0;
      while(t.state.mode==='playing'&&elapsed<125){
        const b=t.state.bombs.reduce((a,v)=>!a||v.y>a.y?v:a,null);
        if(decision<=0&&b){target=b.x;decision=.48}
        const dx=target-t.state.cartX;
        document.dispatchEvent(new KeyboardEvent('keydown',{key:dx>12?'ArrowRight':'ArrowLeft',bubbles:true}));
        document.dispatchEvent(new KeyboardEvent('keyup',{key:dx>12?'ArrowLeft':'ArrowRight',bubbles:true}));
        if(Math.abs(dx)<=12){document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}))}
        t.tick(1/60);elapsed+=1/60;decision-=1/60;
      }
      out.push({level:n,mode:t.state.mode,caught:t.state.caught,buckets:t.state.buckets,seconds:+elapsed.toFixed(1)});
    }
    document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));
    return out;
  });
  console.log('SLOWER',JSON.stringify(slower));
  const recovery=await page.evaluate(()=>{
    const t=window.__fuseTest;t.jump(5);t.state.bombs.push({x:900,y:559,vx:0,vy:270,type:'normal',phase:0,spin:0});t.tick(1/60);
    const lost=t.profiles[4].buckets-t.state.buckets;
    let target=t.state.cartX,decision=0,elapsed=0;
    while(t.state.mode==='playing'&&elapsed<90){
      const threats=t.state.bombs.map(v=>({v,x:t.predictLanding(v),eta:(515-v.y)/v.vy})).sort((a,b)=>a.eta-b.eta);
      const threat=threats.find(q=>Math.max(0,Math.abs(q.x-t.state.cartX)-t.profiles[4].width/2)/625+.08<q.eta)||threats[0];
      if(threats.some(q=>q.eta<.24&&Math.abs(q.v.x-t.state.cartX)<210&&Math.abs(q.x-t.state.cartX)>t.profiles[4].width/2+10)&&t.state.water>0)t.sweep();
      if(decision<=0&&threat){target=threat.x;decision=.08}
      const dx=target-t.state.cartX;
      document.dispatchEvent(new KeyboardEvent('keydown',{key:dx>9?'ArrowRight':'ArrowLeft',bubbles:true}));
      document.dispatchEvent(new KeyboardEvent('keyup',{key:dx>9?'ArrowLeft':'ArrowRight',bubbles:true}));
      if(Math.abs(dx)<=9){document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}))}
      t.tick(1/60);elapsed+=1/60;decision-=1/60;
    }
    return {lost,mode:t.state.mode,caught:t.state.caught,buckets:t.state.buckets};
  });
  console.log('RECOVERY',JSON.stringify(recovery));
  assert.equal(recovery.lost,1);assert.equal(recovery.mode,'clear');
  await page.evaluate(()=>{
    const t=window.__fuseTest;t.jump(5);let target=480,decision=0;
    for(let i=0;i<750&&t.state.mode==='playing';i++){
      const b=t.state.bombs.reduce((a,v)=>!a||(515-v.y)/v.vy<(515-a.y)/a.vy?v:a,null);
      if(decision<=0&&b){target=t.predictLanding(b);decision=.13}
      const dx=target-t.state.cartX;
      document.dispatchEvent(new KeyboardEvent('keydown',{key:dx>9?'ArrowRight':'ArrowLeft',bubbles:true}));
      document.dispatchEvent(new KeyboardEvent('keyup',{key:dx>9?'ArrowLeft':'ArrowRight',bubbles:true}));
      if(Math.abs(dx)<=9){document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}))}
      t.tick(1/60);decision-=1/60;
    }
    document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));
  });
  const screenshot='C:/Users/forem/.codex/visualizations/2026/09/24/01a0d201-bdee-7d62-b88c-ecc3808a13c9/fuse-catch-routing-gameplay.png';
  await page.screenshot({path:screenshot});
  const frameTiming=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let previous=0;const step=now=>{if(previous)samples.push(now-previous);previous=now;if(samples.length<120)requestAnimationFrame(step);else{samples.sort((a,b)=>a-b);resolve({mean:+(samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(2),p95:+samples[Math.floor(samples.length*.95)].toFixed(2)})}};requestAnimationFrame(step)}));
  console.log('FRAMES',JSON.stringify(frameTiming));
  const layouts=[];
  for(const [width,height] of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(250);
    layouts.push(await page.evaluate(()=>{const board=document.querySelector('#board').getBoundingClientRect(),joy=document.querySelector('[data-joystick]').getBoundingClientRect(),actions=document.querySelector('.touch-actions').getBoundingClientRect();return {size:`${innerWidth}x${innerHeight}`,board:{x:board.x,y:board.y,width:board.width,height:board.height,bottom:board.bottom,right:board.right},joystick:{x:joy.x,width:joy.width,right:joy.right},actions:{x:actions.x,width:actions.width},overflow:document.documentElement.scrollWidth>innerWidth}}));
  }
  console.log('LAYOUTS',JSON.stringify(layouts));
  for(const layout of layouts){const [w,h]=layout.size.split('x').map(Number);assert.ok(layout.board.bottom<=h+2,`board bottom at ${layout.size}`);assert.ok(layout.board.right<=w+2,`board right at ${layout.size}`);assert.equal(layout.overflow,false);if(w<900&&w>h){assert.ok(layout.joystick.right<layout.board.x);assert.ok(layout.actions.x>layout.board.right)}}
  const touch=await browser.newPage({viewport:{width:667,height:375},hasTouch:true,isMobile:true});
  touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto('http://127.0.0.1:8765/fuse-catch/?test=1');
  await touch.locator('#instruction-close').click();
  await touch.waitForFunction(()=>window.__fuseTest.state.mode==='playing',{timeout:5000});
  await touch.waitForTimeout(150);
  const before=await touch.evaluate(()=>window.__fuseTest.state.cartX);
  const joyBox=await touch.locator('[data-joystick]').boundingBox();
  await touch.dispatchEvent('[data-joystick]','pointerdown',{pointerId:7,pointerType:'touch',clientX:joyBox.x+joyBox.width*.8,clientY:joyBox.y+joyBox.height/2});
  await touch.waitForTimeout(300);
  const moved=await touch.evaluate(()=>window.__fuseTest.state.cartX);
  await touch.dispatchEvent('[data-joystick]','pointerup',{pointerId:7,pointerType:'touch',clientX:joyBox.x+joyBox.width*.8,clientY:joyBox.y+joyBox.height/2});
  assert.ok(moved>before,`touch joystick ${before} -> ${moved}`);
  await touch.evaluate(()=>{const t=window.__fuseTest;t.state.bombs.push({x:t.state.cartX,y:400,vx:0,vy:170,type:'normal',phase:0,spin:0})});
  await touch.locator('#touch-water').click();assert.equal(await touch.evaluate(()=>window.__fuseTest.state.caught),1);
  await touch.locator('#touch-sound').click();assert.equal(await touch.evaluate(()=>window.__fuseTest.state.muted),true);
  await touch.evaluate(()=>{localStorage.setItem('vibecade-mobile-controls','buttons');window.dispatchEvent(new StorageEvent('storage',{key:'vibecade-mobile-controls',newValue:'buttons'}))});
  const leftButton=touch.locator('.vibecade-direction-pad [data-direction="left"]');await leftButton.waitFor({state:'visible'});
  const buttonStart=await touch.evaluate(()=>window.__fuseTest.state.cartX);
  await touch.dispatchEvent('.vibecade-direction-pad [data-direction="left"]','pointerdown',{pointerId:8,pointerType:'touch'});await touch.waitForTimeout(260);
  await touch.dispatchEvent('.vibecade-direction-pad [data-direction="left"]','pointerup',{pointerId:8,pointerType:'touch'});
  assert.ok(await touch.evaluate(()=>window.__fuseTest.state.cartX)<buttonStart);
  await touch.locator('.vibecade-mobile-restart').click();assert.equal(await touch.evaluate(()=>window.__fuseTest.state.stage),1);
  const mobileScreenshot='C:/Users/forem/.codex/visualizations/2026/09/24/01a0d201-bdee-7d62-b88c-ecc3808a13c9/fuse-catch-routing-mobile.png';
  await touch.screenshot({path:mobileScreenshot});
  await touch.close();
  assert.deepEqual(errors,[]);
  await page.goto('http://127.0.0.1:8765/');
  assert.equal(await page.locator('a[href="fuse-catch/"]').count(),1);
  console.log('PASS',screenshot);
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
