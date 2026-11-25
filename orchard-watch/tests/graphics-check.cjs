// Agent Yoda — OW-20261123T0114Z-YODA. No production hooks added.
const fs=require('fs'),path=require('path'),http=require('http'),cp=require('child_process'),assert=require('assert/strict'),vm=require('vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=path.resolve(__dirname,'../screenshots');
const original=f=>cp.execFileSync('git',['show','a7d61ec:orchard-watch/'+f],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
const baseline=original('game.js'),current=fs.readFileSync(path.join(root,'orchard-watch/game.js'),'utf8').replace(/\r\n/g,'\n');
const fixture=()=>{orchardTest.jump(4);orchardTest.clear();for(const i of [0,3,5,8,10])orchardTest.setActor(i,i===5,.45);orchardTest.draw();};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const frozen=async(size,js=current,css)=>{const c=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:size[0]<1000,isMobile:size[0]<1000}),p=await c.newPage();await p.addInitScript(()=>{const raf=requestAnimationFrame;requestAnimationFrame=f=>f.name==='frame'?1:raf(f);});await p.route('**/orchard-watch/game.js*',r=>r.fulfill({contentType:'text/javascript',body:js}));if(css)await p.route('**/orchard-watch/style.css*',r=>r.fulfill({contentType:'text/css',body:css}));await p.goto(base+'/orchard-watch/?test&seed=42');return{c,p};};
 if(process.argv.includes('before')){for(const size of [[1440,900],[667,375],[390,844]]){const {c,p}=await frozen(size,baseline,original('style.css'));await p.locator('#instruction-close').click();await p.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});await p.evaluate(fixture);await p.screenshot({path:path.join(shots,`before-${size.join('x')}.jpg`),quality:94});await c.close();}return;}
 new vm.Script(current);
 const strip=s=>s.replace(/function drawScene\(\)[\s\S]*?(?=function resizeField\()/,'<STATIC ART>') .replace(/(?:\/\/ Cached painted portraits[\s\S]*?)?function drawActor\([\s\S]*?(?=function draw\(\))/,'<ACTOR ART>');
 assert.equal(strip(current),strip(baseline),'Simulation, inputs, audio, resize geometry, draw effects, hooks unchanged');
 assert.equal(fs.readFileSync(path.join(root,'orchard-watch/index.html'),'utf8').replace(/\r\n/g,'\n'),original('index.html'));
 const report={agent:'Agent Yoda',run:'OW-20261123T0114Z-YODA',baseline:'a7d61ec',sourceParity:true,scenarios:[],viewports:[]};
 const twins=await Promise.all([baseline,current].map(js=>frozen([1440,900],js))),pages=twins.map(t=>t.p);
 const both=async f=>{for(const p of pages)await f(p);},compare=async name=>{assert.deepEqual(await pages[0].evaluate(()=>orchardTest.state()),await pages[1].evaluate(()=>orchardTest.state()),name);report.scenarios.push(name);};
 await both(p=>p.evaluate(()=>orchardTest.step(10)));await compare('Instruction gating');assert.equal(await pages[0].evaluate(()=>orchardTest.state().elapsed),0);
 await both(p=>p.locator('#instruction-close').click());
 for(const [i,k] of [...'qwerasdfzxcv'].entries()){await both(p=>p.evaluate(i=>{orchardTest.jump(1);orchardTest.clear();orchardTest.setActor(i);},i));await both(p=>p.keyboard.press(k));await compare('Keyboard '+k);}
 await both(p=>p.locator('#help-button').click());await both(p=>p.evaluate(()=>orchardTest.step(10)));await compare('Help pause');await both(p=>p.locator('#instruction-close').click());
 await both(p=>p.keyboard.press('Escape'));await both(p=>p.evaluate(()=>orchardTest.step(10)));await compare('Explicit pause');await both(p=>p.keyboard.press('Escape'));
 for(let n=1;n<=5;n++){await both(p=>p.evaluate(n=>{orchardTest.jump(n);for(let j=0;j<250;j++){orchardTest.step(.02);if(j%8===0)orchardTest.state().actors.forEach((a,i)=>{if(a&&!a.friend)orchardTest.thump(i);});}},n));await compare('Harvest '+n+' seeded spawn/scoring');}
 for(const [label,fn] of [
 ['Gardener penalty',()=>{orchardTest.jump(3);orchardTest.clear();orchardTest.setActor(4,true);orchardTest.thump(4);}],
 ['Escaped marmot',()=>{orchardTest.jump(4);orchardTest.clear();orchardTest.setActor(2,false,1.34);orchardTest.step(.04);}],
 ['Empty hit recovery',()=>{orchardTest.jump(2);orchardTest.clear();orchardTest.thump(0);orchardTest.setActor(0);orchardTest.step(.1);orchardTest.thump(0);}],
 ['Timeout',()=>{orchardTest.jump(5);orchardTest.setTime(.01);orchardTest.step(.02);}],
 ['Final victory',()=>{orchardTest.jump(5);for(let i=0;i<45;i++){orchardTest.clear();orchardTest.setActor(0);orchardTest.thump(0);orchardTest.step(.1);}}]
 ]){await both(p=>p.evaluate(fn));await compare(label);}
 await both(p=>p.locator('#restart').click());await compare('Victory restart');await both(p=>p.keyboard.press('m'));await both(p=>p.keyboard.press('m'));await compare('Sound toggles');await both(p=>p.keyboard.press('Backspace'));await compare('Backspace reset');for(const t of twins)await t.c.close();
 for(const [width,height] of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){const {c,p}=await frozen([width,height]),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.screenshot({path:path.join(shots,`instructions-${width}x${height}.jpg`),quality:94});await p.locator('#instruction-close').click();await p.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});await p.evaluate(fixture);await p.screenshot({path:path.join(shots,`after-${width}x${height}.jpg`),quality:94});
  const geometry=await p.evaluate(()=>{const f=document.querySelector('#field').getBoundingClientRect(),bs=[...document.querySelectorAll('.hole')].map(e=>e.getBoundingClientRect());return{field:{x:f.x,y:f.y,width:f.width,height:f.height,bottom:f.bottom},minTarget:Math.min(...bs.map(b=>Math.min(b.width,b.height))),overflow:document.documentElement.scrollWidth>innerWidth,onscreen:bs.every(b=>b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1)};});assert(geometry.onscreen&&!geometry.overflow);assert(geometry.minTarget>=44);
  if(width===1440||width===844)for(const n of [2,5]){await p.evaluate(n=>{orchardTest.jump(n);orchardTest.clear();[0,3,4,7,9].forEach(i=>orchardTest.setActor(i,i===4,.3));orchardTest.draw();},n);await p.screenshot({path:path.join(shots,`harvest-${n}-${width}x${height}.jpg`),quality:94});}
  assert.deepEqual(errors,[]);report.viewports.push({width,height,geometry,errors});await c.close();
 }
 fs.writeFileSync(path.join(__dirname,'graphics-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
