// Agent Yoda — run original assertions; relocate only its two screenshot outputs.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../verify.cjs'),'utf8'),dir=path.join(__dirname,'existing-regression');fs.mkdirSync(dir,{recursive:true});
let adapted=source.replace(/const screenshot='[^']+';/,"const screenshot="+JSON.stringify(path.join(dir,'desktop.png'))+';').replace(/const mobileScreenshot='[^']+';/,"const mobileScreenshot="+JSON.stringify(path.join(dir,'mobile.png'))+';');
assert.equal((adapted.match(/assert\./g)||[]).length,(source.match(/assert\./g)||[]).length);
fs.writeFileSync(path.join(dir,'verify.cjs'),adapted);const r=spawnSync(process.execPath,[path.join(dir,'verify.cjs')],{encoding:'utf8',env:process.env});fs.writeFileSync(path.join(dir,'output.txt'),r.stdout+r.stderr);process.stdout.write(r.stdout+r.stderr);process.exitCode=r.status??1;
