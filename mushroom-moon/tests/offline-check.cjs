// Agent Yoda — MM-20261124T0112Z-YODA. Inventory and unrelated-work preservation.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(f,'utf8');
const manifest=s=>{const c={self:{}};vm.runInNewContext(s,c);return JSON.parse(JSON.stringify(c.self.VIBECADE_OFFLINE))};
const before=manifest(read(path.join(__dirname,'offline-before.txt'))),after=manifest(read(path.join(root,'offline-assets.js')));assert.deepEqual(after.assets,before.assets);assert.equal(after.games,before.games);
const files=JSON.parse(read(path.join(__dirname,'unrelated-before.json')));for(const f of files){const n=path.join(root,f.path),hash=fs.existsSync(n)?crypto.createHash('sha256').update(fs.readFileSync(n)).digest('hex'):'DELETED';assert.equal(hash,f.hash,f.path)}
assert.equal(cp.execFileSync('git',['diff','--numstat','--','sidebar.html'],{cwd:root,encoding:'utf8'}).trim(),'');
const report={agent:'Agent Yoda',run:'MM-20261124T0112Z-YODA',games:after.games,paths:after.assets.length,before:before.version,after:after.version,added:[],removed:[],sidebarUnchanged:true,unrelatedFilesPreserved:files.length};fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
