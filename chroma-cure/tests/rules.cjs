const assert=require('node:assert/strict'),E=require('../engine.js'),S=require('./solver.cjs');
const empty=()=>Array.from({length:14},()=>Array(8).fill(null));
let b=empty();for(let x=0;x<4;x++)b[13][x]={c:0,bug:x===1,id:x};assert.equal(E.matches(b).length,4);b[13][3].c=1;assert.equal(E.matches(b).length,0);
b=empty();for(let y=5;y<9;y++)b[y][3]={c:2,bug:true,id:0};assert.equal(E.matches(b).length,4);
b=empty();b[10][2]={c:1,bug:false,id:1};b[10][3]={c:0,bug:false,id:1};b[11][3]={c:2,bug:true,id:0};assert.equal(E.gravity(b),false);b[10][3]=null;assert(E.gravity(b));assert(b[11][2]);assert(b[11][3].bug);
let s=E.create();assert.equal(s.phase,'fall');assert.equal(s.time,0);assert(E.hold(s));assert.equal(E.hold(s),false);assert(s.usedHold);assert(s.hold);E.drop(s);E.settle(s);assert(E.rewind(s));assert.equal(s.piece.y,0);assert.equal(s.doses,0);assert.equal(s.rewinds,2);
s=E.create();s.board=empty();s.piece={a:0,b:1,x:0,y:2,r:1};assert(E.rotate(s));assert(E.fits(s,s.piece));s.piece={a:0,b:1,x:7,y:2,r:1};assert(E.rotate(s));assert(E.fits(s,s.piece));
s=E.create();s.board=empty();s.board[13][0]={c:0,bug:true,id:0};s.board[12][0]={c:0,bug:false,id:8};s.board[11][0]={c:0,bug:false,id:9};s.piece={x:0,y:10,r:3,a:0,b:1};E.drop(s);E.settle(s);assert.equal(s.phase,'won');assert.equal(s.cleared,1);assert(s.score>=260);
const curve=[];for(let level=1;level<=7;level++){const r=S.run(level,19,110);assert.equal(r.phase,'won',JSON.stringify({level,phase:r.phase,doses:r.doses,cleared:r.cleared}));curve.push({level,doses:r.doses,cleared:r.cleared,fall:E.LEVELS[level-1].fall,lock:E.LEVELS[level-1].lock,rewinds:E.LEVELS[level-1].rewinds});}
console.log(JSON.stringify({rules:'passed',curve},null,2));
