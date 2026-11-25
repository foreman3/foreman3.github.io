// Agent Yoda — owner-authorized release of RR-20261124T1316Z-YODA.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),vm=require('vm'),cp=require('child_process');
const {chromium}=require('playwright');
const root=path.resolve(process.env.RIVER_RELEASE_ROOT||path.join(__dirname,'../..'));
const reportPath=path.resolve(process.env.RIVER_RELEASE_REPORT||path.join(__dirname,'release-results.json'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const strip=s=>{s=s.replace(/<style>[\s\S]*?<\/style>/,'<style/>');for(const f of ['drawBackground','drawBoard','drawLog','drawRoadVehicle','drawPlayer'])s=s.replace(new RegExp('    function '+f+'\\([^]*?(?=    function )'),'    ART '+f+'\n');return s;};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico')return res.writeHead(204).end();let f=path.resolve(root,'.'+u.pathname);if(!f.startsWith(root+path.sep)&&f!==root)return res.writeHead(403).end();try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}});
(async()=>{
 const html=read('river-run/index.html');assert.equal(strip(html),strip(read('river-run/tests/baseline.html')));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 const build=cp.execFileSync(process.execPath,['scripts/build-offline.cjs','--check'],{cwd:root,encoding:'utf8'}).trim();
 const data=read('offline-assets.js'),inventory=JSON.parse(data.slice(data.indexOf('{'),data.lastIndexOf('}')+1));
 const report={agent:'Agent Yoda',run:'RR-20261124T1316Z-YODA',time:new Date().toISOString(),sourcePreserved:true,build,offline:{version:inventory.version,games:inventory.games,paths:inventory.assets.length},browsers:[]};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const [width,height]of [[1440,900],[667,375]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto(base+'/');await page.locator('a.card[href="river-run/"]').click();assert.equal(await page.title(),'Neon River Run');
  const canvas=page.locator('canvas');assert.equal(await canvas.getAttribute('data-phase'),'idle');await page.waitForTimeout(200);assert.equal(await canvas.getAttribute('data-phase'),'idle');
  await page.locator('#instruction-close').click();await page.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('canvas').dataset.phase==='playing');
  if(width>1000){await page.keyboard.press('ArrowUp');await page.waitForFunction(()=>document.querySelector('canvas').dataset.row==='11');await page.locator('#help-button').click();const time=await canvas.getAttribute('data-time');await page.waitForTimeout(250);assert.equal(await canvas.getAttribute('data-time'),time);await page.locator('#instruction-close').click();}
  else{await page.locator('[data-move="up"]').tap();await page.waitForFunction(()=>document.querySelector('canvas').dataset.row==='11');await page.locator('.vibecade-mobile-restart').tap();assert.deepEqual(await canvas.evaluate(e=>[+e.dataset.stage,+e.dataset.row,+e.dataset.lives]),[1,12,3]);}
  await page.keyboard.press('m');assert.equal(await page.evaluate(()=>localStorage.getItem('vibecade-river-muted')),'1');await page.keyboard.press('m');await page.keyboard.press('r');assert.deepEqual(await canvas.evaluate(e=>[+e.dataset.stage,+e.dataset.row,+e.dataset.lives]),[1,12,3]);
  const geometry=await page.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom}};return{board:r(document.querySelector('canvas')),hud:r(document.querySelector('.hud')),buttons:[...document.querySelectorAll('[data-move]')].map(r)}});
  assert(geometry.hud.bottom<geometry.board.y);if(width<1000)for(const b of geometry.buttons)assert(b.right<=geometry.board.x||b.y>=geometry.board.bottom);
  assert.deepEqual(errors,[]);report.browsers.push({width,height,keyboard:width>1000,touch:width<1000,gate:true,reset:true,sound:true,geometry,errors});await context.close();
 }}finally{await browser.close();server.close();}
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
