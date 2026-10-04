const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'}),rows=[],errors=[];try{
 for(const [id,powers,cleared] of [[4,['lens'],[]],[10,['lens','fold','bomb'],[0]],[16,['lens','fold','bomb','jump'],[0,1]],[22,['lens','fold','bomb','jump','phase'],[0,1,2]],[28,['lens','fold','bomb','jump','phase','heat'],[0,1,2,3]]]){
  const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(s=>localStorage.setItem('hollow-signal-v1',JSON.stringify(s)),{v:2,powers,cleared,collected:id>=10?['tank-2','tank-9']:['tank-2'],checkpoint:{room:id,x:140},seenOpening:true});
  await p.goto('http://127.0.0.1:4173/hollow-signal/?test');await p.addScriptTag({path:path.join(__dirname,'pilot.js')});await p.evaluate(()=>{__hollow.manual(true);__hollow.start();});const row=await p.evaluate(()=>runHollowRoute());rows.push(row);console.log(JSON.stringify(row));await p.close();
 }fs.writeFileSync(path.join(__dirname,'approach-check.json'),JSON.stringify({rows,errors},null,2));assert.equal(rows.length,5);assert(rows.every(r=>r.crossed&&r.cleared&&r.deaths===0));assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
