// Agent Yoda — GW-20261122T0708Z-YODA. Local-only response instrumentation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=path.resolve(__dirname,'../screenshots');fs.mkdirSync(shots,{recursive:true});
const baseline=execFileSync('git',['show','cc2ed77:galactic-wing/index.html'],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(path.join(root,'galactic-wing/index.html'),'utf8').replace(/\r\n/g,'\n');
const script=h=>[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.trim());
new vm.Script(script(current));
const outside=h=>script(h).replace(/    function path\([\s\S]*?(?=    function frame\()/,'<ART>');
assert.equal(outside(current),outside(baseline),'All source outside renderer identical');
assert.equal(current.split('<body>')[1].split('  <script>')[0],baseline.split('<body>')[1].split('  <script>')[0],'DOM/instructions identical');
for(const silhouette of [
 '[[0,-34],[-13,-3],[-11,26],[0,18],[11,26],[13,-3]]',
 '[[-29,-8],[-17,-22],[0,-13],[17,-22],[29,-8],[22,18],[8,11],[0,24],[-8,11],[-22,18]]',
 '[[-25,-5],[-11,-18],[0,-10],[11,-18],[25,-5],[18,16],[6,9],[0,20],[-6,9],[-18,16]]',
 '[[-22,-12],[-9,-15],[0,-6],[9,-15],[22,-12],[16,13],[7,7],[0,18],[-7,7],[-16,13]]'
]){assert(baseline.includes(silhouette));assert(current.includes(silhouette),'Original actor silhouette retained');}
assert.equal((script(current).match(/Math\.random/g)||[]).length,(script(baseline).match(/Math\.random/g)||[]).length,'No extra randomness');
const expose=h=>h.replace('    window.__galacticWing=', '    window.__audit=code=>eval(code);\n    window.__galacticWing=');
const server=http.createServer((req,res)=>{let u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}let f=path.join(root,decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))f=path.join(f,'index.html');if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(b);});});
const report={agent:'Agent Yoda',run:'GW-20261122T0708Z-YODA',baseline:'cc2ed77',sourceParity:true,scenarios:[],viewports:[]};
(async()=>{await new Promise(r=>server.listen(8768,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});const url='http://127.0.0.1:8768/galactic-wing/';
try{
 if(process.argv.includes('smoke')){
  const c=await browser.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8768/');await p.locator('a[href="galactic-wing/"]').click();
  await p.getByText('Launch wing',{exact:true}).click();await p.waitForTimeout(3200);await p.keyboard.down('ArrowRight');await p.keyboard.down('Space');await p.waitForTimeout(800);await p.keyboard.up('ArrowRight');await p.keyboard.up('Space');
  assert.equal(await p.evaluate(()=>typeof window.__audit),'undefined');assert.equal((await p.evaluate(()=>__galacticWing.getState())).state,'playing');
  await p.screenshot({path:path.join(shots,'live-1440x900.jpg'),quality:92});assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'smoke-results.json'),JSON.stringify({agent:'Agent Yoda',arcadeLink:true,uninstrumented:true,keyboard:true,errors},null,2)+'\n');await c.close();return;
 }
 if(process.argv.includes('before')){
  for(const [width,height]of [[1440,900],[667,375]]){const c=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});const p=await c.newPage();await p.goto(url+'?wave=3');await p.getByText('Launch wing',{exact:true}).click();await p.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});await p.waitForTimeout(3400);await p.screenshot({path:path.join(shots,`before-${width}x${height}.jpg`),quality:92});await c.close();}return;
 }
 const pages=[];
 for(const html of [baseline,current]){const c=await browser.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();await p.addInitScript(()=>{let seed=9843,now=0,callbacks=[],timers=[];Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);performance.now=()=>now;requestAnimationFrame=fn=>{callbacks.push(fn);return 1;};setTimeout=(fn,delay)=>{timers.push({fn,at:now+delay});return timers.length;};window.__tick=n=>{for(let i=0;i<n;i++){now+=1000/60;const batch=callbacks;callbacks=[];batch.forEach(f=>f(now));const ready=timers.filter(t=>t.at<=now);timers=timers.filter(t=>t.at>now);ready.forEach(t=>t.fn());}};});await p.route('**/galactic-wing/',r=>r.fulfill({contentType:'text/html',body:expose(html)}));await p.goto(url);pages.push(p);}
 const both=async fn=>{for(const p of pages)await fn(p);};
 const snapshot='JSON.stringify({state,wave,score,high,lives,chain,chainClock,elapsed,diveClock,waveClock,bannerClock,flash,muted,last,acc,joyX,recoveryPhase,recoveryClock,explosion,player,bullets,enemyBullets,particles,enemies,keys:[...keys]})';
 const compare=async label=>{assert.equal(await pages[0].evaluate(s=>__audit(s),snapshot),await pages[1].evaluate(s=>__audit(s),snapshot),label);report.scenarios.push(label);};
 await both(p=>p.evaluate(()=>__tick(120)));await compare('Instructions gate simulation');
 await both(p=>p.getByText('Launch wing',{exact:true}).click());await both(p=>p.evaluate(()=>__tick(190)));await compare('Opening entry and formation');
 for(const key of ['ArrowLeft','ArrowRight','KeyA','KeyD','Space']){await both(p=>p.keyboard.down(key));await both(p=>p.evaluate(()=>__tick(30)));await both(p=>p.keyboard.up(key));await compare('Keyboard '+key);}
 await both(p=>p.getByLabel('Pause and show instructions').click());await both(p=>p.evaluate(()=>__tick(120)));await compare('Help pauses');for(const p of pages)assert.equal(await p.evaluate(()=>__audit('state')),'paused');await both(p=>p.getByText('Return to battle',{exact:true}).click());
 for(const wave of [2,3,4,5,8]){await both(p=>p.evaluate(n=>__galacticWing.setWave(n),wave));await both(p=>p.evaluate(()=>__tick(260)));await compare('Wave '+wave+' entry, dives and shots');}
 await both(p=>p.evaluate(()=>__audit("reset();bannerClock=0;enemies.forEach(e=>e.mode='formation');const e=enemies[0];e.mode='dive';destroyEnemy(e);")));await compare('Diving leader scoring');for(const p of pages)assert.equal(await p.evaluate(()=>__audit('score')),900);
 await both(p=>p.evaluate(()=>__audit('player.invuln=0;hitPlayer()')));await both(p=>p.evaluate(()=>__tick(240)));await compare('Death and relaunch recovery');
 await both(p=>p.keyboard.press('KeyM'));await compare('Sound mute');await both(p=>p.keyboard.press('KeyM'));await compare('Sound resume');
 await both(p=>p.evaluate(()=>__audit('wave=4;score=900;lives=1')));await both(p=>p.keyboard.press('KeyR'));await compare('Full restart');for(const p of pages)assert.deepEqual(await p.evaluate(()=>__audit('[wave,score,lives]')),[1,0,3]);
 await both(p=>p.evaluate(()=>__audit('enemies.length=0;update(1/120)')));await both(p=>p.evaluate(()=>__tick(150)));await compare('Wave-clear progression timer');
 await both(p=>p.evaluate(()=>__audit('lives=1;player.invuln=0;hitPlayer()')));await both(p=>p.evaluate(()=>__tick(80)));await compare('Game over');for(const p of pages)assert.equal(await p.evaluate(()=>__audit('state')),'gameover');for(const p of pages)await p.context().close();
 for(const [width,height]of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){
  const mobile=width<1000,c=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.route('**/galactic-wing/',r=>r.fulfill({contentType:'text/html',body:expose(current)}));await p.goto(url);assert.equal(await p.evaluate(()=>__audit('state')),'instructions');await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>__audit('elapsed')),0);await p.screenshot({path:path.join(shots,`instructions-${width}x${height}.jpg`),quality:90});await p.getByText('Launch wing',{exact:true}).click();await p.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});await p.waitForTimeout(2600);
  if(mobile){const client=await c.newCDPSession(p);const joy=await p.locator('[data-joystick]').boundingBox();const x=joy.x+joy.width/2,y=joy.y+joy.height/2;const touch=async(type,xx=x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:xx,y,id:1}]});await touch('touchStart');await touch('touchMove',x+45);await p.waitForTimeout(180);assert(await p.evaluate(()=>__audit('joyX'))>0);await touch('touchMove',x-45);await p.waitForTimeout(80);assert(await p.evaluate(()=>__audit('joyX'))<0);await touch('touchMove',x);await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>__audit('joyX')),0);await touch('touchEnd');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>__audit('joyX')),0);
   const fire=await p.locator('#fire-button').boundingBox();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fire.x+fire.width/2,y:fire.y+fire.height/2,id:2}]});await p.waitForTimeout(400);assert(await p.locator('#fire-button').evaluate(e=>e.classList.contains('pressed')));await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('#fire-button').evaluate(e=>e.classList.contains('pressed')),false);await p.getByLabel('Restart game',{exact:true}).tap();assert.deepEqual(await p.evaluate(()=>__audit('[wave,score,lives]')),[1,0,3]);
  }else{await p.keyboard.down('ArrowLeft');await p.waitForTimeout(150);await p.keyboard.up('ArrowLeft');assert(await p.evaluate(()=>__audit('player.x'))<480);await p.keyboard.press('KeyM');assert(await p.evaluate(()=>__audit('muted')));await p.keyboard.press('KeyM');await p.getByLabel('Pause and show instructions').click();assert.equal(await p.evaluate(()=>__audit('state')),'paused');await p.getByText('Return to battle',{exact:true}).click();await p.keyboard.press('KeyR');}
  await p.waitForTimeout(3200);await p.screenshot({path:path.join(shots,`after-${width}x${height}.jpg`),quality:92});const geometry=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{canvas:rect(document.querySelector('canvas')),controls:[...document.querySelectorAll('[data-joystick],#fire-button')].map(rect)};});if(mobile){const a=geometry.canvas;for(const b of geometry.controls){assert(b.x+b.w<=a.x+1||b.x>=a.x+a.w-1||b.y+b.h<=a.y+1||b.y>=a.y+a.h-1,'Controls outside playfield');assert(b.x>=0&&b.y>=0&&b.x+b.w<=width+1&&b.y+b.h<=height+1);}}
  if(width===1440||width===844)for(const wave of [3,5,8]){await p.evaluate(n=>__galacticWing.setWave(n),wave);await p.waitForTimeout(3400);await p.screenshot({path:path.join(shots,`wave-${wave}-${width}x${height}.jpg`),quality:92});}
  const frames=await p.evaluate(()=>new Promise(r=>{let last;const values=[];function f(now){if(last)values.push(now-last);last=now;if(values.length===60)r(values.sort((a,b)=>a-b));else requestAnimationFrame(f);}requestAnimationFrame(f);}));assert.deepEqual(errors,[]);report.viewports.push({width,height,geometry,medianFrameMs:frames[30],p95FrameMs:frames[57],audio:await p.evaluate(()=>__audit('audio?.state')),errors});await c.close();
 }
 fs.writeFileSync(path.join(__dirname,'graphics-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
