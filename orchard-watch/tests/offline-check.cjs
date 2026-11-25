// Agent Yoda — OW-20261123T0114Z-YODA.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'before-inventory.json'))),hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
for(const [p,h] of Object.entries(before.unrelated))assert.equal(hash(p),h,'Unrelated working file preserved: '+p);
const sidebar=hash('sidebar.html');
const build=cp.execFileSync(process.execPath,['scripts/build-offline.cjs'],{encoding:'utf8'}),check=cp.execFileSync(process.execPath,['scripts/build-offline.cjs','--check'],{encoding:'utf8'});
const box={self:{}};vm.runInNewContext(fs.readFileSync('offline-assets.js','utf8'),box);const after=box.self.VIBECADE_OFFLINE;
const missing=before.offline.assets.filter(p=>!after.assets.includes(p)),added=after.assets.filter(p=>!before.offline.assets.includes(p));assert.equal(missing.length,0);assert.equal(added.length,0);assert.equal(hash('sidebar.html'),sidebar);
for(const [p,h] of Object.entries(before.unrelated))assert.equal(hash(p),h,'Unrelated working file preserved after build: '+p);
const report={agent:'Agent Yoda',run:'OW-20261123T0114Z-YODA',build:build.trim(),check:check.trim(),beforeVersion:before.offline.version,afterVersion:after.version,games:after.games,assets:after.assets.length,missing,added,sidebarUnchanged:true,unrelatedPathsPreserved:Object.keys(before.unrelated).length};
fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
