const R=require('./rules.js'),P=require('./physics.js'),pilot=require('./pilot.cjs');
const input={};let state;
globalThis.__marbleTest={rules:R,physics:P,input,get state(){return state;},start(l,score){state=P.create(R.levels[l-1],l,score);},step(dt){P.step(state,{x:input.touchX,y:input.touchY,brake:input.brake},dt);state.events.length=0;}};
const report={safe:R.levels.map((_,i)=>pilot(i+1)),fast:R.levels.map((_,i)=>pilot(i+1,{route:'fast',delay:.1})),recovery:pilot(5,{forced:2})};
console.log(JSON.stringify(report,null,2));
