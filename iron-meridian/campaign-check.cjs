// Full approaches followed by guardians. No warps, refills or health changes.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),rows=[],errors=[];try{
 for(let stage=0;stage<5;stage++){
  const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/iron-meridian/?test');
  for(const file of ['route-pilot.js','boss-pilot.js'])await p.addScriptTag({path:path.join(__dirname,file)});
  await p.evaluate(stage=>{__iron.manual(true);__iron.grant(stage);__iron.start(stage);},stage);
  const runs=[];for(let attempt=0;attempt<3;attempt++){
   const approach=await p.evaluate(()=>runIronRoute());if(!approach.reachedBoss){runs.push({approach});break;}
   await p.evaluate(()=>__iron.setBoss({seed:17}));const guardian=await p.evaluate(()=>runIronBoss());runs.push({approach,guardian});if(guardian.result==='clear')break;
  }
  const end=await p.evaluate(()=>__iron.snapshot());rows.push({stage:stage+1,cleared:end.mode==='clear',lives:end.lives,runs});await p.close();
 }
 fs.writeFileSync(path.join(__dirname,'campaign-check.json'),JSON.stringify({rows,errors},null,2));console.log(JSON.stringify(rows));assert(rows.every(r=>r.cleared));assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
