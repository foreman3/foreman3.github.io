// Agent Yoda — RR-20261124T1316Z-YODA. Preserve unrelated work and offline paths.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process'),root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),hash=f=>fs.existsSync(path.join(root,f))?crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'):null;
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'unrelated-before.json'),'utf8')),changed=Object.entries(before).filter(([f,h])=>hash(f)!==h).map(([f])=>f);
const parse=s=>JSON.parse(s.slice(s.indexOf('{'),s.lastIndexOf('}')+1));
const old=parse(fs.readFileSync(path.join(__dirname,'offline-before.txt'),'utf8')),now=parse(read('offline-assets.js')),removed=old.assets.filter(f=>!now.assets.includes(f)),added=now.assets.filter(f=>!old.assets.includes(f));
const report={agent:'Agent Yoda',run:'RR-20261124T1316Z-YODA',time:new Date().toISOString(),unrelatedFiles:Object.keys(before).length,changedUnrelated:changed,oldVersion:old.version,newVersion:now.version,games:now.games,paths:now.assets.length,removed,added,build:cp.execSync('node scripts/build-offline.cjs --check',{cwd:root,encoding:'utf8'}).trim()};
fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.deepEqual(removed,[],'Existing offline paths preserved');assert.deepEqual(changed,[],'Unrelated files preserved');
