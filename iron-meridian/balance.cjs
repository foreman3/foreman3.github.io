// Arena-started input-driven guardian checks. No health changes during fights.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),p=await browser.newPage(),rows=[],errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.goto('http://127.0.0.1:4173/iron-meridian/?test');await p.addScriptTag({path:path.join(__dirname,'boss-pilot.js')});
 for(const [stage,dodge,cores] of [[0,false,false],[0,true,false],[1,true,true],[2,true,true],[3,true,true],[4,true,true],[4,true,false]]){
  await p.evaluate(stage=>{__iron.manual(true);__iron.grant(4);__iron.start(stage);__iron.warp(__iron.world().arena+105);__iron.step(2,false);__iron.setBoss({seed:17});},stage);
  const row=await p.evaluate(options=>runIronBoss(options),{dodge,cores});rows.push(row);console.log(JSON.stringify(row));
 }
 fs.writeFileSync(path.join(__dirname,'balance.json'),JSON.stringify({rows,errors},null,2));assert(rows.slice(1,6).every(r=>r.result==='clear'));assert.equal(rows[0].result,'lost attempt');assert.equal(rows[6].result,'lost attempt');assert(rows[6].bossHP>200);assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
