// NODE_PATH=<Playwright packages> node velvet-coil/verify.cjs
const { chromium } = require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.SHOT_DIR||path.join(require('node:os').tmpdir(),'velvet-coil-heist-qa');
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',{'.js':'text/javascript','.css':'text/css','.html':'text/html'}[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
// This controller reads visible board/security state. It replans one move at a time.
// It never moves actors, manufactures gems, grants lives, or suppresses security.
function playVault({level, mistakes=0, stopAt=Infinity, greed=false,ignoreSecurity=false,seed}) {
  if(seed!==undefined)coilTest.seed(seed);coilTest.jump(level);
  let moves=0,injected=0,sheds=0,doors=0,beamWarnings=0,lastStage='',lastSide=false;
  while(coilTest.state().phase==='playing'&&moves++<2000){
    let s=coilTest.state();
    if(s.gems>=stopAt)break;
    if(mistakes>injected&&s.gems>=injected+1){coilTest.crash('Deliberate recovery test');injected++;s=coilTest.state();}
    if(s.recovery){coilTest.step(s.recovery);s=coilTest.state();}
    if(s.beam?.stage==='warning'&&lastStage!=='warning')beamWarnings++;
    lastStage=s.beam?.stage;
    const side=s.snake[0].x>11;if(side!==lastSide){doors++;lastSide=side;}
    const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
    const danger=p=>!ignoreSecurity&&s.grace<=0&&s.beam&&(s.beam.stage==='active'||(s.beam.stage==='warning'&&s.beam.left/(1+s.alarm*.35)<.65))&&(s.beam.axis==='row'?p.y===s.beam.line:p.x===s.beam.line);
    const closed=p=>!ignoreSecurity&&s.vaults[level-1].gates&&p.x===11&&((p.y===3||p.y===4)?s.openGate!==0&&!s.gateHeld[0]:(p.y===9||p.y===10)?s.openGate!==1&&!s.gateHeld[1]:false);
    const occupied=new Set([...s.pillars,...s.snake.slice(0,s.grow>0?s.snake.length:-1)].map(p=>p.x+','+p.y));
    const safe=p=>p.x>=0&&p.x<24&&p.y>=0&&p.y<14&&!occupied.has(p.x+','+p.y)&&!closed(p)&&!danger(p);
    const goal=s.unlocked&&(!greed||s.bonus>=1||!s.gem)?s.exitCell:s.gem;
    let q=[{p:s.snake[0],route:[]}],seen=new Set(),route;
    for(let i=0;i<q.length;i++){
      const {p,route:r}=q[i];if(p.x===goal.x&&p.y===goal.y){route=r;break;}
      for(let d=0;d<4;d++){
        if(!r.length&&d===(s.dir+2)%4)continue;
        const a={x:p.x+dirs[d][0],y:p.y+dirs[d][1]},k=a.x+','+a.y;
        if(!safe(a)||seen.has(k))continue;seen.add(k);q.push({p:a,route:[...r,d]});
      }
    }
    let d=route?.[0];
    if(d===undefined){
      // Wait for a shutter/beam by circulating through the largest open area.
      let best=-1;
      for(let k=0;k<4;k++){
        if(k===(s.dir+2)%4)continue;const a={x:s.snake[0].x+dirs[k][0],y:s.snake[0].y+dirs[k][1]};if(!safe(a))continue;
        const queue=[a],visited=new Set([a.x+','+a.y]);
        for(let j=0;j<queue.length;j++)for(const v of dirs){const p={x:queue[j].x+v[0],y:queue[j].y+v[1]},key=p.x+','+p.y;if(safe(p)&&!visited.has(key)){visited.add(key);queue.push(p);}}
        const rank=visited.size+(k===s.dir?.1:0);if(rank>best){best=rank;d=k;}
      }
    }
    if(d===undefined&&s.snake.length>6&&s.shedCooldown<=0){coilTest.shed();sheds++;continue;}
    if(d!==undefined)coilTest.turn(d);
    coilTest.step(s.vaults[level-1].interval);
  }
  const s=coilTest.state();coilTest.draw();
  return {level,gems:s.gems,bonus:s.bonus,lives:s.lives,seconds:+s.elapsed.toFixed(2),moves,sheds,chamberCrossings:doors,beamWarnings,won:s.phase==='result'&&s.unlocked&&s.lives>0&&s.time>0,phase:s.phase,profile:s.vaults[level-1]};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const report={curve:[],layouts:[],errors:[]};fs.mkdirSync(out,{recursive:true});
 const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});};
 try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();watch(page);
 await page.goto(base+'/velvet-coil/?test&manual&seed=42');const state=()=>page.evaluate(()=>coilTest.state());
 await page.waitForTimeout(150);assert.equal((await state()).elapsed,0);assert.equal((await state()).time,50);
 await page.keyboard.press('Tab');assert(await page.locator('#instruction-close').evaluate(e=>e===document.activeElement));await page.keyboard.press('Space');
 await page.evaluate(()=>coilTest.step(1.8));await page.keyboard.press('ArrowUp');await page.evaluate(()=>coilTest.step(.19));assert.equal((await state()).dir,0);
 await page.keyboard.press('ArrowDown');assert.equal((await state()).queue.length,0);
 await page.keyboard.down('Space');await page.evaluate(()=>coilTest.step(.2));assert((await state()).charge<4);await page.keyboard.up('Space');assert(!(await state()).slow);
 await page.locator('#help-button').click();const time=(await state()).time;await page.evaluate(()=>coilTest.step(10));assert.equal((await state()).time,time);await page.locator('#instruction-close').click();
 await page.locator('#pause').click();assert.equal((await state()).phase,'paused');await page.keyboard.press('r');assert.equal((await state()).score,0);await page.keyboard.press('m');assert.equal(await page.locator('#sound').innerText(),'Sound off');
 for(let level=1;level<=5;level++){const r=await page.evaluate(playVault,{level,mistakes:level===4?2:0});report.curve.push(r);console.log('Vault',JSON.stringify(r));await page.screenshot({path:path.join(out,`heist-vault-${level}-result.png`)});}
 assert(report.curve.every(r=>r.won),JSON.stringify(report.curve));assert(report.curve[3].lives>=1);assert(report.curve[2].beamWarnings>0);assert(report.curve[3].chamberCrossings>=4);
 await page.locator('#restart').click();assert.equal((await state()).level,1);
 report.greed=await page.evaluate(playVault,{level:3,greed:true});assert(report.greed.won&&report.greed.bonus===1);
 report.securityComparison=[];for(const level of [3,4,5]){const aware=await page.evaluate(playVault,{level,seed:410+level});const blind=await page.evaluate(playVault,{level,seed:410+level,ignoreSecurity:true});report.securityComparison.push({level,aware,blind});}assert(report.securityComparison.every(r=>r.aware.won));assert(report.securityComparison.slice(1).every(r=>!r.blind.won));
 // A quota opens the exit without ending play; bonus theft costs time and raises pressure.
 await page.evaluate(()=>{coilTest.jump(1);coilTest.setGems(2);coilTest.setSnake([{x:5,y:7},{x:4,y:7},{x:3,y:7}],1);coilTest.setGem({x:6,y:7});coilTest.step(.19);});
 assert((await state()).unlocked);assert.equal((await state()).phase,'playing');const unlocked=await state();
 await page.evaluate(()=>{coilTest.setGem({x:7,y:7});coilTest.step(.19);});assert.equal((await state()).bonus,1);assert((await state()).time<unlocked.time-4);assert((await state()).score>=unlocked.score+500);
 await page.evaluate(()=>{coilTest.setSnake([{x:21,y:7},{x:20,y:7},{x:19,y:7}],1);coilTest.step(.19);});assert.equal((await state()).phase,'result');await page.locator('#next').click();assert.equal((await state()).level,2);
 // Shed works via keyboard, keeps quota progress, pays score, and cannot be spammed.
 await page.evaluate(()=>{coilTest.jump(3);coilTest.setGems(2);coilTest.setScore(1000);coilTest.setSnake(Array.from({length:12},(_,i)=>({x:18-i,y:12})),1);});await page.keyboard.press('x');let sh=await state();assert.equal(sh.snake.length,6);assert.equal(sh.score,850);assert.equal(sh.gems,2);assert(sh.grace>0&&sh.shedCooldown===6);await page.keyboard.press('x');assert.equal((await state()).score,850);
 // Warning is safe; live beams affect only the head; a crash preserves collection.
 await page.evaluate(()=>{coilTest.jump(3);coilTest.setGems(2);coilTest.setSnake([{x:5,y:7},{x:4,y:7},{x:3,y:7}],1);coilTest.setBeam({axis:'row',line:7,stage:'warning',left:2});coilTest.step(.18);});assert.equal((await state()).lives,4);
 await page.evaluate(()=>{coilTest.setBeam({axis:'row',line:7,stage:'active',left:.8});coilTest.step(.02);});assert.equal((await state()).lives,3);assert.equal((await state()).gems,2);
 assert((await state()).detection);assert.match(await page.locator('#callout').innerText(),/Head detected/);
 // A live strip touching only the inert jewelry must not cost a life or trim the tail.
 await page.evaluate(()=>{coilTest.jump(3);coilTest.setSnake([{x:8,y:6},{x:8,y:7},{x:7,y:7},{x:6,y:7},{x:5,y:7},{x:4,y:7}],0);coilTest.setBeam({axis:'row',line:7,stage:'active',left:.8});coilTest.step(.02);coilTest.draw();});assert.equal((await state()).lives,4);assert.equal((await state()).snake.length,6);assert.equal((await state()).detection,null);
 await page.screenshot({path:path.join(out,'scanner-jewelry-safe.png')});
 await page.evaluate(()=>{coilTest.setBeam({axis:'row',line:6,stage:'warning',left:2});coilTest.step(.001);coilTest.draw();});await page.screenshot({path:path.join(out,'scanner-head-target.png')});
 // Shutters never close on the head or tail occupying a passage, but close after clearance.
 await page.evaluate(()=>{coilTest.jump(4);coilTest.setSnake([{x:12,y:3},{x:11,y:3},{x:10,y:3},{x:9,y:3}],1);coilTest.setGate(7.49);coilTest.step(.02);});assert.equal((await state()).openGate,1);assert((await state()).gateHeld[0]);
 await page.evaluate(()=>{coilTest.setSnake([{x:15,y:3},{x:14,y:3},{x:13,y:3}],1);coilTest.step(.02);});assert(!(await state()).gateHeld[0]);
 await page.evaluate(()=>{coilTest.setSnake([{x:10,y:3},{x:9,y:3},{x:8,y:3}],1);coilTest.step(.17);});assert.equal((await state()).lives,3);
 await page.evaluate(()=>{coilTest.jump(1);coilTest.step(2);coilTest.setTime(.01);coilTest.step(.02);});assert.equal((await state()).phase,'result');await page.locator('#restart').click();
 await page.evaluate(()=>{coilTest.crash();coilTest.crash();coilTest.crash();coilTest.crash();});assert.equal((await state()).lives,0);await page.locator('#restart').click();assert.equal((await state()).level,1);
 // Natural mid-heist screenshot, with live mechanics and no arranged actors.
 await page.evaluate(playVault,{level:3,stopAt:2});await page.screenshot({path:path.join(out,'velvet-coil-beams.png')});await page.screenshot({path:path.join(out,'velvet-coil-scanner.png')});await page.evaluate(playVault,{level:4,stopAt:3});await page.screenshot({path:path.join(out,'velvet-coil-heist.png')});
 for(const [width,height] of [[667,375],[740,390],[844,390],[390,844]]){
  const mc=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await mc.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Deliberate refusal'));});const mp=await mc.newPage();watch(mp);await mp.goto(base+'/velvet-coil/?test&manual');
  await mp.locator('#instruction-close').click();await mp.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');
  if(width<600){assert(await mp.locator('#portrait-note').isVisible());await mp.evaluate(()=>coilTest.step(5));assert.equal(await mp.evaluate(()=>coilTest.state().time),50);await mp.screenshot({path:path.join(out,`heist-${width}x${height}.png`)});await mc.close();continue;}
  const joy=mp.locator('[data-joystick]'),b=await joy.boundingBox(),cx=b.x+b.width/2,cy=b.y+b.height/2;await mp.mouse.move(cx,cy);await mp.mouse.down();await mp.mouse.move(cx,cy-35);assert.equal(await joy.getAttribute('data-joystick-direction'),'up');await mp.evaluate(()=>{coilTest.step(1.8);coilTest.step(.19);});assert.equal(await mp.evaluate(()=>coilTest.state().dir),0);await mp.mouse.move(cx-35,cy);assert.equal(await joy.getAttribute('data-joystick-direction'),'left');await mp.mouse.move(cx,cy);assert.equal(await joy.getAttribute('data-joystick-direction'),'idle');await mp.mouse.up();
  const sb=await mp.locator('#slow').boundingBox();await mp.mouse.move(sb.x+10,sb.y+10);await mp.mouse.down();assert(await mp.evaluate(()=>coilTest.state().slow));await mp.mouse.up();assert(!(await mp.evaluate(()=>coilTest.state().slow)));
  await mp.evaluate(()=>{coilTest.setSnake(Array.from({length:12},(_,i)=>({x:18-i,y:12})),1);coilTest.setScore(1000);coilTest.draw();coilTest.step(.01);});await mp.locator('#shed').tap();assert.equal(await mp.evaluate(()=>coilTest.state().snake.length),6);
  await mp.locator('#touch-pause').tap();assert.equal(await mp.evaluate(()=>coilTest.state().phase),'paused');await mp.locator('#touch-pause').tap();await mp.locator('#touch-sound').tap();assert.equal(await mp.locator('#touch-sound').innerText(),'SOUND OFF');await mp.locator('.vibecade-mobile-restart').tap();assert.equal(await mp.evaluate(()=>coilTest.state().gems),0);
  await mp.locator('.vibecade-mobile-options').tap();await mp.locator('.vibecade-control-toggle').tap();await mp.locator('.vibecade-options-close').tap();await mp.locator('[data-direction="up"]').tap();await mp.evaluate(()=>{coilTest.step(1.8);coilTest.step(.19);});assert.equal(await mp.evaluate(()=>coilTest.state().dir),0);assert.equal(await mp.evaluate(()=>localStorage.getItem('vibecade-mobile-controls')),'buttons');
  const cb=await mp.locator('canvas').boundingBox();await mp.mouse.move(cb.x+cb.width/2,cb.y+cb.height/2);await mp.mouse.down();await mp.mouse.move(cb.x+cb.width/2-35,cb.y+cb.height/2);await mp.mouse.up();await mp.evaluate(()=>coilTest.step(.19));assert.equal(await mp.evaluate(()=>coilTest.state().dir),3);
  assert(await joy.evaluate(e=>!e.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))));await mp.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await mp.evaluate(()=>coilTest.state().phase),'paused');await mp.locator('#touch-pause').tap();
  const layout=await mp.evaluate(()=>{const f=document.querySelector('#game-shell').getBoundingClientRect(),j=document.querySelector('[data-joystick]').getBoundingClientRect(),a=document.querySelector('.control-cluster').getBoundingClientRect(),buttons=[...document.querySelectorAll('.control-button')].map(e=>e.getBoundingClientRect());return{width:innerWidth,height:innerHeight,overlap:j.right>f.left||a.left<f.right,overflow:document.documentElement.scrollWidth>innerWidth,minAction:Math.min(...buttons.map(b=>b.height)),actionsBottom:a.bottom,hudBottom:document.querySelector('.hud').getBoundingClientRect().bottom,securityTop:document.querySelector('#security-note').getBoundingClientRect().top};});assert(!layout.overlap&&!layout.overflow);assert(layout.minAction>=44&&layout.actionsBottom<height);assert(layout.hudBottom<=layout.securityTop);report.layouts.push(layout);
  await mp.evaluate(playVault,{level:3,stopAt:2});await mp.screenshot({path:path.join(out,`heist-${width}x${height}.png`)});await mp.reload();await mp.locator('.vibecade-mobile-play').click();await mp.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');await mc.close();
 }
 await page.goto(base+'/velvet-coil/?test&vault=3');assert.equal((await state()).level,3);assert(!(await page.locator('#instruction-modal').isVisible()));await page.evaluate(()=>coilTest.jump(5));
 report.frames=await page.evaluate(()=>new Promise(resolve=>{const a=[];let last=performance.now();function f(t){a.push(t-last);last=t;if(a.length<90)requestAnimationFrame(f);else{a.shift();a.sort((x,y)=>x-y);resolve({mean:a.reduce((x,y)=>x+y,0)/a.length,p95:a[Math.floor(a.length*.95)]});}}requestAnimationFrame(f);}));
 assert.equal(report.errors.length,0,JSON.stringify(report.errors));fs.writeFileSync(path.join(out,'heist-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
