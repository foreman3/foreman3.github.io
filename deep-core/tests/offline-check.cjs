// Agent Yoda — DC-20261123T0710Z-YODA inventory and unrelated-work preservation.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
function manifest(source){const context={self:{}};vm.runInNewContext(source,context);return JSON.parse(JSON.stringify(context.self.VIBECADE_OFFLINE));}
const before=manifest(fs.readFileSync(path.join(__dirname,'offline-before.txt'),'utf8')),after=manifest(fs.readFileSync(path.join(root,'offline-assets.js'),'utf8'));
assert.deepEqual(after.assets,before.assets);assert.equal(after.games,before.games);
const files=JSON.parse(fs.readFileSync(path.join(__dirname,'unrelated-before.json'),'utf8').replace(/^\uFEFF/,''));
for(const f of files){const file=path.join(root,f.path),hash=fs.existsSync(file)?crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase():'DELETED';assert.equal(hash,f.hash,f.path);}
const report={agent:'Agent Yoda',run:'DC-20261123T0710Z-YODA',before:before.version,after:after.version,games:after.games,paths:after.assets.length,added:[],removed:[],unrelatedFilesPreserved:files.length};
fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
