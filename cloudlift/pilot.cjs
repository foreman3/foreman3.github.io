const E=require('./engine.js');
// Same discrete keys a player uses; this route does not teleport actors or alter hazards.
function pilot(level,{cruise=235,delay=0,rough=0}={}){const s=E.create(level),events=[];let phase='rise',dest=1,old='',i=0;const push=(x,y,fire)=>{const key=[x,y,+fire].join(',');if(key!==old){events.push({tick:i,x,y,fire});old=key;}};
 for(;s.status==='playing'&&i<26000;i++){
  const p=s.pads[dest],target=dest===0?0:Math.min(4,s.aboard+p.left);let x=0,y=0,fire=true;
  if(phase==='rise'){y=s.y>cruise+10?-1:s.y<cruise-10?1:0;if(Math.abs(s.y-cruise)<13&&Math.abs(s.vy)<65)phase='cross';}
  if(phase==='cross'){const d=p.x-s.x;x=Math.abs(d)>40?Math.sign(d):0;y=s.y>cruise+12?-1:s.y<cruise-12?1:0;if(Math.abs(d)<42&&Math.abs(s.vx)<80)phase='land';}
  if(phase==='land'){const d=p.x-s.x;x=Math.abs(d)>22?Math.sign(d):0;y=s.y<E.LAND?1:0;if(s.landed===p.id)phase='wait';}
  if(phase==='wait'){if(dest!==0&&s.face<0)x=1;if(dest===0?s.aboard===0:s.aboard>=target||!p.left){dest=dest?0:s.pads.findIndex(p=>p.left>0);if(dest<0)break;phase='rise';}}
  if(i<delay){x=0;y=0;fire=false;}if(s.hits<rough){x=s.x<410?1:0;y=1;fire=false;phase='rise';}push(x,y,fire);E.step(s,1/120,{x,y,fire});s.events.length=0;
 }return{s,events,ticks:i};}
if(require.main===module){for(let l=1;l<=7;l++){const p=pilot(l);console.log(JSON.stringify({level:l,status:p.s.status,time:p.s.time,hits:p.s.hits,hull:p.s.hull,saved:p.s.saved,x:p.s.x,y:p.s.y,events:p.events.length}));}}
module.exports=pilot;
