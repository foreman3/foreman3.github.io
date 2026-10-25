/* Node rule checks plus real Chrome controls, all 50 flow demonstrations,
   responsive geometry and save/restore. Known witnesses prove feasibility,
   not human puzzle difficulty or enjoyment. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('./rules.js'),S=require('./save.js');
const out=process.env.STEAM_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/puzzle-campaign';
const base=process.env.STEAM_BASE_URL||'http://127.0.0.1:8771';
function ruleChecks(){
  const checks=[],check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
  check(R.contracts.length===50,'fifty contracts');
  check(new Set(R.contracts.map(c=>JSON.stringify([c.route,c.blocks,c.fixed,c.marks]))).size===50,'fifty distinct boards');
  for(const c of R.contracts){const t=R.trace(c,R.buildSolution(c));check(t.ok,'witness '+c.level);check(t.unique.length>=c.minimum&&t.done.length===c.goals.length,'all goals '+c.level);check(t.unused===0,'clean witness '+c.level);}
  const c21=R.contracts[20],t21=R.trace(c21,R.buildSolution(c21));check(t21.bridgeAxes[c21.bridge]===3&&t21.steps.filter(s=>s.k===c21.bridge).length===2,'bridge crosses once per independent axis');
  const clone=n=>JSON.parse(JSON.stringify(R.contracts[n-1]));
  let c=clone(11),b=R.buildSolution(c),v=Object.keys(c.fixed).find(k=>c.fixed[k].valve!==undefined);b[v].valveEntry=(b[v].valveEntry+2)%4;check(/tail/.test(R.trace(c,b).message),'reverse arrow rejected');
  c=clone(16);b=R.buildSolution(c);c.budget.I=0;check(/stock/.test(R.trace(c,b).message),'fitting budget enforced');
  c=clone(21);b=R.buildSolution(c);b[c.bridge]={kind:'I',r:1,fixed:true};check(!R.trace(c,b).ok,'ordinary pipe cannot replace both bridge lanes');
  c=clone(26);b=R.buildSolution(c);b[c.ports.a].entry=(b[c.ports.a].entry+2)%4;check(/tunnel A/.test(R.trace(c,b).message),'tunnel entrance direction enforced');
  c=clone(31);b=R.buildSolution(c);const sw=Object.keys(c.marks).find(k=>c.marks[k].type==='switch');delete c.marks[sw];check(/Gate G is shut/.test(R.trace(c,b).message),'gate requires earlier switch');
  c=clone(36);b=R.buildSolution(c);c.capacity=1;check(/cold/.test(R.trace(c,b).message),'receiver needs heat');
  c=clone(41);b=R.buildSolution(c);c.capacity=1;check(/Radiator R needs/.test(R.trace(c,b).message),'radiator consumes heat');
  c=clone(46);b=R.buildSolution(c);const rings=Object.keys(c.marks).filter(k=>c.marks[k].type==='ring');for(const k of rings)c.marks[k].number=4-c.marks[k].number;check(/in order/.test(R.trace(c,b).message),'ordered deliveries enforced');
  c=clone(1);b=R.buildSolution(c);c.minimum=48;check(/needs 48/.test(R.trace(c,b).message),'minimum route length enforced');
  const save=S.fresh();save.drafts[1]=S.encode(R.buildSolution(R.contracts[0]));check(S.validate(JSON.parse(JSON.stringify(save))).drafts[1].length===48,'save round trip');save.drafts[1][17]={kind:'I',r:99};check(!S.validate(save).drafts[1],'corrupt draft rejected');check(S.validate({version:999})===null,'unknown version rejected');
  const store=new Map([[S.KEY,'{broken']]);const recovered=S.read({getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)});check(recovered.campaign.current===1&&store.has(S.KEY+'-recovery'),'corrupt save recovery copy');check(!S.write(null,S.fresh()),'storage failure reported');
  return checks;
}
function installPilot(){
  window.build=(level)=>{
    const t=__steamTest;t.start(level);const solution=t.rules.buildSolution(t.rules.contracts[level-1]);
    for(let k=0;k<48;k++){const tile=solution[k];if(!tile||tile.fixed)continue;t.shape(tile.kind);while(t.state.rotation!==tile.r)t.rotate();t.fit(k);}
    t.render();return t.state.plan.ok;
  };
}
async function run(){
  fs.mkdirSync(out,{recursive:true});const report={date:new Date().toISOString(),rules:ruleChecks(),errors:[],levels:[],layouts:[]};
  const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});};
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),p=await context.newPage();watch(p);await p.goto(base+'/steamline/?test=1');await p.waitForFunction(()=>window.__steamTest);await p.evaluate(()=>__steamTest.manual(true));
    assert.ok(await p.locator('#instruction-modal').isVisible());await p.evaluate(()=>__steamTest.step(3600));assert.equal(await p.evaluate(()=>__steamTest.state.mode),'instructions');await p.locator('#instruction-close').focus();await p.keyboard.press('Space');
    await p.evaluate(()=>__steamTest.step(3600));assert.equal(await p.evaluate(()=>__steamTest.state.mode),'plan');assert.equal(await p.locator('#pressure-label').textContent(),'UNHURRIED PLANNING');
    await p.evaluate(installPilot);
    for(let n=1;n<=50;n++){
      const result=await p.evaluate(n=>{if(!build(n))throw Error('Build failed '+n);const t=__steamTest;t.launch();t.step(40);return{n,mode:t.state.mode,goals:t.state.plan.done.length,length:t.state.plan.unique.length,stars:t.campaign.wins[n]?.stars};},n);
      assert.equal(result.mode,'result',JSON.stringify(result));assert.equal(result.stars,3);report.levels.push(result);
    }
    assert.equal(await p.evaluate(()=>__steamTest.campaign.unlocked),50);
    await p.locator('#next').click();assert.ok(await p.locator('#ledger').isVisible());assert.equal(await p.locator('.level-row button').count(),50);assert.equal(await p.locator('.level-row button:disabled').count(),0);await p.locator('#ledger-close').click();assert.ok(await p.locator('#result').isVisible());await p.locator('#result-edit').click();
    await p.evaluate(()=>__steamTest.start(1));const first=await p.evaluate(()=>__steamTest.state.cursor);
    await p.keyboard.press('Digit2');await p.keyboard.press('KeyX');await p.keyboard.press('Space');assert.equal(await p.evaluate(k=>__steamTest.state.board[k].kind,first),'L');
    await p.keyboard.press('KeyZ');assert.equal(await p.evaluate(k=>__steamTest.state.board[k],first),null);await p.keyboard.press('KeyY');assert.equal(await p.evaluate(k=>__steamTest.state.board[k].kind,first),'L');
    await p.locator('#save').click();const saved=await p.evaluate(()=>JSON.stringify(__steamTest.state.board));await p.reload();await p.evaluate(()=>__steamTest.manual(true));assert.equal(await p.evaluate(()=>JSON.stringify(__steamTest.state.board)),saved);
    await p.evaluate(()=>__steamTest.undo());assert.equal(await p.evaluate(k=>__steamTest.state.board[k],first),null);
    await p.evaluate(()=>__steamTest.start(1));await p.locator('.cell').nth(first).click();const before=await p.evaluate(()=>JSON.stringify(__steamTest.state.board));await p.evaluate(()=>{__steamTest.launch();__steamTest.step(40);});assert.equal(await p.evaluate(()=>__steamTest.state.mode),'plan');assert.equal(await p.evaluate(()=>JSON.stringify(__steamTest.state.board)),before);assert.match(await p.locator('#status').textContent(),/Your board is kept/);
    await p.evaluate(()=>__steamTest.reset());await p.keyboard.press('KeyZ');assert.equal(await p.evaluate(()=>JSON.stringify(__steamTest.state.board)),before);
    await p.evaluate(installPilot);await p.evaluate(()=>{build(36);__steamTest.launch();__steamTest.step(2);});await p.locator('#help-button').click();const index=await p.evaluate(()=>__steamTest.state.index);await p.evaluate(()=>__steamTest.step(5));assert.equal(await p.evaluate(()=>__steamTest.state.index),index);await p.locator('#instruction-close').click();assert.equal(await p.evaluate(()=>__steamTest.state.mode),'flow');await p.keyboard.press('KeyP');assert.ok(await p.evaluate(()=>__steamTest.state.paused));await p.keyboard.press('KeyP');await p.locator('#launch').click();
    await p.locator('#levels').click();const downloadEvent=p.waitForEvent('download');await p.locator('#download').click();const download=await downloadEvent;await download.saveAs(out+'/steamline-save.json');const exportData=JSON.parse(fs.readFileSync(out+'/steamline-save.json','utf8'));assert.equal(exportData.unlocked,50);await p.locator('#ledger-close').click();
    // Import is validated, previewed, explicitly confirmed, and reloads the exact board.
    await p.locator('#levels').click();await p.locator('#ledger-help').click();assert.ok(await p.locator('#instruction-modal').isVisible());await p.locator('#instruction-close').click();assert.ok(await p.locator('#ledger').isVisible());await p.locator('#ledger-close').click();assert.equal(await p.evaluate(()=>__steamTest.state.mode),'plan');
    const altered={...exportData,current:6};await p.locator('#levels').click();await p.locator('#import-file').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(altered))});await p.locator('#import-confirm').click();assert.equal(await p.evaluate(()=>__steamTest.state.level),6);assert.ok(await p.evaluate(()=>localStorage.getItem(SteamlineSave.KEY+'-before-import')));
    await p.locator('#levels').click();await p.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});assert.equal(await p.evaluate(()=>__steamTest.state.level),6);await p.locator('#ledger-close').click();
    for(const n of [1,6,11,16,21,26,31,36,41,46,50]){await p.evaluate(n=>__steamTest.start(n),n);await p.screenshot({path:out+'/contract-'+n+'.png'});}
    const geo=await geometry(p);assert.ok(geo.cabinet.bottom<=900,JSON.stringify(geo));assert.ok(!geo.overflow);report.layouts.push({width:1440,height:900,...geo});
    for(const [width,height]of[[667,375],[740,390],[844,390],[390,844]]){
      const mc=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});await mc.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('test refusal'));});
      const m=await mc.newPage();watch(m);await m.goto(base+'/steamline/?test=1');assert.equal(await m.locator('.rack').isVisible(),false);await m.locator('#instruction-close').click();await m.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');await m.evaluate(()=>__steamTest.manual(true));
      const k=await m.evaluate(()=>__steamTest.state.cursor);await m.locator('[data-shape="L"]').tap();await m.locator('#rotate').tap();await m.locator('.cell').nth(k).tap();assert.equal(await m.evaluate(k=>__steamTest.state.board[k].kind,k),'L');await m.locator('#lift').tap();await m.locator('.cell').nth(k).tap();assert.equal(await m.evaluate(k=>__steamTest.state.board[k],k),null);await m.locator('#undo').tap();assert.equal(await m.evaluate(k=>__steamTest.state.board[k].kind,k),'L');
      const cdp=await mc.newCDPSession(m),target=await m.locator('.cell').nth(k+1).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x+target.width/2,y:target.y+target.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await m.evaluate(k=>__steamTest.state.board[k],k+1),null);
      await m.locator('#save').tap();await m.reload();await m.waitForSelector('.vibecade-mobile-ready');await m.locator('.vibecade-mobile-play').tap();await m.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');await m.evaluate(()=>__steamTest.manual(true));assert.equal(await m.evaluate(k=>__steamTest.state.board[k].kind,k),'L');assert.equal(await m.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
      const g=await geometry(m);assert.ok(!g.overflow);assert.ok(g.cabinet.bottom<=height,JSON.stringify(g));assert.ok(Math.abs(g.board.width/g.board.height-4/3)<.03);if(width>height)assert.ok(g.rack.right<g.board.x);else assert.ok(g.rack.y>g.board.bottom);assert.ok(g.cell.width>=35);report.layouts.push({width,height,...g});await m.evaluate(installPilot);await m.evaluate(()=>{build(41);__steamTest.launch();__steamTest.step(3);});await m.screenshot({path:out+'/mobile-'+width+'x'+height+'.png'});await mc.close();
    }
    await p.evaluate(()=>{build(50);__steamTest.launch();__steamTest.step(4.7);__steamTest.persist();});await p.screenshot({path:out+'/steamline-puzzle-gameplay.png'});
    report.performance=await p.evaluate(async()=>{build(41);__steamTest.launch();__steamTest.manual(false);const v=[];let last;await new Promise(resolve=>{const tick=t=>{if(last)v.push(t-last);last=t;if(v.length<150)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});__steamTest.manual(true);v.sort((a,b)=>a-b);return{mean:v.reduce((a,b)=>a+b)/v.length,p95:v[142],max:v.at(-1)};});
    report.normal=await normalOpening(browser,watch);
    assert.deepEqual(report.errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({levels:report.levels.length,ruleChecks:report.rules.length,layouts:report.layouts,performance:report.performance,errors:report.errors},null,2));
  }finally{fs.writeFileSync(out+'/latest.json',JSON.stringify(report,null,2));await browser.close();}
}
async function geometry(p){return p.evaluate(()=>{const rect=q=>{const r=q.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return{board:rect(document.getElementById('board')),rack:rect(document.querySelector('.rack')),cabinet:rect(document.getElementById('cabinet')),cell:rect(document.querySelector('.cell')),overflow:document.documentElement.scrollWidth>innerWidth};});}
async function normalOpening(browser,watch,url=base+'/steamline/'){
  const p=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});watch(p);const response=await p.goto(url);assert.equal(response.status(),200);assert.equal(await p.evaluate(()=>typeof window.__steamTest),'undefined');assert.match(await p.locator('#level').textContent(),/50/);await p.locator('#instruction-close').click();
  let cursor=R.key(R.contracts[0].route[1]),rotation=1;const board=R.buildSolution(R.contracts[0]);
  for(const at of R.contracts[0].route){const k=R.key(at),tile=board[k];if(!tile||tile.fixed)continue;await p.keyboard.press(tile.kind==='I'?'Digit1':'Digit2');while(rotation!==tile.r){await p.keyboard.press('KeyX');rotation=(rotation+1)%4;}while(cursor%8!==k%8){const right=cursor%8<k%8;await p.keyboard.press(right?'ArrowRight':'ArrowLeft');cursor+=right?1:-1;}while(Math.floor(cursor/8)!==Math.floor(k/8)){const down=cursor<k;await p.keyboard.press(down?'ArrowDown':'ArrowUp');cursor+=down?8:-8;}await p.keyboard.press('Space');}
  await p.waitForTimeout(180);const saved=await p.evaluate(()=>localStorage.getItem('steamline-puzzle-campaign-v2'));assert.ok(saved);const pipes=await p.locator('.cell svg').count();await p.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR',ctrlKey:true,bubbles:true,cancelable:true})));assert.equal(await p.locator('.cell svg').count(),pipes);
  await p.reload();assert.equal(await p.locator('.cell svg').count(),pipes);await p.locator('.cell').nth(cursor).focus();await p.keyboard.press('Enter');await p.waitForSelector('#result.is-visible',{timeout:15000});assert.equal(await p.locator('#result-stars').textContent(),'★★★');const result=await p.locator('#result-detail').textContent();await p.locator('#next').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#level').textContent(),'02 / 50');await p.reload();assert.equal(await p.locator('#level').textContent(),'02 / 50');await p.close();return{url,status:response.status(),keyboardClear:result,autosave:true,reloadProgress:true,refreshShortcutSafe:true};
}
module.exports={ruleChecks,installPilot,normalOpening};
if(require.main===module){if(process.argv.includes('--rules'))console.log(ruleChecks().length+' rule checks passed');else run().catch(e=>{console.error(e);process.exitCode=1;});}
