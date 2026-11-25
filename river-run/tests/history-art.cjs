// Agent Yoda — RR-20261124T1316Z-YODA. Full-history artwork eligibility audit.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'../..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
const commits=git('log','--all','--format=%H','--','river-run/').trim().split('\n');
const names=['drawBackground','drawBoard','drawSanctuary','drawLog','drawTurtles','drawRoadVehicle','drawBike','drawTrain','drawChallenges','drawPlayer'];
const arts=s=>names.map(n=>{const m=s.match(new RegExp('    function '+n+'\\([^]*?(?=    function )'));assert(m,n);return m[0].split('\n').filter(l=>!/for\(var wr=1|for\(var rr=7|var centers=\[300/.test(l)).join('\n').replace(/mobileProfile\?0:\(([^)]*)\)/g,'$1').replace(/\s/g,'')}).join('\n');
const records=commits.map(sha=>({sha,description:git('show','-s','--format=%ad %s','--date=iso',sha).trim(),normalizedOriginalArt:crypto.createHash('sha256').update(arts(git('show',sha+':river-run/index.html'))).digest('hex')}));
fs.writeFileSync(path.join(__dirname,'history-art.json'),JSON.stringify({agent:'Agent Yoda',run:'RR-20261124T1316Z-YODA',normalization:'Whitespace, mobile-only shadow suppression, and three drawBoard loop lines split into cached tints and drawBoardMotion in 5e8043b. Those three loop lines are excluded from hashes and manually reviewed in retained history-diff.txt. Ten original drawing functions otherwise compared.',records},null,2));
console.log(records.map(r=>r.sha.slice(0,7)+' '+r.normalizedOriginalArt.slice(0,12)).join('\n'));
assert.equal(new Set(records.map(r=>r.normalizedOriginalArt)).size,1,'Original artwork unchanged across complete directory history');
