/* Compare startup, settled shared caching, and isolated game performance. */
const {chromium}=require('playwright'),{installPilot,measureFrames}=require('./verify.cjs'),fs=require('node:fs');
(async()=>{
 const report=[];
 for(const mobile of [false,true])for(const isolated of [false,true]){
  if(process.env.STEAM_CONTROL==='1'&&(mobile||!isolated))continue;
  const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const c=await b.newContext({viewport:mobile?{width:667,height:375}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,serviceWorkers:isolated?'block':'allow'}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await c.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('refusal'));});
  await p.goto('http://127.0.0.1:8771/steamline/?test=1');await p.locator('#instruction-close').click();
  if(mobile)await p.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');
  await p.evaluate(()=>__steamTest.manual(true));await p.evaluate(installPilot);
  const startup=await measureFrames(p);let settled=null,cacheReady=false;
  if(!isolated){cacheReady=await p.evaluate(()=>Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise(r=>setTimeout(()=>r(false),15000))]));settled=await measureFrames(p);}
  let frozen=null,blank=null;if(!mobile&&isolated){await p.evaluate(()=>__steamTest.manual(true));frozen=await idleFrames(p);await p.goto('about:blank');blank=await idleFrames(p);}
  report.push({mobile,isolated,startup,settled,cacheReady,frozen,blank,errors});await b.close();
 }
 fs.writeFileSync('C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/'+(process.env.STEAM_CONTROL==='1'?'profile-control.json':'profile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
async function idleFrames(p){return p.evaluate(async()=>{const v=[],tasks=[];let last,n=0;const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())tasks.push(e.duration);});observer.observe({type:'longtask',buffered:false});await new Promise(resolve=>{const frame=t=>{if(last&&n++>10)v.push(t-last);last=t;if(v.length<150)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});observer.disconnect();v.sort((a,b)=>a-b);return{mean:v.reduce((a,b)=>a+b)/v.length,p95:v[142],max:v.at(-1),tasks};});}
